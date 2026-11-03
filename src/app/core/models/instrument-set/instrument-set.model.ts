export type InstrumentSetStatus = 'available' | 'in-use' | 'maintenance' | 'reserved' | 'cleaning';

export interface InstrumentSet {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly location: string;
    readonly updatedAt: string;
    readonly status: InstrumentSetStatus;
}

export const INSTRUMENT_TRANSITIONS: Record<InstrumentSetStatus, readonly InstrumentSetStatus[]> = {
    'available': ['reserved', 'maintenance'],
    'reserved': ['in-use', 'available'],
    'in-use': ['cleaning'],
    'cleaning': ['available'],
    'maintenance': ['available'],
};

export function canTransitionInstrumentSet(current: InstrumentSetStatus, next: InstrumentSetStatus): boolean {
    return INSTRUMENT_TRANSITIONS[current].includes(next)
}

export function getAvailableInstrumentSetTransitions(current: InstrumentSetStatus): readonly InstrumentSetStatus[] {
    return INSTRUMENT_TRANSITIONS[current];
}