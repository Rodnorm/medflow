import { createReducer, on } from "@ngrx/store";
import { Procedure } from "../../models/procedure/procedure.model";
import { ProceduresActions } from "./procedures.action";

export interface ProceduresState {
    loading: boolean;
    error: string | null;
    procedures: Procedure[];
}

export const initialProceduresState: ProceduresState = {
    error: null,
    loading: false,
    procedures: [],
}

export const procedureReducer = createReducer(
    initialProceduresState,
    on(ProceduresActions.loadProcedures, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ProceduresActions.loadProceduresSuccess, (state, { procedures }) => ({
        ...state,
        loading: false,
        procedures: [...procedures],
    })),

    on(ProceduresActions.loadProceduresFailure, (state, { error }) => ({
        ...state,
        error,
        loading: false
    })),

    on(ProceduresActions.updateStatus, (state) => ({
        ...state,
        error: null,
        loading: true,
    })),

    on(ProceduresActions.updateStatusSuccess, (state, { procedure }) => ({
        ...state,
        loading: false,
        procedures: state.procedures.map((p) => (p.id === procedure.id ? procedure : p)),
    })),

    on(ProceduresActions.updateStatusFailure, (state, { error }) => ({
        ...state,
        error,
        loading: false
    }))


)