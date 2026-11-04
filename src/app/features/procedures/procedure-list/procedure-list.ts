import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Procedure, ProcedureStatus } from '../../../core/models/procedure/procedure.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ProcedureDetailDialogComponent } from '../procedure-detail-dialog/procedure-detail-dialog';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { Store } from '@ngrx/store';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../../core/store/procedures/procedures.selectors';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';
import { InstrumentsStore } from '../../../core/store/instruments/instruments.store';
import { InstrumentSet } from '../../../core/models/instrument-set/instrument-set.model';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';

export type StatusFilterOption = 'all' | ProcedureStatus;

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './procedure-list.html',
  styleUrl: './procedure-list.scss',
})
export class ProcedureListComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly instrumentStore = inject(InstrumentsStore);

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

  // Filtros locais
  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<StatusFilterOption>('all');

  // Paginação e Ordenação
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly sortField = signal<string>('scheduledDate');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  private readonly searchInput$ = new Subject<string>();

  readonly displayedColumns: string[] = [
    'code',
    'title',
    'scheduledDate',
    'operatingRoom',
    'instrumentSetId',
    'status',
    'actions',
  ];

  // 1. Filtragem primária
  readonly filteredProcedures = computed(() => {
    const status = this.selectedStatus();
    const search = this.searchTerm().trim().toLowerCase();

    return this.rawProcedures().filter((p) => {
      const matchesStatus = status === 'all' || p.status === status;
      const matchesSearch =
        !search || p.code.toLowerCase().includes(search) || p.title.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  });

  // 2. Ordenação e fatiamento paginado
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

  exportToCsv(): void {
    const headers = ['Code', 'Title', 'Scheduled Date', 'Operating Room', 'Status'];
    const rows = this.filteredProcedures().map((p) => [
      `"${p.code}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.scheduledDate}"`,
      `"${p.operatingRoom}"`,
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

  private initFiltersFromQueryParams(): void {
    const qp = this.route.snapshot.queryParams;
    if (qp['search']) {
      this.searchTerm.set(qp['search']);
    }
    if (qp['status']) {
      this.selectedStatus.set(qp['status'] as StatusFilterOption);
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
        page: this.pageIndex() > 0 ? this.pageIndex() : null,
        sort: this.sortField() !== 'scheduledDate' ? this.sortField() : null,
        dir: this.sortDirection() !== 'asc' ? this.sortDirection() : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  openManageDialog(procedure: Procedure): void {
    const dialogRef = this.dialog.open(ProcedureDetailDialogComponent, {
      data: { procedure },
      width: '540px',
    });

    dialogRef.afterClosed().subscribe((updated: Procedure | undefined) => {
      if (updated) {
        this.store.dispatch(ProceduresActions.updateStatusSuccess({ procedure: updated }));
      }
    });
  }
}
