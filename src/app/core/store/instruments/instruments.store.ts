import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { filter } from 'rxjs';
import {
  InstrumentSet,
  InstrumentSetStatus,
} from '../../models/instrument-set/instrument-set.model';
import { InstrumentStatusFilter } from '../../../features/instruments/instrument-list/instrument-list';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { withEntities, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { INSTRUMENT_SET_API_TOKEN } from '../../api/api.tokens';

interface InstrumentState {
  loading: boolean;
  searchTerm: string;
  error: string | null;
  selectedStatus: InstrumentStatusFilter;
}

const initialState: InstrumentState = {
  error: null,
  searchTerm: '',
  loading: false,
  selectedStatus: 'all',
};

export const InstrumentsStore = signalStore(
  {
    providedIn: 'root',
  },
  withState(initialState),
  withEntities<InstrumentSet>(),
  withComputed(({ entities, searchTerm, selectedStatus }) => ({
    instruments: entities,
    filteredInstruments: computed(() => {
      const term = searchTerm().trim().toLowerCase();
      const status = selectedStatus();

      return entities().filter((item) => {
        const matchesStatus = status === 'all' || item.status === status;
        const matchesSearch =
          !term ||
          item.code.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term);

        return matchesSearch && matchesStatus;
      });
    }),
  })),

  withMethods((store, instrumentService = inject(INSTRUMENT_SET_API_TOKEN)) => ({
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
                patchState(store, setAllEntities([...instruments]), { loading: false });
              },
            }),
            catchError((err: Error) => {
              patchState(store, {
                error: err.message ?? 'Failed to load instruments',
                loading: false,
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    updateStatus: rxMethod<{ set: InstrumentSet; newStatus: InstrumentSetStatus }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ set, newStatus }) =>
          instrumentService.updateStatus(set.id, newStatus).pipe(
            tap({
              next: (updated) => {
                patchState(store, updateEntity({ id: updated.id, changes: updated }), {
                  loading: false,
                });
              },
            }),
            catchError((err: Error) => {
              patchState(store, {
                error: err.message ?? 'Failed to transition status',
                loading: false,
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      inject(RealtimeService)
        .event$.pipe(
          filter((event) => event.type === 'INSTRUMENT_STATUS_CHANGED'),
          takeUntilDestroyed(),
        )
        .subscribe(() => store.loadInstruments());
    },
  }),
);
