import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  planBulkTransition,
  Procedure,
  ProcedureStatus,
} from '../../../core/models/procedure/procedure.model';
import { InstrumentSet } from '../../../core/models/instrument-set/instrument-set.model';
import { dayKeyToDate, toDayKey } from '../../../core/domain/schedule.rules';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../../core/store/procedures/procedures.selectors';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';
import { InstrumentsStore } from '../../../core/store/instruments/instruments.store';
import {
  PreferencesStore,
  SavedView,
  TableDensity,
} from '../../../core/store/preferences/preferences.store';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ProcedureDetailDialogComponent } from '../procedure-detail-dialog/procedure-detail-dialog';

export type StatusFilterOption = 'all' | ProcedureStatus;

interface OptionalColumn {
  readonly id: string;
  readonly label: string;
}

interface BulkAction {
  readonly target: ProcedureStatus;
  readonly label: string;
  readonly icon: string;
  readonly tone: 'primary' | 'danger';
}

@Component({
  selector: 'app-procedure-list',
  imports: [
    DatePipe,
    StatusBadge,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterLink,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './procedure-list.html',
  styleUrl: './procedure-list.scss',
})
export class ProcedureListComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly instrumentStore = inject(InstrumentsStore);
  readonly preferences = inject(PreferencesStore);

  readonly error = this.store.selectSignal(selectProceduresError);
  readonly loading = this.store.selectSignal(selectProceduresLoading);
  readonly rawProcedures = this.store.selectSignal(selectAllProcedures);

  readonly instrumentsMap = computed(() => {
    const map = new Map<string, InstrumentSet>();
    for (const set of this.instrumentStore.instruments()) {
      map.set(set.id, set);
    }
    return map;
  });

  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<StatusFilterOption>('all');
  readonly dateFrom = signal<Date | null>(null);
  readonly dateTo = signal<Date | null>(null);

  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly sortField = signal<string>('scheduledDate');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly selectedIds = signal<ReadonlySet<string>>(new Set<string>());
  readonly expandedId = signal<string | null>(null);
  readonly savingView = signal<boolean>(false);
  readonly viewName = signal<string>('');

  private readonly searchInput$ = new Subject<string>();

  readonly optionalColumns: readonly OptionalColumn[] = [
    { id: 'scheduledDate', label: 'Scheduled time' },
    { id: 'operatingRoom', label: 'Theater' },
    { id: 'instrumentSetId', label: 'Instrument set' },
    { id: 'status', label: 'Status' },
  ];

  readonly bulkActions: readonly BulkAction[] = [
    { target: 'in-progress', label: 'Start', icon: 'play_arrow', tone: 'primary' },
    { target: 'completed', label: 'Complete', icon: 'check', tone: 'primary' },
    { target: 'cancelled', label: 'Cancel', icon: 'block', tone: 'danger' },
  ];

  readonly detailColumns: string[] = ['expandedDetail'];

  private readonly table = viewChild(MatTable);

  readonly isExpandedRow = (_index: number, row: Procedure): boolean =>
    row.id === this.expandedId();

  readonly displayedColumns = computed<string[]>(() => {
    const hidden = this.preferences.hiddenColumnSet();
    return [
      'select',
      'expand',
      'code',
      'title',
      ...this.optionalColumns.map((column) => column.id).filter((id) => !hidden.has(id)),
      'actions',
    ];
  });

  readonly filteredProcedures = computed(() => {
    const status = this.selectedStatus();
    const search = this.searchTerm().trim().toLowerCase();
    const from = this.dateFrom() ? toDayKey(this.dateFrom() as Date) : null;
    const to = this.dateTo() ? toDayKey(this.dateTo() as Date) : null;

    return this.rawProcedures().filter((p) => {
      const matchesStatus = status === 'all' || p.status === status;
      const matchesSearch =
        !search || p.code.toLowerCase().includes(search) || p.title.toLowerCase().includes(search);
      const day = toDayKey(p.scheduledDate);
      const matchesFrom = !from || day >= from;
      const matchesTo = !to || day <= to;

      return matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  });

  readonly paginatedProcedures = computed(() => {
    const list = [...this.filteredProcedures()];
    const field = this.sortField();
    const dir = this.sortDirection();

    list.sort((a, b) => {
      let valA = (a as unknown as Record<string, unknown>)[field];
      let valB = (b as unknown as Record<string, unknown>)[field];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      return (valA < valB ? -1 : 1) * (dir === 'asc' ? 1 : -1);
    });

    const start = this.pageIndex() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim() !== '' ||
      this.selectedStatus() !== 'all' ||
      this.dateFrom() !== null ||
      this.dateTo() !== null,
  );

  readonly selectedCount = computed(() => {
    const ids = this.selectedIds();
    return this.rawProcedures().filter((procedure) => ids.has(procedure.id)).length;
  });

  readonly allPageSelected = computed(() => {
    const rows = this.paginatedProcedures();
    const ids = this.selectedIds();
    return rows.length > 0 && rows.every((row) => ids.has(row.id));
  });

  readonly somePageSelected = computed(() => {
    const ids = this.selectedIds();
    return !this.allPageSelected() && this.paginatedProcedures().some((row) => ids.has(row.id));
  });

  readonly bulkPlans = computed(() => {
    const ids = this.selectedIds();
    const procedures = this.rawProcedures();
    return this.bulkActions.map((action) => ({
      action,
      eligibleCount: planBulkTransition(procedures, ids, action.target).eligible.length,
    }));
  });

  constructor() {
    this.initFiltersFromQueryParams();
    this.loadProcedures();
    this.instrumentStore.loadInstruments();

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.pageIndex.set(0);
        this.syncQueryParams();
      });
  }

  getInstrumentSet(id: string | null | undefined): InstrumentSet | undefined {
    return id ? this.instrumentsMap().get(id) : undefined;
  }

  onSearchChange(term: string): void {
    this.searchInput$.next(term);
  }

  onStatusChange(status: StatusFilterOption): void {
    this.selectedStatus.set(status);
    this.pageIndex.set(0);
    this.syncQueryParams();
  }

  onDateChange(edge: 'from' | 'to', value: Date | null): void {
    (edge === 'from' ? this.dateFrom : this.dateTo).set(value);
    this.pageIndex.set(0);
    this.syncQueryParams();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.syncQueryParams();
  }

  onSortChange(sort: Sort): void {
    this.sortField.set(sort.active || 'scheduledDate');
    this.sortDirection.set((sort.direction as 'asc' | 'desc') || 'asc');
    this.pageIndex.set(0);
    this.syncQueryParams();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('all');
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.pageIndex.set(0);
    this.syncQueryParams();
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleRow(id: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  togglePage(): void {
    const rows = this.paginatedProcedures();
    const shouldSelect = !this.allPageSelected();
    this.selectedIds.update((current) => {
      const next = new Set(current);
      rows.forEach((row) => (shouldSelect ? next.add(row.id) : next.delete(row.id)));
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
    this.table()?.renderRows();
  }

  runBulk(action: BulkAction): void {
    const { eligible, skipped } = planBulkTransition(
      this.rawProcedures(),
      this.selectedIds(),
      action.target,
    );
    if (eligible.length === 0) return;

    const noun = eligible.length === 1 ? 'procedure' : 'procedures';
    this.confirmDialog
      .confirm({
        title: `${action.label} ${eligible.length} ${noun}?`,
        message: `${eligible.length} ${noun} will move to "${action.target}".`,
        detail:
          skipped.length > 0
            ? `${skipped.length} selected ${skipped.length === 1 ? 'procedure cannot' : 'procedures cannot'} make this transition and will stay unchanged.`
            : undefined,
        confirmLabel: `${action.label} ${eligible.length}`,
        cancelLabel: 'Go back',
        tone: action.tone,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        eligible.forEach((procedure) =>
          this.store.dispatch(
            ProceduresActions.updateStatus({ id: procedure.id, newStatus: action.target }),
          ),
        );
        this.clearSelection();
        this.snackBar.open(`Updating ${eligible.length} ${noun}`, 'Dismiss', { duration: 3000 });
      });
  }

  setDensity(density: TableDensity): void {
    this.preferences.setDensity(density);
  }

  isColumnVisible(id: string): boolean {
    return !this.preferences.hiddenColumnSet().has(id);
  }

  beginSavingView(): void {
    this.viewName.set('');
    this.savingView.set(true);
  }

  cancelSavingView(): void {
    this.savingView.set(false);
  }

  commitView(): void {
    const saved = this.preferences.saveView({
      name: this.viewName(),
      search: this.searchTerm().trim(),
      status: this.selectedStatus(),
      dateFrom: this.dateFrom() ? toDayKey(this.dateFrom() as Date) : null,
      dateTo: this.dateTo() ? toDayKey(this.dateTo() as Date) : null,
    });

    if (saved) {
      this.savingView.set(false);
      this.snackBar.open(`Saved view "${saved.name}"`, 'Dismiss', { duration: 2500 });
    }
  }

  applyView(view: SavedView): void {
    this.searchTerm.set(view.search);
    this.selectedStatus.set(view.status);
    this.dateFrom.set(view.dateFrom ? dayKeyToDate(view.dateFrom) : null);
    this.dateTo.set(view.dateTo ? dayKeyToDate(view.dateTo) : null);
    this.pageIndex.set(0);
    this.syncQueryParams();
  }

  deleteView(view: SavedView): void {
    this.preferences.deleteView(view.id);
  }

  exportToCsv(): void {
    const headers = ['Code', 'Title', 'Scheduled Date', 'Operating Room', 'Instrument Set', 'Status'];
    const rows = this.filteredProcedures().map((p) => [
      `"${p.code}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.scheduledDate}"`,
      `"${p.operatingRoom}"`,
      `"${this.getInstrumentSet(p.instrumentSetId)?.code ?? ''}"`,
      `"${p.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medflow_procedures_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  loadProcedures(): void {
    this.store.dispatch(ProceduresActions.loadProcedures());
  }

  openManageDialog(procedure: Procedure): void {
    this.dialog.open(ProcedureDetailDialogComponent, {
      data: { procedure },
      width: '540px',
    });
  }

  private initFiltersFromQueryParams(): void {
    const qp = this.route.snapshot.queryParams;
    if (qp['search']) {
      this.searchTerm.set(qp['search']);
    }
    if (qp['status']) {
      this.selectedStatus.set(qp['status'] as StatusFilterOption);
    }
    if (qp['from']) {
      this.dateFrom.set(dayKeyToDate(qp['from']));
    }
    if (qp['to']) {
      this.dateTo.set(dayKeyToDate(qp['to']));
    }
    if (qp['page']) {
      this.pageIndex.set(Number(qp['page']) || 0);
    }
    if (qp['sort']) {
      this.sortField.set(qp['sort']);
    }
    if (qp['dir']) {
      this.sortDirection.set(qp['dir'] as 'asc' | 'desc');
    }
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm() || null,
        status: this.selectedStatus() === 'all' ? null : this.selectedStatus(),
        from: this.dateFrom() ? toDayKey(this.dateFrom() as Date) : null,
        to: this.dateTo() ? toDayKey(this.dateTo() as Date) : null,
        page: this.pageIndex() > 0 ? this.pageIndex() : null,
        sort: this.sortField() !== 'scheduledDate' ? this.sortField() : null,
        dir: this.sortDirection() !== 'asc' ? this.sortDirection() : null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
