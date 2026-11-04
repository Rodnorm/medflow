import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { OverviewComponent } from './overview';
import { INITIAL_PROCEDURES } from '../../core/data/synthetic-data';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../core/store/procedures/procedures.selectors';

describe('OverviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
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
