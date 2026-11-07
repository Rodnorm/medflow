import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { INITIAL_INSTRUMENT_SETS } from '../../data/synthetic-data';
import {
  canTransitionInstrumentSet,
  InstrumentSet,
  InstrumentSetStatus,
} from '../../models/instrument-set/instrument-set.model';
import type { IInstrumentApi } from '../../api/api.tokens';
import { ApiSimulationService } from '../api-simulation/api-simulation.service';
import { loadStorage, removeStorage, saveStorage } from '../../util/storage.util';

export const INSTRUMENTS_STORAGE_KEY = 'medflow_instruments_v1';

@Injectable({
  providedIn: 'root',
})
export class InstrumentSetService implements IInstrumentApi {
  private readonly simulation = inject(ApiSimulationService);
  private instrumentSets: InstrumentSet[] = loadStorage(INSTRUMENTS_STORAGE_KEY, [
    ...INITIAL_INSTRUMENT_SETS,
  ]);

  getInstrumentSets(): Observable<readonly InstrumentSet[]> {
    return this.simulation.respond(() => this.instrumentSets);
  }

  getInstrumentSetById(id: string): Observable<InstrumentSet | undefined> {
    return this.simulation.respond(() => this.instrumentSets.find((p) => p.id === id), 0.5);
  }

  updateStatus(id: string, newStatus: InstrumentSetStatus): Observable<InstrumentSet> {
    return this.simulation.respond(() => {
      const current = this.instrumentSets.find((p) => p.id === id);

      if (!current) {
        throw new Error(`Instrument Set with id "${id}" not found.`);
      }

      if (!canTransitionInstrumentSet(current.status, newStatus)) {
        throw new Error(`Cannot transition from "${current.status}" to "${newStatus}"`);
      }

      const updated: InstrumentSet = {
        ...current,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      this.instrumentSets = this.instrumentSets.map((item) => (item.id === id ? updated : item));
      saveStorage(INSTRUMENTS_STORAGE_KEY, this.instrumentSets);
      return updated;
    });
  }

  reset(): void {
    removeStorage(INSTRUMENTS_STORAGE_KEY);
    this.instrumentSets = [...INITIAL_INSTRUMENT_SETS];
  }
}
