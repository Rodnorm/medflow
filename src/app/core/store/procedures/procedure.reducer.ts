import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { Procedure } from '../../models/procedure/procedure.model';
import { ProceduresActions } from './procedures.action';

export interface ProceduresState extends EntityState<Procedure> {
  loading: boolean;
  error: string | null;
}

export const procedureAdapter: EntityAdapter<Procedure> = createEntityAdapter<Procedure>({
  selectId: (procedure: Procedure) => procedure.id,
  sortComparer: false,
});

export const initialProceduresState: ProceduresState = procedureAdapter.getInitialState({
  error: null,
  loading: false,
});

export const procedureReducer = createReducer(
  initialProceduresState,
  on(ProceduresActions.loadProcedures, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ProceduresActions.loadProceduresSuccess, (state, { procedures }) =>
    procedureAdapter.setAll(procedures, { ...state, loading: false }),
  ),

  on(ProceduresActions.loadProceduresFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  on(ProceduresActions.updateStatus, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),

  on(ProceduresActions.updateStatusSuccess, (state, { procedure }) =>
    procedureAdapter.updateOne(
      { id: procedure.id, changes: procedure },
      { ...state, loading: false },
    ),
  ),

  on(ProceduresActions.updateStatusFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
);
