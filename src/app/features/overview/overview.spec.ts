import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OverviewComponent } from './overview';
import { ProcedureService } from '../../core/services/procedure/procedure.service';
import { InstrumentSetService } from '../../core/services/instrument-set/instrument-set.service';
import { INITIAL_PROCEDURES, INITIAL_INSTRUMENT_SETS } from '../../core/data/synthetic-data';

describe('OverviewComponent', () => {
  let procedureServiceMock: Partial<ProcedureService>;
  let instrumentSetServiceMock: Partial<InstrumentSetService>;

  beforeEach(async () => {
    procedureServiceMock = {
      getProcedures: () => of(INITIAL_PROCEDURES),
    };
    instrumentSetServiceMock = {
      getInstrumentSets: () => of(INITIAL_INSTRUMENT_SETS),
    };

    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideRouter([]),
        { provide: ProcedureService, useValue: procedureServiceMock },
        { provide: InstrumentSetService, useValue: instrumentSetServiceMock },
      ],
    }).compileComponents();
  });

  it('should create and calculate reactive metrics via computed signals', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.totalProcedures()).toBe(INITIAL_PROCEDURES.length);
    expect(component.availableSets()).toBeGreaterThan(0);
    expect(component.loading()).toBe(false);
  });

  it('should render the metrics grid and recent procedures table', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.overview-title')?.textContent).toContain('Operations Overview');
    expect(compiled.querySelectorAll('app-metric-card').length).toBe(5);
    expect(compiled.querySelector('.recent-table')).not.toBeNull();
  });
});

