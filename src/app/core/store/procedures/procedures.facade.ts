import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectAllProcedures,
  selectInProgressProcedures,
  selectPlannedProcedures,
  selectProcedureEntities,
  selectProceduresError,
  selectProceduresLoading,
  selectTotalProcedures,
} from './procedures.selectors';
import { ProceduresActions } from './procedures.action';
import { Procedure, ProcedureStatus } from '../../models/procedure/procedure.model';

@Injectable({
  providedIn: 'root',
})
export class ProceduresFacade {
  private readonly store = inject(Store);

  readonly error = this.store.selectSignal(selectProceduresError);
  readonly total = this.store.selectSignal(selectTotalProcedures);
  readonly procedures = this.store.selectSignal(selectAllProcedures);
  readonly loading = this.store.selectSignal(selectProceduresLoading);
  readonly planned = this.store.selectSignal(selectPlannedProcedures);
  readonly entities = this.store.selectSignal(selectProcedureEntities);
  readonly inProgress = this.store.selectSignal(selectInProgressProcedures);

  loadProcedures(): void {
    this.store.dispatch(ProceduresActions.loadProcedures());
  }

  updateStatus(id: string, newStatus: ProcedureStatus): void {
    this.store.dispatch(ProceduresActions.updateStatus({ id, newStatus }));
  }

  updateStatusSuccess(procedure: Procedure): void {
    this.store.dispatch(ProceduresActions.updateStatusSuccess({ procedure }));
  }

  moveProcedure(id: string, operatingRoom: string, scheduledDate: string): void {
    this.store.dispatch(ProceduresActions.moveProcedure({ id, operatingRoom, scheduledDate }));
  }

  clearError(): void {
    this.store.dispatch(ProceduresActions.clearError());
  }
}
