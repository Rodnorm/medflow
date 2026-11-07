import { TestBed } from '@angular/core/testing';
import {
  MAX_SAVED_VIEWS,
  parsePreferences,
  PREFERENCES_STORAGE_KEY,
  PreferencesStore,
} from './preferences.store';

const view = {
  name: 'Urgent',
  search: 'PRC',
  status: 'planned' as const,
  dateFrom: null,
  dateTo: null,
};

describe('PreferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with defaults when nothing is stored', () => {
    const store = TestBed.inject(PreferencesStore);
    expect(store.density()).toBe('comfortable');
    expect(store.hiddenColumns()).toEqual([]);
    expect(store.savedViews()).toEqual([]);
  });

  it('toggles columns and exposes them as a set', () => {
    const store = TestBed.inject(PreferencesStore);
    store.toggleColumn('operatingRoom');
    expect(store.hiddenColumnSet().has('operatingRoom')).toBe(true);
    store.toggleColumn('operatingRoom');
    expect(store.hiddenColumnSet().has('operatingRoom')).toBe(false);
  });

  it('saves views with trimmed names and replaces duplicates', () => {
    const store = TestBed.inject(PreferencesStore);
    store.saveView({ ...view, name: '  Urgent ' });
    store.saveView({ ...view, name: 'urgent', search: 'OR-1' });
    expect(store.savedViews()).toHaveLength(1);
    expect(store.savedViews()[0].search).toBe('OR-1');
    expect(store.savedViews()[0].name).toBe('urgent');
  });

  it('rejects blank names and caps the number of views', () => {
    const store = TestBed.inject(PreferencesStore);
    expect(store.saveView({ ...view, name: '   ' })).toBeNull();
    for (let index = 0; index < MAX_SAVED_VIEWS + 3; index++) {
      store.saveView({ ...view, name: `View ${index}` });
    }
    expect(store.savedViews()).toHaveLength(MAX_SAVED_VIEWS);
    expect(store.savedViews()[MAX_SAVED_VIEWS - 1].name).toBe(`View ${MAX_SAVED_VIEWS + 2}`);
  });

  it('deletes a saved view', () => {
    const store = TestBed.inject(PreferencesStore);
    const saved = store.saveView(view);
    store.deleteView(saved!.id);
    expect(store.savedViews()).toEqual([]);
  });

  it('persists state to localStorage', () => {
    const store = TestBed.inject(PreferencesStore);
    store.setDensity('compact');
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}');
    expect(stored.density).toBe('compact');
  });
});

describe('parsePreferences', () => {
  it('falls back to defaults on invalid JSON', () => {
    expect(parsePreferences('{not json').density).toBe('comfortable');
    expect(parsePreferences(null).savedViews).toEqual([]);
  });

  it('drops malformed saved views and non-string columns', () => {
    const parsed = parsePreferences(
      JSON.stringify({
        density: 'compact',
        hiddenColumns: ['status', 4, null],
        savedViews: [{ id: 1 }, { id: 'a', name: 'ok', search: '', status: 'all', dateFrom: null, dateTo: null }],
      }),
    );
    expect(parsed.density).toBe('compact');
    expect(parsed.hiddenColumns).toEqual(['status']);
    expect(parsed.savedViews.map((item) => item.id)).toEqual(['a']);
  });

  it('rejects unknown statuses inside saved views', () => {
    const parsed = parsePreferences(
      JSON.stringify({
        savedViews: [{ id: 'a', name: 'bad', search: '', status: 'weird', dateFrom: null, dateTo: null }],
      }),
    );
    expect(parsed.savedViews).toEqual([]);
  });
});

