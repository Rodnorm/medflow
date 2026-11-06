import { Procedure } from '../models/procedure/procedure.model';
import {
  canPlaceProcedure,
  collectRooms,
  dayKeyToDate,
  findOverlappingProcedureIds,
  findRoomConflicts,
  hourlyLoad,
  isoAtMinutes,
  procedureDuration,
  resolveReferenceDay,
  shiftDayKey,
  snapToSlot,
  toDayKey,
  utilizationByRoom,
} from './schedule.rules';

function build(
  id: string,
  room: string,
  hour: number,
  overrides: Partial<Procedure> = {},
  minute = 0,
): Procedure {
  return {
    id,
    code: id.toUpperCase(),
    title: `Procedure ${id}`,
    operatingRoom: room,
    scheduledDate: new Date(2026, 10, 2, hour, minute).toISOString(),
    status: 'planned',
    instrumentSetId: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
    durationMinutes: 60,
    ...overrides,
  };
}

describe('schedule rules', () => {
  describe('day helpers', () => {
    it('round-trips day keys and shifts across month boundaries', () => {
      expect(toDayKey(new Date(2026, 10, 2, 23, 59))).toBe('2026-11-02');
      expect(dayKeyToDate('2026-11-02')?.getDate()).toBe(2);
      expect(shiftDayKey('2026-11-30', 1)).toBe('2026-12-01');
      expect(shiftDayKey('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('rejects malformed or impossible day keys', () => {
      expect(dayKeyToDate('02/11/2026')).toBeNull();
      expect(dayKeyToDate('2026-02-31')).toBeNull();
      expect(shiftDayKey('nonsense', 1)).toBe('nonsense');
    });

    it('builds an ISO timestamp from a day and minute offset', () => {
      const iso = isoAtMinutes('2026-11-02', 9 * 60 + 15);
      const date = new Date(iso);
      expect(toDayKey(date)).toBe('2026-11-02');
      expect(date.getHours()).toBe(9);
      expect(date.getMinutes()).toBe(15);
    });

    it('snaps to the nearest 15 minute slot', () => {
      expect(snapToSlot(7)).toBe(0);
      expect(snapToSlot(8)).toBe(15);
      expect(snapToSlot(62)).toBe(60);
    });
  });

  describe('durations', () => {
    it('falls back to the default when duration is missing or invalid', () => {
      expect(procedureDuration({ durationMinutes: undefined })).toBe(90);
      expect(procedureDuration({ durationMinutes: 0 })).toBe(90);
      expect(procedureDuration({ durationMinutes: 45 })).toBe(45);
    });
  });

  describe('room conflicts', () => {
    const base = [
      build('a', 'OR-1', 9),
      build('b', 'OR-1', 12),
      build('c', 'OR-2', 9),
      build('d', 'OR-1', 15, { status: 'cancelled' }),
    ];

    it('detects overlaps only inside the same room', () => {
      const candidate = { id: 'x', operatingRoom: 'OR-1', scheduledDate: base[0].scheduledDate };
      expect(findRoomConflicts(base, candidate).map((p) => p.id)).toEqual(['a']);
    });

    it('treats back-to-back procedures as compatible', () => {
      const candidate = {
        id: 'x',
        operatingRoom: 'OR-1',
        scheduledDate: build('x', 'OR-1', 10).scheduledDate,
        durationMinutes: 60,
      };
      expect(findRoomConflicts(base, candidate)).toEqual([]);
    });

    it('ignores cancelled procedures and the candidate itself', () => {
      const candidate = {
        id: 'a',
        operatingRoom: 'OR-1',
        scheduledDate: base[3].scheduledDate,
      };
      expect(findRoomConflicts(base, candidate)).toEqual([]);
    });

    it('collects every procedure involved in an overlap', () => {
      const procedures = [build('a', 'OR-1', 9), build('b', 'OR-1', 9, {}, 30), build('c', 'OR-1', 14)];
      expect([...findOverlappingProcedureIds(procedures)].sort()).toEqual(['a', 'b']);
    });
  });

  describe('placement', () => {
    const procedures = [build('a', 'OR-1', 9), build('b', 'OR-2', 9)];

    it('allows a free slot', () => {
      expect(
        canPlaceProcedure(procedures, procedures[0], 'OR-3', build('a', 'OR-3', 9).scheduledDate),
      ).toEqual({ ok: true });
    });

    it('rejects an occupied slot and names the blocking procedure', () => {
      const result = canPlaceProcedure(
        procedures,
        procedures[0],
        'OR-2',
        build('a', 'OR-2', 9, {}, 30).scheduledDate,
      );
      expect(result).toEqual({ ok: false, reason: 'OR-2 is already booked by B at that time.' });
    });

    it('only moves planned procedures', () => {
      const started = build('a', 'OR-1', 9, { status: 'in-progress' });
      const result = canPlaceProcedure([started], started, 'OR-3', started.scheduledDate);
      expect(result.ok).toBe(false);
    });

    it('rejects placements that run past midnight', () => {
      const result = canPlaceProcedure(
        procedures,
        procedures[0],
        'OR-3',
        build('a', 'OR-3', 23, {}, 30).scheduledDate,
      );
      expect(result).toEqual({ ok: false, reason: 'The procedure would run past midnight.' });
    });

    it('rejects an invalid timestamp', () => {
      expect(canPlaceProcedure(procedures, procedures[0], 'OR-3', 'not-a-date').ok).toBe(false);
    });
  });

  describe('analytics', () => {
    const procedures = [
      build('a', 'OR-1', 8, { durationMinutes: 120 }),
      build('b', 'OR-1', 12, { durationMinutes: 120, status: 'completed' }),
      build('c', 'OR-2', 9, { status: 'cancelled' }),
      build('d', 'OR-2', 9),
    ];

    it('computes room utilisation against the working window', () => {
      const result = utilizationByRoom(procedures, ['OR-1', 'OR-2', 'OR-3'], '2026-11-02');
      expect(result).toEqual([
        { room: 'OR-1', bookedMinutes: 240, percent: 25 },
        { room: 'OR-2', bookedMinutes: 60, percent: 6 },
        { room: 'OR-3', bookedMinutes: 0, percent: 0 },
      ]);
    });

    it('caps utilisation at 100 percent', () => {
      const heavy = [build('h', 'OR-1', 6, { durationMinutes: 1200 })];
      expect(utilizationByRoom(heavy, ['OR-1'], '2026-11-02')[0].percent).toBe(100);
    });

    it('buckets non-cancelled procedures by start hour', () => {
      const load = hourlyLoad(procedures, '2026-11-02');
      expect(load).toHaveLength(24);
      expect(load[8]).toBe(1);
      expect(load[9]).toBe(1);
      expect(load[12]).toBe(1);
      expect(load.reduce((total, count) => total + count, 0)).toBe(3);
    });
  });

  describe('rooms and reference day', () => {
    it('merges data rooms with the defaults in natural order', () => {
      const rooms = collectRooms([build('a', 'OR-12', 9), build('b', 'Hybrid-1', 9)]);
      expect(rooms.slice(0, 3)).toEqual(['Hybrid-1', 'OR-1', 'OR-2']);
      expect(rooms[rooms.length - 1]).toBe('OR-12');
      expect(rooms).toContain('OR-10');
    });

    it('prefers today when it has procedures', () => {
      const procedures = [build('a', 'OR-1', 9), build('b', 'OR-1', 9, { scheduledDate: new Date(2026, 10, 5, 9).toISOString() })];
      expect(resolveReferenceDay(procedures, new Date(2026, 10, 5, 12))).toBe('2026-11-05');
    });

    it('falls back to the busiest day, breaking ties by proximity to today', () => {
      const day5 = (id: string) => build(id, 'OR-1', 9, { scheduledDate: new Date(2026, 10, 5, 9).toISOString() });
      const busy = [build('a', 'OR-1', 9), build('b', 'OR-2', 9), day5('c')];
      expect(resolveReferenceDay(busy, new Date(2026, 10, 9))).toBe('2026-11-02');

      const tied = [build('a', 'OR-1', 9), day5('c')];
      expect(resolveReferenceDay(tied, new Date(2026, 10, 9))).toBe('2026-11-05');
      expect(resolveReferenceDay(tied, new Date(2026, 9, 1))).toBe('2026-11-02');
    });

    it('returns today when there are no procedures', () => {
      expect(resolveReferenceDay([], new Date(2026, 9, 1))).toBe('2026-10-01');
    });
  });
});
