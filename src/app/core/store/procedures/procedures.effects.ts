import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { ActivityStore } from '../activity/activity.store';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ProcedureService } from '../../services/procedure/procedure.service';
import { ProceduresActions } from './procedures.action';

@Injectable()
export class ProceduresEffects {
  private readonly actions$ = inject(Actions);
  private readonly procedureService = inject(ProcedureService);
  private readonly activityStore = inject(ActivityStore);

  loadProcedures$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProceduresActions.loadProcedures),
      switchMap(() =>
        this.procedureService.getProcedures().pipe(
          map((procedures) =>
            ProceduresActions.loadProceduresSuccess({ procedures: [...procedures] }),
          ),
          catchError((err: Error) =>
            of(ProceduresActions.loadProceduresFailure({ error: err.message })),
          ),
        ),
      ),
    ),
  );

  updateStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProceduresActions.updateStatus),
      switchMap(({ id, newStatus }) =>
        this.procedureService.updateStatus(id, newStatus).pipe(
          map((procedure) => ProceduresActions.updateStatusSuccess({ procedure })),
          catchError((err: Error) =>
            of(ProceduresActions.updateStatusFailure({ error: err.message })),
          ),
        ),
      ),
    ),
  );

  recordStatusChangeActivity$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProceduresActions.updateStatusSuccess),
        tap(({ procedure }) => {
          this.activityStore.recordEvent({
            type: 'procedure_status_changed',
            title: `Procedure ${procedure.status.toUpperCase()}`,
            description: `${procedure.title} updated to "${procedure.status}" in ${procedure.operatingRoom}`,
            entityId: procedure.id,
            entityCode: procedure.code,
            toStatus: procedure.status,
            author: 'Nurse Coordinator (Live)',
          });
        }),
      ),
    { dispatch: false },
  );
}
