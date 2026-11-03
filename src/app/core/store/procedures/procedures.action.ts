import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Procedure, ProcedureStatus } from '../../models/procedure/procedure.model';
export const ProceduresActions = createActionGroup({
    source: 'Procedures',
    events: {
        'Load Procedures': emptyProps(),
        'Load Procedures Failure': props<{ error: string }>(),
        'Load Procedures Success': props<{ procedures: Procedure[] }>(),

        'Update Status Failure': props<{ error: string }>(),
        'Update Status Success': props<{ procedure: Procedure }>(),
        'Update Status': props<{ id: string, newStatus: ProcedureStatus }>(),

    }
});