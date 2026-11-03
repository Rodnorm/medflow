import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProcedureListComponent } from './procedure-list';
import { ProcedureService } from '../../../core/services/procedure/procedure.service';
import { INITIAL_PROCEDURES } from '../../../core/data/synthetic-data';

describe('ProcedureListComponent', () => {
  let procedureServiceMock: Partial<ProcedureService>;

  beforeEach(async () => {
    procedureServiceMock = {
      getProcedures: () => of(INITIAL_PROCEDURES),
    };

    await TestBed.configureTestingModule({
      imports: [ProcedureListComponent],
      providers: [
        provideRouter([]),
        { provide: ProcedureService, useValue: procedureServiceMock },
      ],
    }).compileComponents();
  });

  it('should create and load procedures into rawProcedures signal', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
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
      component.filteredProcedures().every(
        (p) =>
          p.title.toLowerCase().includes('laparoscopy') ||
          p.code.toLowerCase().includes('laparoscopy')
      )
    ).toBe(true);

    vi.useRealTimers();
  });

  it('should filter procedures when status filter changes', () => {
    const fixture = TestBed.createComponent(ProcedureListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onStatusChange('in-progress');

    expect(
      component.filteredProcedures().every((p) => p.status === 'in-progress')
    ).toBe(true);
  });
});

