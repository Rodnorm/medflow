import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { INSTRUMENT_SET_API_TOKEN } from '../../api/api.tokens';
import { INITIAL_INSTRUMENT_SETS } from '../../data/synthetic-data';
import { RealtimeService } from '../../services/realtime/realtime.service';
import { ActivityStore } from '../activity/activity.store';
import { InstrumentsStore } from './instruments.store';

describe('InstrumentsStore activity logging', () => {
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

  it('records an activity event after a successful transition', () => {
    api.getInstrumentSets.mockReturnValue(of([instrument]));
    api.updateStatus.mockReturnValue(of({ ...instrument, status: 'reserved' }));
    const store = TestBed.inject(InstrumentsStore);
    const activity = TestBed.inject(ActivityStore);
    store.loadInstruments();
    const before = activity.activities().length;

    store.updateStatus({ set: instrument, newStatus: 'reserved' });

    expect(activity.activities()).toHaveLength(before + 1);
    expect(activity.activities()[0]).toMatchObject({
      type: 'instrument_status_changed',
      entityId: instrument.id,
      entityCode: instrument.code,
      toStatus: 'reserved',
    });
  });

  it('does not log anything when the transition is rejected', () => {
    api.getInstrumentSets.mockReturnValue(of([instrument]));
    api.updateStatus.mockReturnValue(throwError(() => new Error('Rejected')));
    const store = TestBed.inject(InstrumentsStore);
    const activity = TestBed.inject(ActivityStore);
    const before = activity.activities().length;
    store.loadInstruments();

    store.updateStatus({ set: instrument, newStatus: 'reserved' });

    expect(activity.activities()).toHaveLength(before);
  });

  it('can clear a stored error', () => {
    api.getInstrumentSets.mockReturnValue(of([instrument]));
    const store = TestBed.inject(InstrumentsStore);
    store.loadInstruments();
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
