import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Subject } from 'rxjs';
import { INITIAL_PROCEDURES } from '../../data/synthetic-data';
import { Procedure } from '../../models/procedure/procedure.model';
import { RealtimeEvent } from '../../models/realtime/realtime.model';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { selectProcedureEntities } from './procedures.selectors';
import { ProceduresEffects } from './procedures.effects';
import { ProceduresActions } from './procedures.action';

describe('ProceduresEffects realtime validation', () => {
  const procedure = INITIAL_PROCEDURES[0];
  let events: Subject<RealtimeEvent>;

  function setup(current: Procedure) {
    events = new Subject<RealtimeEvent>();
    TestBed.configureTestingModule({
      providers: [
        ProceduresEffects,
        provideMockActions(() => new Subject<Action>()),
        provideMockStore({
          selectors: [{ selector: selectProcedureEntities, value: { [current.id]: current } }],
        }),
        { provide: RealtimeService, useValue: { event$: events } },
      ],
    });
    const results: Action[] = [];
    TestBed.inject(ProceduresEffects).realtimeProcedureUpdate$.subscribe((action) =>
      results.push(action),
    );
    return results;
  }

  function emit(status: Procedure['status'], updatedAt: string) {
    events.next({
      id: 'test-event',
      type: 'PROCEDURE_STATUS_CHANGED',
      timestamp: updatedAt,
      payload: { procedureId: procedure.id, status, updatedAt },
    });
  }

  it('ignores stale events and repeated statuses', () => {
    const results = setup({
      ...procedure,
      status: 'in-progress',
      updatedAt: '2026-11-05T10:00:00Z',
    });
    emit('completed', '2026-11-05T09:00:00Z');
    emit('in-progress', '2026-11-05T11:00:00Z');
    expect(results).toEqual([]);
  });

  it('does not regress a terminal state even with a newer event', () => {
    const results = setup({ ...procedure, status: 'completed' });
    emit('in-progress', '2099-01-01T00:00:00Z');
    expect(results).toEqual([]);
  });

  it('accepts a newer valid transition', () => {
    const current = { ...procedure, status: 'planned' as const };
    const results = setup(current);
    emit('in-progress', '2099-01-01T00:00:00Z');
    expect(results).toEqual([
      ProceduresActions.updateStatusSuccess({
        procedure: { ...current, status: 'in-progress', updatedAt: '2099-01-01T00:00:00Z' },
      }),
    ]);
  });
});
