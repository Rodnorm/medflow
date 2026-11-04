import {
  MatDialogRef,
  MatDialogClose,
  MatDialogTitle,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { DatePipe } from '@angular/common';
import { Actions, ofType } from '@ngrx/effects';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Procedure,
  ProcedureStatus,
  getAvailableProcedureTransitions,
} from '../../../core/models/procedure/procedure.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';

export interface ProcedureDialogData {
  procedure: Procedure;
}

@Component({
  selector: 'app-procedure-detail-dialog',
  imports: [
    DatePipe,
    StatusBadge,
    MatDialogClose,
    MatDialogTitle,
    MatButtonModule,
    MatDialogContent,
    MatDialogActions,
    MatProgressSpinnerModule,
  ],
  templateUrl: './procedure-detail-dialog.html',
  styleUrl: './procedure-detail-dialog.scss',
})
export class ProcedureDetailDialogComponent {
  readonly data = inject<ProcedureDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ProcedureDetailDialogComponent>);
  private readonly store = inject(Store);
  private readonly action$ = inject(Actions);

  readonly procedure = signal<Procedure>(this.data.procedure);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly showCancelConfirm = signal<boolean>(false);

  constructor() {
    this.action$
      .pipe(ofType(ProceduresActions.updateStatusSuccess), takeUntilDestroyed())
      .subscribe(({ procedure }) => {
        if (procedure.id === this.procedure().id) {
          this.loading.set(false);
          this.dialogRef.close(procedure);
        }
      });

    this.action$
      .pipe(ofType(ProceduresActions.updateStatusFailure), takeUntilDestroyed())
      .subscribe(({ error }) => {
        this.loading.set(false);
        this.error.set(error);
      });
  }

  get availableTransitions(): readonly ProcedureStatus[] {
    return getAvailableProcedureTransitions(this.procedure().status);
  }

  onSelectTransition(targetStatus: ProcedureStatus): void {
    if (targetStatus === 'cancelled') {
      this.showCancelConfirm.set(true);
      return;
    }
    this.executeTransition(targetStatus);
  }

  confirmCancellation(): void {
    this.executeTransition('cancelled');
  }

  private executeTransition(newStatus: ProcedureStatus): void {
    this.loading.set(true);
    this.error.set(null);

    this.store.dispatch(
      ProceduresActions.updateStatus({
        id: this.procedure().id,
        newStatus,
      }),
    );
  }
}
