import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import {
  ApiSimulationService,
  DEFAULT_LATENCY_MS,
  MAX_LATENCY_MS,
  SIMULATED_FAILURE_MESSAGE,
} from './api-simulation.service';

describe('ApiSimulationService', () => {
  let service: ApiSimulationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ApiSimulationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays the response by the configured latency', async () => {
    service.setLatency(500);
    const produce = vi.fn(() => 'payload');
    let result: string | undefined;
    service.respond(produce).subscribe((value) => (result = value));

    await vi.advanceTimersByTimeAsync(499);
    expect(result).toBeUndefined();
    expect(produce).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(result).toBe('payload');
  });

  it('scales latency by weight', async () => {
    service.setLatency(400);
    let result: string | undefined;
    service.respond(() => 'half', 0.5).subscribe((value) => (result = value));
    await vi.advanceTimersByTimeAsync(200);
    expect(result).toBe('half');
  });

  it('clamps latency to the supported range', () => {
    service.setLatency(-50);
    expect(service.latencyMs()).toBe(0);
    service.setLatency(99_999);
    expect(service.latencyMs()).toBe(MAX_LATENCY_MS);
  });

  it('fails without producing a result while failure mode is on', async () => {
    service.setForceFailures(true);
    const produce = vi.fn(() => 'never');
    const outcome = firstValueFrom(service.respond(produce)).catch((error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS);
    expect(await outcome).toBe(SIMULATED_FAILURE_MESSAGE);
    expect(produce).not.toHaveBeenCalled();
  });

  it('surfaces errors thrown while producing a result', async () => {
    const outcome = firstValueFrom(
      service.respond(() => {
        throw new Error('Rejected');
      }),
    ).catch((error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS);
    expect(await outcome).toBe('Rejected');
  });

  it('restores defaults on reset', () => {
    service.setLatency(1200);
    service.setForceFailures(true);
    service.reset();
    expect(service.latencyMs()).toBe(DEFAULT_LATENCY_MS);
    expect(service.forceFailures()).toBe(false);
  });
});

