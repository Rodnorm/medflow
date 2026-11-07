import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { of, Subject, throwError, timer, map } from 'rxjs';
import { vi } from 'vitest';
import { PROCEDURE_API_TOKEN } from '../../api/api.tokens';
import { INITIAL_PROCEDURES } from '../../data/synthetic-data';
import { Procedure } from '../../models/procedure/procedure.model';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { ActivityStore } from '../activity/activity.store';
import { ProceduresEffects } from './procedures.effects';
import { ProceduresActions } from './procedures.action';

describe('ProceduresEffects commands', () => {
  const base = INITIAL_PROCEDURES[0];
  const api = { updateStatus: vi.fn(), moveProcedure: vi.fn(), getProcedures: vi.fn() };
  let actions$: Subject<Action>;

  function setup() {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        ProceduresEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: PROCEDURE_API_TOKEN, useValue: api },
        { provide: RealtimeService, useValue: { event$: new Subject() } },
      ],
    });
    return TestBed.inject(ProceduresEffects);
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('processes concurrent status updates instead of cancelling earlier ones', () => {
    vi.useFakeTimers();
    api.updateStatus.mockImplementation((id: string) =>
      timer(100).pipe(map(() => ({ ...base, id, status: 'in-progress' as const }))),
    );
    const effects = setup();
    const results: Action[] = [];
    effects.updateStatus$.subscribe((action) => results.push(action));

    actions$.next(ProceduresActions.updateStatus({ id: 'a', newStatus: 'in-progress' }));
    actions$.next(ProceduresActions.updateStatus({ id: 'b', newStatus: 'in-progress' }));
    vi.advanceTimersByTime(100);

    expect(results.map((action) => (action as ReturnType<typeof ProceduresActions.updateStatusSuccess>).procedure.id)).toEqual(['a', 'b']);
    vi.useRealTimers();
  });

  it('turns a rejected status update into a failure action', () => {
    api.updateStatus.mockReturnValue(throwError(() => new Error('Cannot transition')));
    const effects = setup();
    const results: Action[] = [];
    effects.updateStatus$.subscribe((action) => results.push(action));

    actions$.next(ProceduresActions.updateStatus({ id: 'a', newStatus: 'completed' }));
    expect(results).toEqual([ProceduresActions.updateStatusFailure({ error: 'Cannot transition' })]);
  });

  it('moves a procedure and reports success', () => {
    const moved: Procedure = { ...base, operatingRoom: 'OR-4' };
    api.moveProcedure.mockReturnValue(of(moved));
    const effects = setup();
    const results: Action[] = [];
    effects.moveProcedure$.subscribe((action) => results.push(action));

    actions$.next(ProceduresActions.moveProcedure({ id: base.id, operatingRoom: 'OR-4', scheduledDate: base.scheduledDate }));
    expect(api.moveProcedure).toHaveBeenCalledWith(base.id, 'OR-4', base.scheduledDate);
    expect(results).toEqual([ProceduresActions.moveProcedureSuccess({ procedure: moved })]);
  });

  it('reports a move failure and keeps processing later moves', () => {
    api.moveProcedure
      .mockReturnValueOnce(throwError(() => new Error('OR-4 is already booked by X at that time.')))
      .mockReturnValueOnce(of(base));
    const effects = setup();
    const results: Action[] = [];
    effects.moveProcedure$.subscribe((action) => results.push(action));

    actions$.next(ProceduresActions.moveProcedure({ id: base.id, operatingRoom: 'OR-4', scheduledDate: base.scheduledDate }));
    actions$.next(ProceduresActions.moveProcedure({ id: base.id, operatingRoom: 'OR-1', scheduledDate: base.scheduledDate }));

    expect(results).toEqual([
      ProceduresActions.moveProcedureFailure({ error: 'OR-4 is already booked by X at that time.' }),
      ProceduresActions.moveProcedureSuccess({ procedure: base }),
    ]);
  });

  it('logs a reschedule in the activity feed', () => {
    const effects = setup();
    const activity = TestBed.inject(ActivityStore);
    effects.recordRescheduleActivity$.subscribe();

    actions$.next(ProceduresActions.moveProcedureSuccess({ procedure: { ...base, operatingRoom: 'OR-6' } }));

    expect(activity.activities()[0]).toMatchObject({
      type: 'procedure_rescheduled',
      entityId: base.id,
      description: expect.stringContaining('OR-6'),
    });
  });
});

