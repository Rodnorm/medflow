import { InstrumentSet } from '../models/instrument-set/instrument-set.model';
import { Procedure } from '../models/procedure/procedure.model';
import { detectOperationalConflicts } from './conflict.detector';

function procedure(overrides: Partial<Procedure> & Pick<Procedure, 'id'>): Procedure {
  return {
    code: overrides.id.toUpperCase(),
    title: 'Procedure',
    operatingRoom: 'OR-1',
    scheduledDate: '2026-11-02T09:00:00.000Z',
    status: 'planned',
    instrumentSetId: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
    durationMinutes: 60,
    ...overrides,
  };
}

function instrument(status: InstrumentSet['status']): InstrumentSet {
  return {
    id: 'ins-1',
    code: 'INS-1',
    name: 'Test Set',
    location: 'Bay',
    status,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

describe('detectOperationalConflicts', () => {
  it('flags overlapping procedures in the same room as critical', () => {
    const alerts = detectOperationalConflicts(
      [
        procedure({ id: 'a' }),
        procedure({ id: 'b', scheduledDate: '2026-11-02T09:30:00.000Z' }),
      ],
      new Map(),
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ type: 'room-overlap', severity: 'critical' });
  });

  it('does not flag overlaps across rooms or touching windows', () => {
    const alerts = detectOperationalConflicts(
      [
        procedure({ id: 'a' }),
        procedure({ id: 'b', operatingRoom: 'OR-2' }),
        procedure({ id: 'c', scheduledDate: '2026-11-02T10:00:00.000Z' }),
      ],
      new Map(),
    );
    expect(alerts).toEqual([]);
  });

  it('ignores finished procedures', () => {
    const alerts = detectOperationalConflicts(
      [procedure({ id: 'a' }), procedure({ id: 'b', status: 'completed' })],
      new Map(),
    );
    expect(alerts).toEqual([]);
  });

  it('escalates maintenance sets to critical and cleaning sets to warning', () => {
    const planned = procedure({ id: 'a', instrumentSetId: 'ins-1' });
    const maintenance = detectOperationalConflicts([planned], new Map([['ins-1', instrument('maintenance')]]));
    const cleaning = detectOperationalConflicts([planned], new Map([['ins-1', instrument('cleaning')]]));
    expect(maintenance[0]).toMatchObject({ type: 'instrument-unready', severity: 'critical' });
    expect(cleaning[0]).toMatchObject({ type: 'instrument-unready', severity: 'warning' });
  });

  it('stays quiet when the instrument set is ready', () => {
    const alerts = detectOperationalConflicts(
      [procedure({ id: 'a', instrumentSetId: 'ins-1' })],
      new Map([['ins-1', instrument('available')]]),
    );
    expect(alerts).toEqual([]);
  });
});

