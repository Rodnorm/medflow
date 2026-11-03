import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ProceduresState } from "./procedure.reducer";

export const selectProceduresState = createFeatureSelector<ProceduresState>('procedures');

export const selectAllProcedures = createSelector(
    selectProceduresState,
    (state) => state.procedures
);

export const selectProceduresLoading = createSelector(
    selectProceduresState,
    (state) => state.loading
);

export const selectProceduresError = createSelector(
    selectProceduresState,
    (state) => state.error
);

export const selectTotalProcedures = createSelector(
    selectAllProcedures,
    (procedures) => procedures.length
);

export const selectPlannedProcedures = createSelector(
    selectAllProcedures,
    (procedures) => procedures.filter((p) => p.status === 'planned').length
);

export const selectInProgressProcedures = createSelector(
    selectAllProcedures,
    (procedures) => procedures.filter((p) => p.status === 'in-progress').length
);

