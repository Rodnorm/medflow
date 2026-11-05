import { Injectable, signal } from '@angular/core';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import {
  InstrumentStatusPayload,
  ProcedureStatusPayload,
  RealtimeEvent,
} from '../../models/realtime/realtime.model';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private readonly eventSubject = new Subject<RealtimeEvent>();
  readonly event$: Observable<RealtimeEvent> = this.eventSubject.asObservable();

  readonly connectionState = signal<ConnectionState>('connected');
  readonly isSimulationActive = signal<boolean>(true);
  readonly recentlyUpdatedProcedureId = signal<string | null>(null);

  private simulationSub: Subscription | null = null;

  constructor() {
    this.startSimulation();
  }

  startSimulation(): void {
    if (this.simulationSub) return;

    this.isSimulationActive.set(true);
    this.connectionState.set('connected');

    this.simulationSub = interval(25000).subscribe((tick) => {
      if (tick % 2 === 0) {
        this.emitProcedureUpdate();
      } else {
        this.emitInstrumentUpdate();
      }
    });
  }

  stopSimulation(): void {
    this.simulationSub?.unsubscribe();
    this.simulationSub = null;
    this.isSimulationActive.set(false);
    this.connectionState.set('disconnected');
  }

  toggleSimulation(): void {
    if (this.isSimulationActive()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  private emitProcedureUpdate(): void {
    const targetId = 'prc-001';
    const event: RealtimeEvent<ProcedureStatusPayload> = {
      id: `evt-${Date.now()}`,
      type: 'PROCEDURE_STATUS_CHANGED',
      timestamp: new Date().toISOString(),
      payload: {
        procedureId: targetId,
        status: 'in-progress',
        updatedAt: new Date().toISOString(),
      },
    };

    this.recentlyUpdatedProcedureId.set(targetId);
    this.eventSubject.next(event);

    setTimeout(() => {
      if (this.recentlyUpdatedProcedureId() === targetId) {
        this.recentlyUpdatedProcedureId.set(null);
      }
    }, 3000);
  }

  private emitInstrumentUpdate(): void {
    const event: RealtimeEvent<InstrumentStatusPayload> = {
      id: `evt-${Date.now()}`,
      type: 'INSTRUMENT_STATUS_CHANGED',
      timestamp: new Date().toISOString(),
      payload: {
        status: 'in-use',
        updatedAt: new Date().toISOString(),
        instrumentId: 'ins-001',
      },
    };
    this.eventSubject.next(event);
  }
}
