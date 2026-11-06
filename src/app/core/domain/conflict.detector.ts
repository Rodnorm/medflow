import { InstrumentSet } from '../models/instrument-set/instrument-set.model';
import { Procedure } from '../models/procedure/procedure.model';

export type AlertSeverity = 'critical' | 'warning';

export interface OperationalAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  procedureId: string;
  instrumentSetId?: string;
  severity: AlertSeverity;
  type: 'room-overlap' | 'instrument-unready';
}

export function detectOperationalConflicts(
  procedures: readonly Procedure[],
  instrumentsMap: Map<string, InstrumentSet>,
): readonly OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  const activeProcedures = procedures.filter(
    (p) => p.status === 'planned' || p.status === 'in-progress',
  );

  for (let i = 0; i < activeProcedures.length; i++) {
    const a = activeProcedures[i];
    const startA = new Date(a.scheduledDate).getTime();
    const durationA = (a.durationMinutes || 90) * 60 * 1000;
    const endA = startA + durationA;

    for (let j = i + 1; j < activeProcedures.length; j++) {
      const b = activeProcedures[j];
      if (a.operatingRoom === b.operatingRoom) {
        const startB = new Date(b.scheduledDate).getTime();
        const durationB = (b.durationMinutes || 90) * 60 * 1000;
        const endB = startB + durationB;

        if (startA < endB && endA > startB) {
          alerts.push({
            procedureId: a.id,
            severity: 'critical',
            type: 'room-overlap',
            id: `overlap-${a.id}-${b.id}`,
            timestamp: new Date().toISOString(),
            title: `Room Overlap in ${a.operatingRoom}`,
            message: `Procedures "${a.code}" and "${b.code}" are scheduled at conflicting times in ${a.operatingRoom}.`,
          });
        }
      }
    }

    if (a.instrumentSetId) {
      const set = instrumentsMap.get(a.instrumentSetId);

      if (set && (set.status === 'cleaning' || set.status === 'maintenance')) {
        alerts.push({
          id: `unready-inst-${a.id}`,
          severity: set.status === 'maintenance' ? 'critical' : 'warning',
          type: 'instrument-unready',
          title: `Instrument Set Unavailable: ${set.code}`,
          message: `Procedure "${a.code}" requires "${set.name}", but the set is currently in ${set.status}.`,
          procedureId: a.id,
          instrumentSetId: set.id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return alerts;
}
