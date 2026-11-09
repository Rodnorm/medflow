import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  getAvailableInstrumentSetTransitions,
  InstrumentSetStatus,
} from '../../../core/models/instrument-set/instrument-set.model';
import { isActiveProcedure } from '../../../core/domain/schedule.rules';
import { ActivityStore } from '../../../core/store/activity/activity.store';
import { InstrumentsFacade } from '../../../core/store/instruments/instruments.facade';
import { ProceduresFacade } from '../../../core/store/procedures/procedures.facade';
import { ActivityFeedComponent } from '../../../shared/components/activity-feed/activity-feed';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-instrument-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatusBadge,
    ActivityFeedComponent,
    EmptyStateComponent,
  ],
  styleUrl: './instrument-detail.scss',
  templateUrl: './instrument-detail.html',
})
export class InstrumentDetailComponent {
  readonly id = input.required<string>();

  private readonly instrumentsFacade = inject(InstrumentsFacade);
  private readonly proceduresFacade = inject(ProceduresFacade);
  private readonly activityStore = inject(ActivityStore);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly loading = this.instrumentsFacade.loading;
  readonly error = this.instrumentsFacade.error;

  readonly instrument = computed(() => {
    const requested = this.id().toLowerCase();
    return this.instrumentsFacade
      .instruments()
      .find((set) => set.id.toLowerCase() === requested || set.code.toLowerCase() === requested);
  });

  readonly transitions = computed(() => {
    const set = this.instrument();
    return set ? getAvailableInstrumentSetTransitions(set.status) : [];
  });

  private readonly allocated = computed(() => {
    const set = this.instrument();
    if (!set) return [];
    return this.proceduresFacade
      .procedures()
      .filter((procedure) => procedure.instrumentSetId === set.id)
      .sort((a, b) => Date.parse(a.scheduledDate) - Date.parse(b.scheduledDate));
  });

  readonly upcoming = computed(() => this.allocated().filter(isActiveProcedure));
  readonly history = computed(() =>
    this.allocated()
      .filter((procedure) => !isActiveProcedure(procedure))
      .reverse(),
  );

  readonly events = computed(() => {
    const set = this.instrument();
    return set ? this.activityStore.activities().filter((event) => event.entityId === set.id) : [];
  });

  constructor() {
    this.instrumentsFacade.loadInstruments();
    this.proceduresFacade.loadProcedures();
  }

  retry(): void {
    this.instrumentsFacade.loadInstruments();
  }

  transition(target: InstrumentSetStatus): void {
    const set = this.instrument();
    if (!set) return;

    if (target === 'maintenance' && this.upcoming().length > 0) {
      this.confirmDialog
        .confirm({
          title: `Send ${set.code} to maintenance?`,
          message: `${this.upcoming().length} upcoming procedures reserve this set.`,
          detail: 'They will be flagged as conflicts until the set is available again.',
          confirmLabel: 'Send to maintenance',
          tone: 'danger',
        })
        .subscribe((confirmed) => {
          if (confirmed) this.instrumentsFacade.updateStatus(set, target);
        });
      return;
    }

    this.instrumentsFacade.updateStatus(set, target);
  }
}

