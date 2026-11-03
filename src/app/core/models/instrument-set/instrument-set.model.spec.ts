import { canTransitionInstrumentSet, getAvailableInstrumentSetTransitions } from './instrument-set.model';

describe('InstrumentSet Domain Rules', () => {
    it('should allow valid transitions', () => {
        expect(canTransitionInstrumentSet('in-use', 'cleaning')).toBe(true);
        expect(canTransitionInstrumentSet('available', 'reserved')).toBe(true);
    });

    it('should block invalid transitions', () => {
        expect(canTransitionInstrumentSet('available', 'in-use')).toBe(false);
        expect(canTransitionInstrumentSet('reserved', 'cleaning')).toBe(false);
    });

    it('should list available transitions', () => {
        expect(getAvailableInstrumentSetTransitions('in-use')).toEqual(['cleaning']);
        expect(getAvailableInstrumentSetTransitions('maintenance')).toEqual(['available']);
    });
});