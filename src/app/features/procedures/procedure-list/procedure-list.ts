import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProcedureService } from '../../../core/services/procedure/procedure.service';
import { Procedure, ProcedureStatus } from '../../../core/models/procedure/procedure.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ProcedureDetailDialogComponent } from '../procedure-detail-dialog/procedure-detail-dialog';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './procedure-list.html',
  styleUrl: './procedure-list.scss',
})
export class ProcedureListComponent {
  private readonly procedureService = inject(ProcedureService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly rawProcedures = signal<readonly Procedure[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);


  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<StatusFilterOption>('all');

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

  readonly filteredProcedures = computed(() => {
    const status = this.selectedStatus();
    const search = this.searchTerm().trim().toLowerCase();

    return this.rawProcedures().filter((p) => {
      const matchesStatus = status === 'all' || p.status === status;
      const matchesSearch =
        !search ||
        p.code.toLowerCase().includes(search) ||
        p.title.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  });

  constructor() {
    this.initFiltersFromQueryParams();
    this.loadProcedures();
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed()
      ).subscribe((term) => {
        this.searchTerm.set(term);
        this.syncQueryParams();
      });
  }

  onSearchChange(term: string): void {
    this.searchInput$.next(term);
  }

  onStatusChange(status: StatusFilterOption): void {
    this.selectedStatus.set(status);
    this.syncQueryParams();
  }

  loadProcedures(): void {
    this.loading.set(true);
    this.error.set(null);

    this.procedureService.getProcedures().subscribe({
      next: (data) => {
        this.rawProcedures.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message ?? 'Failed to load procedures');
        this.loading.set(false);
      },
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
  }

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm() || null,
        status: this.selectedStatus() === 'all' ? null : this.selectedStatus(),
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
        this.rawProcedures.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item))
        );
      }
    })


  }


}

