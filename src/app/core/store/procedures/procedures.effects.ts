import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { ActivityStore } from '../activity/activity.store';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { ProceduresActions } from './procedures.action';
import { PROCEDURE_API_TOKEN } from '../../api/api.tokens';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { ProcedureStatusPayload } from '../../models/realtime/realtime.model';
import { canTransitionProcedure, Procedure } from '../../models/procedure/procedure.model';
import { selectProcedureEntities } from './procedures.selectors';

@Injectable()
export class ProceduresEffects {
  private readonly actions$ = inject(Actions);
  private readonly procedureService = inject(PROCEDURE_API_TOKEN);
  private readonly activityStore = inject(ActivityStore);
  private readonly realtimeService = inject(RealtimeService);
  private readonly store = inject(Store);

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

  realtimeProcedureUpdate$ = createEffect(() =>
    this.realtimeService.event$.pipe(
      filter((event) => event.type === 'PROCEDURE_STATUS_CHANGED'),
      withLatestFrom(this.store.select(selectProcedureEntities)),
      filter(([event, entities]) => {
        const payload = event.payload as ProcedureStatusPayload;
        const existing = entities[payload.procedureId];
        return (
          !existing ||
          (Date.parse(payload.updatedAt) > Date.parse(existing.updatedAt) &&
            canTransitionProcedure(existing.status, payload.status))
        );
      }),
      map(([event, entities]) => {
        const payload = event.payload as ProcedureStatusPayload;
        const existing = entities[payload.procedureId];
        if (existing) {
          const updated: Procedure = {
            ...existing,
            status: payload.status,
            updatedAt: payload.updatedAt,
          };
          return ProceduresActions.updateStatusSuccess({ procedure: updated });
        }
        return ProceduresActions.loadProcedures();
      }),
    ),
  );
}
