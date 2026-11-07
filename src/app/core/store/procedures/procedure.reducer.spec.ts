import { procedureAdapter, procedureReducer, initialProceduresState } from './procedure.reducer';
import { ProceduresActions } from './procedures.action';
import { Procedure } from '../../models/procedure/procedure.model';

const procedure: Procedure = {
  id: 'prc-1',
  code: 'PRC-1',
  title: 'Test',
  operatingRoom: 'OR-1',
  scheduledDate: '2026-11-02T09:00:00.000Z',
  status: 'planned',
  instrumentSetId: null,
  updatedAt: '2026-11-01T00:00:00.000Z',
};

describe('procedureReducer', () => {
  const loaded = procedureReducer(
    initialProceduresState,
    ProceduresActions.loadProceduresSuccess({ procedures: [procedure] }),
  );

  it('stores loaded procedures as entities', () => {
    expect(procedureAdapter.getSelectors().selectAll(loaded)).toEqual([procedure]);
    expect(loaded.loading).toBe(false);
  });

  it('flags loading and resets the error when a load starts', () => {
    const failed = procedureReducer(loaded, ProceduresActions.loadProceduresFailure({ error: 'boom' }));
    expect(failed.error).toBe('boom');
    const retrying = procedureReducer(failed, ProceduresActions.loadProcedures());
    expect(retrying.loading).toBe(true);
    expect(retrying.error).toBeNull();
  });

  it('applies a status update to a single entity', () => {
    const updated = { ...procedure, status: 'in-progress' as const };
    const state = procedureReducer(loaded, ProceduresActions.updateStatusSuccess({ procedure: updated }));
    expect(state.entities['prc-1']?.status).toBe('in-progress');
    expect(state.loading).toBe(false);
  });

  it('applies a move without toggling the global loading flag', () => {
    const moved = { ...procedure, operatingRoom: 'OR-4', scheduledDate: '2026-11-02T10:15:00.000Z' };
    const requested = procedureReducer(
      loaded,
      ProceduresActions.moveProcedure({ id: 'prc-1', operatingRoom: 'OR-4', scheduledDate: moved.scheduledDate }),
    );
    expect(requested.loading).toBe(false);

    const state = procedureReducer(requested, ProceduresActions.moveProcedureSuccess({ procedure: moved }));
    expect(state.entities['prc-1']).toMatchObject({ operatingRoom: 'OR-4', scheduledDate: moved.scheduledDate });
  });

  it('records move failures and clears them on demand', () => {
    const failed = procedureReducer(loaded, ProceduresActions.moveProcedureFailure({ error: 'Slot taken' }));
    expect(failed.error).toBe('Slot taken');
    expect(failed.entities['prc-1']).toEqual(procedure);

    const cleared = procedureReducer(failed, ProceduresActions.clearError());
    expect(cleared.error).toBeNull();
  });
});

