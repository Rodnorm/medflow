export type ProcedureStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';
export interface Procedure {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly scheduledDate: string;
  readonly operatingRoom: string;
  readonly status: ProcedureStatus;
  readonly durationMinutes?: number;
  readonly instrumentSetId: string | null;
}

export const PROCEDURE_TRANSITIONS: Record<ProcedureStatus, readonly ProcedureStatus[]> = {
  planned: ['in-progress', 'cancelled'],
  'in-progress': ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransitionProcedure(current: ProcedureStatus, next: ProcedureStatus): boolean {
  return PROCEDURE_TRANSITIONS[current].includes(next);
}

export function getAvailableProcedureTransitions(
  current: ProcedureStatus,
): readonly ProcedureStatus[] {
  return PROCEDURE_TRANSITIONS[current];
}
