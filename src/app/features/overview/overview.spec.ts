import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { OverviewComponent } from './overview';
import { INITIAL_INSTRUMENT_SETS, INITIAL_PROCEDURES } from '../../core/data/synthetic-data';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../core/store/procedures/procedures.selectors';
import { INSTRUMENT_SET_API_TOKEN } from '../../core/api/api.tokens';

describe('OverviewComponent', () => {
  beforeEach(async () => {
    if (typeof window !== 'undefined' && !window.IntersectionObserver) {
      class MockIntersectionObserver {
        observe = () => {};
        unobserve = () => {};
        disconnect = () => {};
      }
      window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    }

    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: INSTRUMENT_SET_API_TOKEN,
          useValue: {
            getInstrumentSets: () => of(INITIAL_INSTRUMENT_SETS),
          },
        },
        provideMockStore({
          selectors: [
            { selector: selectAllProcedures, value: INITIAL_PROCEDURES },
            { selector: selectProceduresLoading, value: false },
            { selector: selectProceduresError, value: null },
          ],
        }),
      ],
    }).compileComponents();
  });

  it('should create and calculate reactive metrics via computed signals', () => {
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.totalProcedures()).toBe(INITIAL_PROCEDURES.length);
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
