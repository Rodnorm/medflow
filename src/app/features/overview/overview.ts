import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { Store } from '@ngrx/store';
import { InstrumentsStore } from '../../core/store/instruments/instruments.store';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../core/store/procedures/procedures.selectors';
import { ProceduresActions } from '../../core/store/procedures/procedures.action';
import { DonutChartComponent, ChartSegment } from '../../shared/components/chart/donut-chart';
import { BarChartComponent, BarDatum } from '../../shared/components/chart/bar-chart';
import { ActivityFeedComponent } from '../../shared/components/activity-feed/activity-feed';
import { ActivityStore } from '../../core/store/activity/activity.store';
import {
  collectRooms,
  hourlyLoad,
  resolveReferenceDay,
  utilizationByRoom,
} from '../../core/domain/schedule.rules';

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
    DonutChartComponent,
    BarChartComponent,
    ActivityFeedComponent,
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class OverviewComponent {
  private readonly store = inject(Store);
  private readonly instrumentStore = inject(InstrumentsStore);
  readonly activityStore = inject(ActivityStore);
  readonly recentActivities = this.activityStore.recentActivities;

  readonly procedures = this.store.selectSignal(selectAllProcedures);
  readonly proceduresError = this.store.selectSignal(selectProceduresError);
  readonly proceduresLoading = this.store.selectSignal(selectProceduresLoading);

  readonly instrumentsError = this.instrumentStore.error;
  readonly instrumentSets = this.instrumentStore.instruments;
  readonly instrumentsLoading = this.instrumentStore.loading;

  readonly error = computed(() => this.proceduresError() || this.instrumentsError());
  readonly loading = computed(() => this.proceduresLoading() || this.instrumentsLoading());

  readonly displayedColumns: string[] = [
    'code',
    'title',
    'scheduledDate',
    'operatingRoom',
    'status',
  ];

  readonly totalProcedures = computed(() => this.procedures().length);
  readonly plannedProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'planned').length,
  );
  readonly inProgressProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'in-progress').length,
  );
  readonly completedProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'completed').length,
  );
  readonly cancelledProcedures = computed(
    () => this.procedures().filter((p) => p.status === 'cancelled').length,
  );

  readonly totalInstruments = computed(() => this.instrumentSets().length);
  readonly availableSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'available').length,
  );
  readonly reservedSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'reserved').length,
  );
  readonly inUseSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'in-use').length,
  );
  readonly cleaningSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'cleaning').length,
  );
  readonly maintenanceSets = computed(
    () => this.instrumentSets().filter((i) => i.status === 'maintenance').length,
  );

  readonly procedureChartData = computed<readonly ChartSegment[]>(() => [
    {
      id: 'in-progress',
      label: 'In Progress',
      value: this.inProgressProcedures(),
      color: '#eab308',
    },
    { id: 'planned', label: 'Planned', value: this.plannedProcedures(), color: '#0284c7' },
    { id: 'cancelled', label: 'Cancelled', value: this.cancelledProcedures(), color: '#ef4444' },
    { id: 'completed', label: 'Completed', value: this.completedProcedures(), color: '#10b981' },
  ]);

  readonly instrumentChartData = computed<readonly ChartSegment[]>(() => [
    { id: 'available', label: 'Available', value: this.availableSets(), color: '#10b981' },
    { id: 'reserved', label: 'Reserved', value: this.reservedSets(), color: '#6366f1' },
    { id: 'in-use', label: 'In Use', value: this.inUseSets(), color: '#f59e0b' },
    { id: 'cleaning', label: 'Cleaning', value: this.cleaningSets(), color: '#06b6d4' },
    { id: 'maintenance', label: 'Maintenance', value: this.maintenanceSets(), color: '#ef4444' },
  ]);

  readonly recentProcedures = computed(() => {
    return [...this.procedures()]
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);
  });

  readonly referenceDay = computed(() => resolveReferenceDay(this.procedures(), new Date()));

  private readonly utilization = computed(() =>
    utilizationByRoom(this.procedures(), collectRooms(this.procedures()), this.referenceDay()),
  );

  readonly averageUtilization = computed(() => {
    const rooms = this.utilization();
    return rooms.length === 0
      ? 0
      : Math.round(rooms.reduce((total, room) => total + room.percent, 0) / rooms.length);
  });

  readonly utilizationChartData = computed<readonly BarDatum[]>(() =>
    this.utilization().map((room) => ({
      id: room.room,
      label: room.room,
      value: room.percent,
      color: room.percent >= 90 ? '#ef4444' : room.percent >= 70 ? '#f59e0b' : '#0284c7',
    })),
  );

  readonly hourlyChartData = computed<readonly BarDatum[]>(() =>
    hourlyLoad(this.procedures(), this.referenceDay()).map((count, hour) => ({
      id: `hour-${hour}`,
      label: String(hour).padStart(2, '0'),
      value: count,
      color: '#6366f1',
    })),
  );

  readonly peakHour = computed<BarDatum | null>(() => {
    const peak = this.hourlyChartData().reduce<BarDatum | null>(
      (best, datum) => (best === null || datum.value > best.value ? datum : best),
      null,
    );
    return peak && peak.value > 0 ? peak : null;
  });

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.store.dispatch(ProceduresActions.loadProcedures());
    this.instrumentStore.loadInstruments();
  }

  getPercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
}
