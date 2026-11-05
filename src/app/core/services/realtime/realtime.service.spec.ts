import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RealtimeService } from './realtime.service';
import { ProcedureService } from '../procedure/procedure.service';
import { InstrumentSetService } from '../instrument-set/instrument-set.service';
import { RealtimeEvent } from '../../models/realtime/realtime.model';

describe('Realtime simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('persists a simulated transition and does not emit it repeatedly', async () => {
    const realtime = TestBed.inject(RealtimeService);
    const procedures = TestBed.inject(ProcedureService);
    const events: RealtimeEvent[] = [];
    realtime.event$.subscribe((event) => events.push(event));
    await vi.advanceTimersByTimeAsync(25_400);
    expect(events.filter((event) => event.type === 'PROCEDURE_STATUS_CHANGED')).toHaveLength(1);
    let status: string | undefined;
    procedures.getProcedureById('prc-001').subscribe((p) => (status = p!.status));
    await vi.advanceTimersByTimeAsync(100);
    expect(status).toBe('in-progress');
    await vi.advanceTimersByTimeAsync(50_000);
    expect(events.filter((event) => event.type === 'PROCEDURE_STATUS_CHANGED')).toHaveLength(1);
  });

  it('does not reopen a completed procedure', async () => {
    const procedures = TestBed.inject(ProcedureService);
    procedures.updateStatus('prc-001', 'in-progress').subscribe();
    procedures.updateStatus('prc-001', 'completed').subscribe();
    const realtime = TestBed.inject(RealtimeService);
    const events: RealtimeEvent[] = [];
    realtime.event$.subscribe((event) => events.push(event));
    await vi.advanceTimersByTimeAsync(25_400);
    expect(events.filter((event) => event.type === 'PROCEDURE_STATUS_CHANGED')).toHaveLength(0);
    procedures.getProcedureById('prc-001').subscribe((p) => expect(p!.status).toBe('completed'));
    await vi.advanceTimersByTimeAsync(100);
  });

  it('persists instrument simulation using a valid transition', async () => {
    const instruments = TestBed.inject(InstrumentSetService);
    instruments.updateStatus('ins-001', 'reserved').subscribe();
    const realtime = TestBed.inject(RealtimeService);
    const events: RealtimeEvent[] = [];
    realtime.event$.subscribe((event) => events.push(event));
    await vi.advanceTimersByTimeAsync(50_400);
    expect(events.filter((event) => event.type === 'INSTRUMENT_STATUS_CHANGED')).toHaveLength(1);
    instruments.getInstrumentSetById('ins-001').subscribe((i) => expect(i!.status).toBe('in-use'));
    await vi.advanceTimersByTimeAsync(100);
  });
});
