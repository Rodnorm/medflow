import { Injectable, signal } from '@angular/core';
import { defer, map, Observable, switchMap, throwError, timer } from 'rxjs';

export const DEFAULT_LATENCY_MS = 200;
export const MAX_LATENCY_MS = 3000;
export const SIMULATED_FAILURE_MESSAGE = 'Simulated network failure. Disable failure mode and retry.';

@Injectable({
  providedIn: 'root',
})
export class ApiSimulationService {
  readonly latencyMs = signal<number>(DEFAULT_LATENCY_MS);
  readonly forceFailures = signal<boolean>(false);

  setLatency(value: number): void {
    const bounded = Math.min(MAX_LATENCY_MS, Math.max(0, Math.round(value)));
    this.latencyMs.set(Number.isFinite(bounded) ? bounded : DEFAULT_LATENCY_MS);
  }

  setForceFailures(enabled: boolean): void {
    this.forceFailures.set(enabled);
  }

  reset(): void {
    this.latencyMs.set(DEFAULT_LATENCY_MS);
    this.forceFailures.set(false);
  }

  respond<T>(produce: () => T, latencyWeight = 1): Observable<T> {
    return defer(() => {
      const delayMs = Math.round(this.latencyMs() * latencyWeight);

      if (this.forceFailures()) {
        return timer(delayMs).pipe(
          switchMap(() => throwError(() => new Error(SIMULATED_FAILURE_MESSAGE))),
        );
      }

      return timer(delayMs).pipe(map(() => produce()));
    });
  }
}

