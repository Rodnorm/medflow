import { createFeatureSelector, createSelector } from '@ngrx/store';
import { procedureAdapter, ProceduresState } from './procedure.reducer';

export const selectProceduresState = createFeatureSelector<ProceduresState>('procedures');

const { selectAll, selectEntities, selectTotal } = procedureAdapter.getSelectors();

export const selectAllProcedures = createSelector(selectProceduresState, selectAll);
export const selectProcedureEntities = createSelector(selectProceduresState, selectEntities);
export const selectTotalProcedures = createSelector(selectProceduresState, selectTotal);

export const selectProceduresLoading = createSelector(
  selectProceduresState,
  (state) => state.loading,
);

export const selectProceduresError = createSelector(selectProceduresState, (state) => state.error);

export const selectPlannedProcedures = createSelector(
  selectAllProcedures,
  (procedures) => procedures.filter((p) => p.status === 'planned').length,
);

export const selectInProgressProcedures = createSelector(
  selectAllProcedures,
  (procedures) => procedures.filter((p) => p.status === 'in-progress').length,
);

export const selectProceduresByRoom = (room: string) =>
  createSelector(selectAllProcedures, (procedures) =>
    procedures.filter((p) => p.operatingRoom === room),
  );

export const selectProceduresByStatus = (status: string) =>
  createSelector(selectAllProcedures, (procedures) =>
    procedures.filter((p) => p.status === status),
  );
