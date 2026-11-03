import { Component, inject, signal } from "@angular/core";
import { getAvailableProcedureTransitions, Procedure, ProcedureStatus } from "../../../core/models/procedure/procedure.model";
import { DatePipe } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ProcedureService } from "../../../core/services/procedure/procedure.service";
import { StatusBadge } from "../../../shared/components/status-badge/status-badge";

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
    styleUrl: './procedure-detail-dialog.scss'
})

export class ProcedureDetailDialogComponent {
    readonly data = inject<ProcedureDialogData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<ProcedureDetailDialogComponent>);
    private readonly procedureService = inject(ProcedureService);

    readonly procedure = signal<Procedure>(this.data.procedure);
    readonly loading = signal<boolean>(false);
    readonly error = signal<string | null>(null);
    readonly showCancelConfirm = signal<boolean>(false);


    get availableTransitions(): readonly ProcedureStatus[] {
        return getAvailableProcedureTransitions(this.procedure().status)
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

        this.procedureService.updateStatus(this.procedure().id, newStatus).subscribe({
            next: (updated) => {
                this.loading.set(false);
                this.procedure.set(updated);
                this.dialogRef.close(updated);
            },
            error: (err: Error) => {
                this.loading.set(false);
                this.error.set(err.message ?? 'Failed to update status');
            }
        })
    }
}