import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ProcedureDetailDialogComponent } from './procedure-detail-dialog';
import { ProcedureService } from '../../../core/services/procedure/procedure.service';
import { Procedure } from '../../../core/models/procedure/procedure.model';

describe('ProcedureDetailDialogComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let procedureServiceMock: Partial<ProcedureService>;

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

    procedureServiceMock = {
      updateStatus: (id, newStatus) =>
        of({ ...mockProcedure, status: newStatus, updatedAt: new Date().toISOString() }),
    };

    await TestBed.configureTestingModule({
      imports: [ProcedureDetailDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { procedure: mockProcedure } },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: ProcedureService, useValue: procedureServiceMock },
      ],
    }).compileComponents();
  });

  it('should create and render procedure details', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PRC-2026-001');
    expect(compiled.textContent).toContain('Diagnostic Laparoscopy');
  });

  it('should render allowed workflow transitions for planned status', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.availableTransitions).toContain('in-progress');
    expect(component.availableTransitions).toContain('cancelled');
  });

  it('should prompt confirmation when cancel transition is selected', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSelectTransition('cancelled');

    expect(component.showCancelConfirm()).toBe(true);
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('should execute transition and close dialog on status advance', () => {
    const fixture = TestBed.createComponent(ProcedureDetailDialogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSelectTransition('in-progress');

    expect(dialogRefMock.close).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in-progress' })
    );
  });
});
