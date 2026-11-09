import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ProcedureListComponent } from './procedure-list';
import { INITIAL_PROCEDURES } from '../../../core/data/synthetic-data';
import { Procedure } from '../../../core/models/procedure/procedure.model';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../../core/store/procedures/procedures.selectors';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

function build(id: string, status: Procedure['status'], day: number): Procedure {
  return {
    id,
    code: id.toUpperCase(),
    title: `Procedure ${id}`,
    operatingRoom: 'OR-1',
    scheduledDate: new Date(2026, 10, day, 9, 0).toISOString(),
    status,
    instrumentSetId: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

describe('ProcedureListComponent', () => {
  let store: MockStore;
  const confirm = vi.fn(() => of(true));

  beforeEach(async () => {
    localStorage.clear();
    confirm.mockClear();
    confirm.mockReturnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [ProcedureListComponent],
      providers: [
        provideRouter([]),
        { provide: ConfirmDialogService, useValue: { confirm } },
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

  function createWith(procedures: readonly Procedure[]) {
    store.overrideSelector(selectAllProcedures, procedures as Procedure[]);
    store.refreshState();
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();
    vi.mocked(store.dispatch).mockClear();
    return fixture;
  }

  it('should create and load procedures via store dispatch on init', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(store.dispatch).toHaveBeenCalledWith(ProceduresActions.loadProcedures());
    expect(component.rawProcedures().length).toBe(INITIAL_PROCEDURES.length);
  });

  it('does not dispatch a second success when the manage dialog closes', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    const procedure = INITIAL_PROCEDURES[0];
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of(procedure),
    } as never);
    vi.mocked(store.dispatch).mockClear();
    fixture.componentInstance.openManageDialog(procedure);
    expect(store.dispatch).not.toHaveBeenCalledWith(
      ProceduresActions.updateStatusSuccess({ procedure }),
    );
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

  describe('date range', () => {
    const procedures = [build('a', 'planned', 2), build('b', 'planned', 3), build('c', 'planned', 4)];

    it('filters from a start date', () => {
      const component = createWith(procedures).componentInstance;
      component.onDateChange('from', new Date(2026, 10, 3));
      expect(component.filteredProcedures().map((p) => p.id)).toEqual(['b', 'c']);
    });

    it('applies an inclusive range and clears it with the other filters', () => {
      const component = createWith(procedures).componentInstance;
      component.onDateChange('from', new Date(2026, 10, 3));
      component.onDateChange('to', new Date(2026, 10, 3));
      expect(component.filteredProcedures().map((p) => p.id)).toEqual(['b']);
      expect(component.hasActiveFilters()).toBe(true);

      component.clearFilters();
      expect(component.filteredProcedures()).toHaveLength(3);
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('selection and bulk actions', () => {
    const procedures = [
      build('a', 'planned', 2),
      build('b', 'planned', 2),
      build('c', 'in-progress', 2),
      build('d', 'completed', 2),
    ];

    it('selects every row on the page and reflects partial selection', () => {
      const component = createWith(procedures).componentInstance;
      component.toggleRow('a');
      expect(component.somePageSelected()).toBe(true);
      expect(component.allPageSelected()).toBe(false);

      component.togglePage();
      expect(component.allPageSelected()).toBe(true);
      expect(component.selectedCount()).toBe(4);

      component.togglePage();
      expect(component.selectedCount()).toBe(0);
    });

    it('computes how many selected procedures can take each action', () => {
      const component = createWith(procedures).componentInstance;
      component.togglePage();
      const counts = Object.fromEntries(
        component.bulkPlans().map((entry) => [entry.action.label, entry.eligibleCount]),
      );
      expect(counts).toEqual({ Start: 2, Complete: 1, Cancel: 2 });
    });

    it('confirms and then updates only the eligible procedures', () => {
      const component = createWith(procedures).componentInstance;
      component.togglePage();
      const cancel = component.bulkActions.find((action) => action.target === 'cancelled')!;
      component.runBulk(cancel);

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cancel 2 procedures?',
          detail: '2 selected procedures cannot make this transition and will stay unchanged.',
          tone: 'danger',
        }),
      );
      expect(store.dispatch).toHaveBeenCalledWith(
        ProceduresActions.updateStatus({ id: 'a', newStatus: 'cancelled' }),
      );
      expect(store.dispatch).toHaveBeenCalledWith(
        ProceduresActions.updateStatus({ id: 'b', newStatus: 'cancelled' }),
      );
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      expect(component.selectedCount()).toBe(0);
    });

    it('does nothing when the confirmation is declined', () => {
      confirm.mockReturnValue(of(false));
      const component = createWith(procedures).componentInstance;
      component.toggleRow('a');
      component.runBulk(component.bulkActions[0]);
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(component.selectedCount()).toBe(1);
    });

    it('does not open a confirmation when nothing is eligible', () => {
      const component = createWith(procedures).componentInstance;
      component.toggleRow('d');
      component.runBulk(component.bulkActions[0]);
      expect(confirm).not.toHaveBeenCalled();
    });
  });

  describe('table preferences', () => {
    it('removes hidden columns from the table', () => {
      const component = createWith(INITIAL_PROCEDURES).componentInstance;
      expect(component.displayedColumns()).toContain('operatingRoom');
      component.preferences.toggleColumn('operatingRoom');
      expect(component.displayedColumns()).not.toContain('operatingRoom');
      expect(component.displayedColumns()[0]).toBe('select');
      expect(component.displayedColumns().at(-1)).toBe('actions');
    });

    it('persists the density choice', () => {
      const component = createWith(INITIAL_PROCEDURES).componentInstance;
      component.setDensity('compact');
      expect(component.preferences.density()).toBe('compact');
    });

    it('saves and re-applies a named view', () => {
      const component = createWith([build('a', 'planned', 2), build('b', 'completed', 3)]).componentInstance;
      component.onStatusChange('completed');
      component.beginSavingView();
      component.viewName.set('Finished cases');
      component.commitView();

      expect(component.savingView()).toBe(false);
      expect(component.preferences.savedViews()).toHaveLength(1);

      component.clearFilters();
      expect(component.filteredProcedures()).toHaveLength(2);

      component.applyView(component.preferences.savedViews()[0]);
      expect(component.selectedStatus()).toBe('completed');
      expect(component.filteredProcedures().map((p) => p.id)).toEqual(['b']);
    });

    it('refuses to save a view without a name', () => {
      const component = createWith(INITIAL_PROCEDURES).componentInstance;
      component.onStatusChange('planned');
      component.beginSavingView();
      component.commitView();
      expect(component.preferences.savedViews()).toHaveLength(0);
      expect(component.savingView()).toBe(true);
    });
  });

  it('expands and collapses a single detail row', () => {
    const component = createWith([build('a', 'planned', 2), build('b', 'planned', 2)]).componentInstance;
    component.toggleExpanded('a');
    expect(component.expandedId()).toBe('a');
    component.toggleExpanded('b');
    expect(component.expandedId()).toBe('b');
    component.toggleExpanded('b');
    expect(component.expandedId()).toBeNull();
  });
});
