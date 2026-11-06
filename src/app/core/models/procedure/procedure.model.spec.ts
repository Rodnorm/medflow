import {
  canTransitionProcedure,
  getAvailableProcedureTransitions,
  planBulkTransition,
  Procedure,
} from './procedure.model';

function build(id: string, status: Procedure['status']): Procedure {
  return {
    id,
    code: id.toUpperCase(),
    title: id,
    operatingRoom: 'OR-1',
    scheduledDate: '2026-11-02T09:00:00.000Z',
    status,
    instrumentSetId: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

describe('Procedure Domain Rules', () => {
  it('should allow valid transitions from planned', () => {
    expect(canTransitionProcedure('planned', 'in-progress')).toBe(true);
    expect(canTransitionProcedure('planned', 'cancelled')).toBe(true);
  });

  it('should block invalid transitions', () => {
    expect(canTransitionProcedure('planned', 'completed')).toBe(false);
    expect(canTransitionProcedure('completed', 'in-progress')).toBe(false);
  });

  it('should list available transitions', () => {
    expect(getAvailableProcedureTransitions('in-progress')).toEqual(['completed']);
    expect(getAvailableProcedureTransitions('completed')).toEqual([]);
  });

  describe('planBulkTransition', () => {
    const procedures = [
      build('a', 'planned'),
      build('b', 'planned'),
      build('c', 'in-progress'),
      build('d', 'completed'),
    ];

    it('splits the selection into eligible and skipped procedures', () => {
      const plan = planBulkTransition(procedures, new Set(['a', 'c', 'd']), 'in-progress');
      expect(plan.eligible.map((p) => p.id)).toEqual(['a']);
      expect(plan.skipped.map((p) => p.id)).toEqual(['c', 'd']);
    });

    it('ignores ids that are not in the collection', () => {
      const plan = planBulkTransition(procedures, new Set(['missing']), 'cancelled');
      expect(plan.eligible).toEqual([]);
      expect(plan.skipped).toEqual([]);
    });

    it('marks everything eligible when every transition is valid', () => {
      const plan = planBulkTransition(procedures, new Set(['a', 'b']), 'cancelled');
      expect(plan.eligible).toHaveLength(2);
      expect(plan.skipped).toHaveLength(0);
    });
  });
});
