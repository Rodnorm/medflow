import { Procedure } from '../models/procedure/procedure.model';

export const SLOT_MINUTES = 15;
export const DEFAULT_DURATION_MINUTES = 90;
export const MINUTES_PER_DAY = 1440;
export const UTILIZATION_WINDOW_MINUTES = 960;

export const DEFAULT_OPERATING_ROOMS: readonly string[] = Array.from(
  { length: 10 },
  (_, index) => `OR-${index + 1}`,
);

export type PlacementResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export interface RoomUtilization {
  readonly room: string;
  readonly bookedMinutes: number;
  readonly percent: number;
}

export interface PlacementCandidate {
  readonly id: string;
  readonly operatingRoom: string;
  readonly scheduledDate: string;
  readonly durationMinutes?: number;
}

const MS_PER_MINUTE = 60_000;

export function procedureDuration(procedure: Pick<Procedure, 'durationMinutes'>): number {
  return procedure.durationMinutes && procedure.durationMinutes > 0
    ? procedure.durationMinutes
    : DEFAULT_DURATION_MINUTES;
}

export function isActiveProcedure(procedure: Pick<Procedure, 'status'>): boolean {
  return procedure.status === 'planned' || procedure.status === 'in-progress';
}

export function minutesSinceMidnight(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.getHours() * 60 + date.getMinutes();
}

export function toDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dayKeyToDate(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) || toDayKey(date) !== key ? null : date;
}

export function shiftDayKey(key: string, days: number): string {
  const date = dayKeyToDate(key);
  if (!date) return key;
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

export function snapToSlot(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function isoAtMinutes(dayKey: string, minutes: number): string {
  const date = dayKeyToDate(dayKey) ?? new Date();
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date.toISOString();
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

export function findRoomConflicts(
  procedures: readonly Procedure[],
  candidate: PlacementCandidate,
): readonly Procedure[] {
  const start = Date.parse(candidate.scheduledDate);
  const end = start + procedureDuration(candidate) * MS_PER_MINUTE;

  return procedures.filter((procedure) => {
    if (procedure.id === candidate.id || !isActiveProcedure(procedure)) return false;
    if (procedure.operatingRoom !== candidate.operatingRoom) return false;
    const otherStart = Date.parse(procedure.scheduledDate);
    const otherEnd = otherStart + procedureDuration(procedure) * MS_PER_MINUTE;
    return overlaps(start, end, otherStart, otherEnd);
  });
}

export function findOverlappingProcedureIds(procedures: readonly Procedure[]): ReadonlySet<string> {
  const ids = new Set<string>();
  const active = procedures.filter(isActiveProcedure);

  for (const procedure of active) {
    const conflicts = findRoomConflicts(active, procedure);
    if (conflicts.length > 0) {
      ids.add(procedure.id);
      conflicts.forEach((conflict) => ids.add(conflict.id));
    }
  }

  return ids;
}

export function canPlaceProcedure(
  procedures: readonly Procedure[],
  procedure: Procedure,
  room: string,
  scheduledDate: string,
): PlacementResult {
  if (procedure.status !== 'planned') {
    return { ok: false, reason: 'Only planned procedures can be rescheduled.' };
  }

  const start = new Date(scheduledDate);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, reason: 'The requested start time is invalid.' };
  }

  if (minutesSinceMidnight(start) + procedureDuration(procedure) > MINUTES_PER_DAY) {
    return { ok: false, reason: 'The procedure would run past midnight.' };
  }

  const [conflict] = findRoomConflicts(procedures, {
    id: procedure.id,
    operatingRoom: room,
    scheduledDate,
    durationMinutes: procedure.durationMinutes,
  });

  if (conflict) {
    return { ok: false, reason: `${room} is already booked by ${conflict.code} at that time.` };
  }

  return { ok: true };
}

export function collectRooms(
  procedures: readonly Procedure[],
  baseRooms: readonly string[] = DEFAULT_OPERATING_ROOMS,
): readonly string[] {
  const rooms = new Set<string>(baseRooms);
  procedures.forEach((procedure) => rooms.add(procedure.operatingRoom));
  return [...rooms].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function utilizationByRoom(
  procedures: readonly Procedure[],
  rooms: readonly string[],
  dayKey: string,
): readonly RoomUtilization[] {
  return rooms.map((room) => {
    const bookedMinutes = procedures
      .filter(
        (procedure) =>
          procedure.operatingRoom === room &&
          procedure.status !== 'cancelled' &&
          toDayKey(procedure.scheduledDate) === dayKey,
      )
      .reduce((total, procedure) => total + procedureDuration(procedure), 0);

    return {
      room,
      bookedMinutes,
      percent: Math.min(100, Math.round((bookedMinutes / UTILIZATION_WINDOW_MINUTES) * 100)),
    };
  });
}

export function hourlyLoad(procedures: readonly Procedure[], dayKey: string): readonly number[] {
  const buckets = Array.from({ length: 24 }, () => 0);

  for (const procedure of procedures) {
    if (procedure.status === 'cancelled' || toDayKey(procedure.scheduledDate) !== dayKey) continue;
    buckets[new Date(procedure.scheduledDate).getHours()] += 1;
  }

  return buckets;
}

export function resolveReferenceDay(procedures: readonly Procedure[], today: Date): string {
  const todayKey = toDayKey(today);
  const counts = new Map<string, number>();

  for (const procedure of procedures) {
    const key = toDayKey(procedure.scheduledDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0 || counts.has(todayKey)) return todayKey;

  const distanceToToday = (key: string): number =>
    Math.abs((dayKeyToDate(key)?.getTime() ?? 0) - (dayKeyToDate(todayKey)?.getTime() ?? 0));

  return [...counts.entries()].sort(
    ([keyA, countA], [keyB, countB]) =>
      countB - countA || distanceToToday(keyA) - distanceToToday(keyB) || keyA.localeCompare(keyB),
  )[0][0];
}