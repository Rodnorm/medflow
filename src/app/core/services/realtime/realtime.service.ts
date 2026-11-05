import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  EMPTY,
  filter,
  interval,
  Observable,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProcedureService } from '../procedure/procedure.service';
import { InstrumentSetService } from '../instrument-set/instrument-set.service';
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
  private readonly procedures = inject(ProcedureService);
  private readonly instruments = inject(InstrumentSetService);
  private readonly destroyRef = inject(DestroyRef);
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

    this.simulationSub = interval(25000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tick) => {
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
    this.procedures
      .getProcedureById('prc-001')
      .pipe(
        filter((procedure) => procedure?.status === 'planned'),
        switchMap((procedure) => this.procedures.updateStatus(procedure!.id, 'in-progress')),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((procedure) => {
        const event: RealtimeEvent<ProcedureStatusPayload> = {
          id: `evt-${Date.now()}`,
          type: 'PROCEDURE_STATUS_CHANGED',
          timestamp: procedure.updatedAt,
          payload: {
            procedureId: procedure.id,
            status: procedure.status,
            updatedAt: procedure.updatedAt,
          },
        };
        this.recentlyUpdatedProcedureId.set(procedure.id);
        this.eventSubject.next(event);
        setTimeout(() => {
          if (this.recentlyUpdatedProcedureId() === procedure.id) {
            this.recentlyUpdatedProcedureId.set(null);
          }
        }, 3000);
      });
  }

  private emitInstrumentUpdate(): void {
    this.instruments
      .getInstrumentSetById('ins-001')
      .pipe(
        filter((instrument) => instrument?.status === 'reserved'),
        switchMap((instrument) => this.instruments.updateStatus(instrument!.id, 'in-use')),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((instrument) => {
        const event: RealtimeEvent<InstrumentStatusPayload> = {
          id: `evt-${Date.now()}`,
          type: 'INSTRUMENT_STATUS_CHANGED',
          timestamp: instrument.updatedAt,
          payload: {
            instrumentId: instrument.id,
            status: instrument.status,
            updatedAt: instrument.updatedAt,
          },
        };
        this.eventSubject.next(event);
      });
  }
}
