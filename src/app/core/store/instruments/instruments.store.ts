import { computed, inject } from "@angular/core";
import { InstrumentSet, InstrumentSetStatus } from "../../models/instrument-set/instrument-set.model";
import { InstrumentStatusFilter } from "../../../features/instruments/instrument-list/instrument-list";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { InstrumentSetService } from "../../services/instrument-set/instrument-set.service";
import { pipe, switchMap, tap } from "rxjs";

interface InstrumentState {
    loading: boolean;
    searchTerm: string;
    error: string | null;
    instruments: InstrumentSet[];
    selectedStatus: InstrumentStatusFilter;
}

const initialState: InstrumentState = {
    error: null,
    searchTerm: '',
    loading: false,
    instruments: [],
    selectedStatus: 'all',
}

export const InstrumentsStore = signalStore(
    {
        providedIn: 'root'

    },
    withState(initialState),
    withComputed(({ instruments, searchTerm, selectedStatus }) => ({
        filteredInstruments: computed(() => {
            const term = searchTerm().trim().toLowerCase();
            const status = selectedStatus();

            return instruments().filter((item) => {
                const matchesStatus = status == 'all' || item.status === status;
                const matchesSearch =
                    !term ||
                    item.code.toLowerCase().includes(term) ||
                    item.name.toLowerCase().includes(term) ||
                    item.location.toLowerCase().includes(term);

                return matchesSearch && matchesStatus;
            });
        }),
    })),

    withMethods((store, instrumentService = inject(InstrumentSetService)) => ({
        setSearchTerm(searchTerm: string): void {
            patchState(store, { searchTerm });
        },
        setSelectedStatus(selectedStatus: InstrumentStatusFilter): void {
            patchState(store, { selectedStatus });
        },
        loadInstruments: rxMethod<void>(
            pipe(
                tap(() => patchState(store, { loading: true, error: null })),
                switchMap(() =>
                    instrumentService.getInstrumentSets().pipe(
                        tap({
                            next: (instruments) => {
                                patchState(store, {
                                    instruments: [...instruments],
                                    loading: false
                                });
                            },
                            error: (err: Error) => {
                                patchState(store, {
                                    error: err.message ?? 'Failed to load instruments',
                                    loading: false,
                                });
                            },
                        })
                    )
                )
            )
        ),

        updateStatus: rxMethod<{ set: InstrumentSet; newStatus: InstrumentSetStatus }>(
            pipe(
                switchMap(({ set, newStatus }) =>
                    instrumentService.updateStatus(set.id, newStatus)
                        .pipe(
                            tap({
                                next: (updated) => {
                                    patchState(store, (state) => ({
                                        instruments: state.instruments.map((i) =>
                                            i.id === updated.id ? updated : i
                                        ),
                                    }))
                                },
                                error: (err: Error) => {
                                    patchState(store, {
                                        error: err.message ?? 'Failed to transition status'
                                    })
                                }

                            })
                        ))

            )
        )
    })),

)