import { Component, inject } from "@angular/core";
import { getAvailableInstrumentSetTransitions, InstrumentSet, InstrumentSetStatus } from "../../../core/models/instrument-set/instrument-set.model";
import { DatePipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { InstrumentSetService } from "../../../core/services/instrument-set/instrument-set.service";
import { ActivatedRoute, Router } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { StatusBadge } from "../../../shared/components/status-badge/status-badge";
import { InstrumentsStore } from "../../../core/store/instruments/instruments.store";

export type InstrumentStatusFilter = 'all' | InstrumentSetStatus;

@Component({
    selector: 'app-instrument-list',
    imports: [
        DatePipe,
        StatusBadge,
        MatMenuModule,
        MatTableModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './instrument-list.html',
    styleUrl: './instrument-list.scss'
})
export class InstrumentListComponent {
    readonly store = inject(InstrumentsStore);
    private readonly instrumentService = inject(InstrumentSetService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    private readonly searchInput$ = new Subject<string>();

    readonly displayedColumns: string[] = [
        'code',
        'name',
        'status',
        'actions',
        'location',
        'updatedAt',
    ];

    constructor() {
        this.initFiltersFromQueryParams();
        this.store.loadInstruments();
        this.searchInput$
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntilDestroyed(),
            ).subscribe((term) => {
                this.store.setSearchTerm(term);
                this.syncQueryParams();
            });
    }

    onSearchChange(term: string): void {
        this.searchInput$.next(term);
    }

    onStatusChange(status: InstrumentSetStatus): void {
        this.store.setSelectedStatus(status);
        this.syncQueryParams();
    }

    getTransitions(status: InstrumentSetStatus): readonly InstrumentSetStatus[] {
        return getAvailableInstrumentSetTransitions(status);
    }

    transitionStatus(set: InstrumentSet, newStatus: InstrumentSetStatus): void {
        this.store.updateStatus({ set, newStatus });
    }

    private initFiltersFromQueryParams(): void {
        const qp = this.route.snapshot.queryParamMap;
        const search = qp.get('search');
        const status = qp.get('status');
        if (search) this.store.setSearchTerm(search)
        if (status) this.store.setSelectedStatus(status as InstrumentStatusFilter)
    }

    private syncQueryParams(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                search: this.store.searchTerm() || null,
                status: this.store.selectedStatus() === 'all' ? null : this.store.selectedStatus()
            },
            queryParamsHandling: 'merge'
        });
    }
}