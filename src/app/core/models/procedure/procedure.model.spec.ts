import { canTransitionProcedure, getAvailableProcedureTransitions } from "./procedure.model";


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
});