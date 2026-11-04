import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';

import { ProcedureListComponent } from './procedure-list';
import { INITIAL_PROCEDURES } from '../../../core/data/synthetic-data';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../../core/store/procedures/procedures.selectors';

describe('ProcedureListComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcedureListComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectAllProcedures, value: INITIAL_PROCEDURES },
            { selector: selectProceduresLoading, value: false },
            { selector: selectProceduresError, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('should create and load procedures via store dispatch on init', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(ProceduresActions.loadProcedures());
    expect(component.rawProcedures().length).toBe(INITIAL_PROCEDURES.length);
  });

  it('should filter procedures when searchTerm changes', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSearchChange('Laparoscopy');
    vi.advanceTimersByTime(300);

    expect(
      component
        .filteredProcedures()
        .every(
          (p) =>
            p.title.toLowerCase().includes('laparoscopy') ||
            p.code.toLowerCase().includes('laparoscopy'),
        ),
    ).toBe(true);

    vi.useRealTimers();
  });

  it('should filter procedures when status filter changes', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onStatusChange('in-progress');

    expect(component.filteredProcedures().every((p) => p.status === 'in-progress')).toBe(true);
  });
});
