import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { INSTRUMENT_SET_API_TOKEN } from '../../api/api.tokens';
import { INITIAL_INSTRUMENT_SETS } from '../../data/synthetic-data';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { InstrumentsStore } from './instruments.store';

describe('InstrumentsStore recovery', () => {
  const instrument = INITIAL_INSTRUMENT_SETS[0];
  const api = { getInstrumentSets: vi.fn(), updateStatus: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: INSTRUMENT_SET_API_TOKEN, useValue: api },
        { provide: RealtimeService, useValue: { event$: new Subject() } },
      ],
    });
  });

  it('can load again after a request fails', () => {
    api.getInstrumentSets
      .mockReturnValueOnce(throwError(() => new Error('Offline')))
      .mockReturnValueOnce(of([instrument]));
    const store = TestBed.inject(InstrumentsStore);
    store.loadInstruments();
    expect(store.error()).toBe('Offline');
    expect(store.loading()).toBe(false);
    store.loadInstruments();
    expect(store.error()).toBeNull();
    expect(store.instruments()).toEqual([instrument]);
  });

  it('can update again after a rejected transition', () => {
    api.getInstrumentSets.mockReturnValue(of([instrument]));
    api.updateStatus
      .mockReturnValueOnce(throwError(() => new Error('Rejected')))
      .mockReturnValueOnce(of({ ...instrument, status: 'reserved' }));
    const store = TestBed.inject(InstrumentsStore);
    store.loadInstruments();
    store.updateStatus({ set: instrument, newStatus: 'reserved' });
    expect(store.error()).toBe('Rejected');
    expect(store.loading()).toBe(false);
    store.updateStatus({ set: instrument, newStatus: 'reserved' });
    expect(store.error()).toBeNull();
    expect(store.instruments()[0].status).toBe('reserved');
    expect(store.loading()).toBe(false);
  });
});
