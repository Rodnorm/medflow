import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProcedureService } from '../../core/services/procedure/procedure.service';
import { InstrumentSetService } from '../../core/services/instrument-set/instrument-set.service';
import { Procedure } from '../../core/models/procedure/procedure.model';
import { InstrumentSet } from '../../core/models/instrument-set/instrument-set.model';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-overview',
  imports: [
    RouterLink,
    DatePipe,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatTableModule,
    MatProgressSpinner,
    MatProgressBarModule,
    MetricCard,
    StatusBadge,
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class OverviewComponent {
  private readonly procedureService = inject(ProcedureService);
  private readonly instrumentSetService = inject(InstrumentSetService);

  readonly procedures = signal<readonly Procedure[]>([]);
  readonly instrumentSets = signal<readonly InstrumentSet[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly displayedColumns: string[] = ['code', 'title', 'scheduledDate', 'operatingRoom', 'status'];

  readonly totalProcedures = computed(() => this.procedures().length);
  readonly plannedProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'planned').length
  );
  readonly inProgressProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'in-progress').length
  );
  readonly completedProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'completed').length
  );
  readonly cancelledProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'cancelled').length
  );

  readonly totalInstruments = computed(() => this.instrumentSets().length);
  readonly availableSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'available').length
  );
  readonly reservedSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'reserved').length
  );
  readonly inUseSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'in-use').length
  );
  readonly cleaningSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'cleaning').length
  );
  readonly maintenanceSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'maintenance').length
  );

  readonly recentProcedures = computed(() => {
    return [...this.procedures()]
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.procedureService.getProcedures().subscribe({
      next: (procs) => {
        this.procedures.set(procs);
        this.instrumentSetService.getInstrumentSets().subscribe({
          next: (sets) => {
            this.instrumentSets.set(sets);
            this.loading.set(false);
          },
          error: (err: Error) => {
            this.error.set(err.message ?? 'Failed to load instrument sets');
            this.loading.set(false);
          },
        });
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load procedures');
        this.loading.set(false);
      },
    });
  }

  getPercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
}
