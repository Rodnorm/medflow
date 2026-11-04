import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { ProcedureDetailDialogComponent } from './procedure-detail-dialog';
import { Procedure } from '../../../core/models/procedure/procedure.model';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';

describe('ProcedureDetailDialogComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let store: MockStore;
  let actions$: Subject<Action>;

  const mockProcedure: Procedure = {
    id: 'prc-001',
    code: 'PRC-2026-001',
    title: 'Diagnostic Laparoscopy',
    operatingRoom: 'OR-1',
    scheduledDate: '2026-11-02T09:00:00.000Z',
    instrumentSetId: 'ins-001',
    status: 'planned',
    updatedAt: '2026-11-02T07:30:00.000Z',
  };

  beforeEach(async () => {
    dialogRefMock = {
      close: vi.fn(),
    };
    actions$ = new Subject<Action>();

    await TestBed.configureTestingModule({
      imports: [ProcedureDetailDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { procedure: mockProcedure } },
        { provide: MatDialogRef, useValue: dialogRefMock },
        provideMockStore(),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('should create and render procedure details', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PRC-2026-001');
    expect(compiled.textContent).toContain('Diagnostic Laparoscopy');
  });

  it('should dispatch updateStatus action when transition is executed', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSelectTransition('in-progress');

    expect(store.dispatch).toHaveBeenCalledWith(
      ProceduresActions.updateStatus({
        id: mockProcedure.id,
        newStatus: 'in-progress',
      }),
    );
  });

  it('should close dialog when updateStatusSuccess action is emitted', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const updated = { ...mockProcedure, status: 'in-progress' as const };
    actions$.next(ProceduresActions.updateStatusSuccess({ procedure: updated }));

    expect(dialogRefMock.close).toHaveBeenCalledWith(updated);
  });
});
