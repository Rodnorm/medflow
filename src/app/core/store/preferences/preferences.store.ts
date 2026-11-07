import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  watchState,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ProcedureStatus } from '../../models/procedure/procedure.model';

export type TableDensity = 'comfortable' | 'compact';
export type SavedViewStatus = 'all' | ProcedureStatus;

export interface SavedView {
  readonly id: string;
  readonly name: string;
  readonly search: string;
  readonly status: SavedViewStatus;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

export interface PreferencesState {
  readonly density: TableDensity;
  readonly hiddenColumns: readonly string[];
  readonly savedViews: readonly SavedView[];
}

export const PREFERENCES_STORAGE_KEY = 'medflow_preferences';
export const MAX_SAVED_VIEWS = 8;

const VALID_STATUSES: readonly SavedViewStatus[] = [
  'all',
  'planned',
  'in-progress',
  'completed',
  'cancelled',
];

const initialState: PreferencesState = {
  density: 'comfortable',
  hiddenColumns: [],
  savedViews: [],
};

function isSavedView(value: unknown): value is SavedView {
  if (typeof value !== 'object' || value === null) return false;
  const view = value as Record<string, unknown>;
  return (
    typeof view['id'] === 'string' &&
    typeof view['name'] === 'string' &&
    typeof view['search'] === 'string' &&
    VALID_STATUSES.includes(view['status'] as SavedViewStatus) &&
    (view['dateFrom'] === null || typeof view['dateFrom'] === 'string') &&
    (view['dateTo'] === null || typeof view['dateTo'] === 'string')
  );
}

export function parsePreferences(raw: string | null): PreferencesState {
  if (!raw) return initialState;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      density: parsed['density'] === 'compact' ? 'compact' : 'comfortable',
      hiddenColumns: Array.isArray(parsed['hiddenColumns'])
        ? parsed['hiddenColumns'].filter((column): column is string => typeof column === 'string')
        : [],
      savedViews: Array.isArray(parsed['savedViews'])
        ? parsed['savedViews'].filter(isSavedView).slice(0, MAX_SAVED_VIEWS)
        : [],
    };
  } catch {
    return initialState;
  }
}

function readStorage(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(state: PreferencesState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    return;
  }
}

export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState<PreferencesState>(initialState),
  withComputed(({ hiddenColumns }) => ({
    hiddenColumnSet: computed(() => new Set(hiddenColumns())),
  })),
  withMethods((store) => ({
    setDensity(density: TableDensity): void {
      patchState(store, { density });
    },
    toggleColumn(column: string): void {
      const hidden = store.hiddenColumns();
      patchState(store, {
        hiddenColumns: hidden.includes(column)
          ? hidden.filter((item) => item !== column)
          : [...hidden, column],
      });
    },
    resetColumns(): void {
      patchState(store, { hiddenColumns: [] });
    },
    saveView(view: Omit<SavedView, 'id'>): SavedView | null {
      const name = view.name.trim();
      if (!name) return null;

      const saved: SavedView = { ...view, name, id: `view-${Date.now()}` };
      const others = store.savedViews().filter((item) => item.name.toLowerCase() !== name.toLowerCase());
      patchState(store, { savedViews: [...others, saved].slice(-MAX_SAVED_VIEWS) });
      return saved;
    },
    deleteView(id: string): void {
      patchState(store, { savedViews: store.savedViews().filter((view) => view.id !== id) });
    },
  })),
  withHooks({
    onInit(store) {
      patchState(store, parsePreferences(readStorage()));
      watchState(store, (state) => writeStorage(state));
    },
  }),
);

