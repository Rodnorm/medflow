import { computed, inject } from '@angular/core';
import {
  InstrumentSet,
  InstrumentSetStatus,
} from '../../models/instrument-set/instrument-set.model';
import { InstrumentStatusFilter } from '../../../features/instruments/instrument-list/instrument-list';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { InstrumentSetService } from '../../services/instrument-set/instrument-set.service';
import { pipe, switchMap, tap } from 'rxjs';
import { withEntities, setAllEntities, updateEntity } from '@ngrx/signals/entities';

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
                // Spread para satisfazer tipo mutavel do setAllEntities
                patchState(store, setAllEntities([...instruments]), { loading: false });
              },
              error: (err: Error) => {
                patchState(store, {
                  error: err.message ?? 'Failed to load instruments',
                  loading: false,
                });
              },
            }),
          ),
        ),
      ),
    ),

    updateStatus: rxMethod<{ set: InstrumentSet; newStatus: InstrumentSetStatus }>(
      pipe(
        switchMap(({ set, newStatus }) =>
          instrumentService.updateStatus(set.id, newStatus).pipe(
            tap({
              next: (updated) => {
                patchState(store, updateEntity({ id: updated.id, changes: updated }), {
                  loading: false,
                });
              },
              error: (err: Error) => {
                patchState(store, {
                  error: err.message ?? 'Failed to transition status',
                });
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
