import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { InstrumentListComponent } from './instrument-list';
import { InstrumentSetService } from '../../../core/services/instrument-set/instrument-set.service';
import { INITIAL_INSTRUMENT_SETS } from '../../../core/data/synthetic-data';
import { InstrumentSet } from '../../../core/models/instrument-set/instrument-set.model';

describe('InstrumentListComponent', () => {
  let instrumentServiceMock: Partial<InstrumentSetService>;

  beforeEach(async () => {
    instrumentServiceMock = {
      getInstrumentSets: () => of(INITIAL_INSTRUMENT_SETS),
      updateStatus: (id, newStatus) => {
        const item = INITIAL_INSTRUMENT_SETS.find((i) => i.id === id)!;
        return of({ ...item, status: newStatus, updatedAt: new Date().toISOString() });
      },
    };

    await TestBed.configureTestingModule({
      imports: [InstrumentListComponent],
      providers: [
        provideRouter([]),
        { provide: InstrumentSetService, useValue: instrumentServiceMock },
      ],
    }).compileComponents();
  });

  it('should create and load instrument sets via store', () => {
    const fixture = TestBed.createComponent(InstrumentListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.store.filteredInstruments().length).toBe(INITIAL_INSTRUMENT_SETS.length);
  });

  it('should filter instruments when searchTerm is entered with debounce', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(InstrumentListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onSearchChange('Sterilization');
    vi.advanceTimersByTime(300);

    expect(
      component.store.filteredInstruments().every(
        (i: InstrumentSet) =>
          i.location.toLowerCase().includes('sterilization') ||
          i.name.toLowerCase().includes('sterilization') ||
          i.code.toLowerCase().includes('sterilization')
      )
    ).toBe(true);

    vi.useRealTimers();
  });

  it('should filter instruments when status filter is selected', () => {
    const fixture = TestBed.createComponent(InstrumentListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.onStatusChange('available');

    expect(
      component.store.filteredInstruments().every((i: InstrumentSet) => i.status === 'available')
    ).toBe(true);
  });

  it('should trigger status transition and update list via store', () => {
    const fixture = TestBed.createComponent(InstrumentListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const targetSet = INITIAL_INSTRUMENT_SETS[0];

    component.transitionStatus(targetSet, 'reserved');

    const updated = component.store.filteredInstruments().find((i: InstrumentSet) => i.id === targetSet.id);
    expect(updated?.status).toBe('reserved');
  });
});
