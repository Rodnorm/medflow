import { MatButtonModule } from '@angular/material/button';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Component, computed, inject, input } from '@angular/core';
import { InstrumentsFacade } from '../../../core/store/instruments/instruments.facade';
import { ProceduresFacade } from '../../../core/store/procedures/procedures.facade';
import {
  getAvailableProcedureTransitions,
  ProcedureStatus,
} from '../../../core/models/procedure/procedure.model';

@Component({
  selector: 'app-procedure-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    StatusBadge,
  ],
  styleUrl: './procedure-detail.scss',
  templateUrl: './procedure-detail.html',
})
export class ProcedureDetailComponent {
  readonly id = input.required<string>();
  private readonly instrumentsFacade = inject(InstrumentsFacade);
  private readonly procedureFacade = inject(ProceduresFacade);

  readonly procedure = computed(() =>
    this.procedureFacade
      .procedures()
      .find((p) => p.id === this.id() || p.code.toLowerCase() === this.id().toLowerCase()),
  );

  readonly allocatedInstrument = computed(() => {
    const instId = this.procedure()?.instrumentSetId;
    return instId ? this.instrumentsFacade.instruments().find((i) => i.id === instId) : null;
  });

  readonly availableTransitions = computed(() => {
    const procedure = this.procedure();
    return procedure ? getAvailableProcedureTransitions(procedure.status) : [];
  });

  constructor() {
    this.procedureFacade.loadProcedures();
    this.instrumentsFacade.loadInstruments();
  }

  updateStatus(id: string, newStatus: ProcedureStatus): void {
    this.procedureFacade.updateStatus(id, newStatus);
  }
}
