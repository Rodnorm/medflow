import { inject, Injectable } from '@angular/core';
import { InstrumentsStore } from './instruments.store';
import { InstrumentStatusFilter } from '../../../features/instruments/instrument-list/instrument-list';
import {
  InstrumentSet,
  InstrumentSetStatus,
} from '../../models/instrument-set/instrument-set.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentFacade {
  private readonly store = inject(InstrumentsStore);

  readonly error = this.store.error;
  readonly loading = this.store.loading;
  readonly entityMap = this.store.entityMap;
  readonly instruments = this.store.instruments;
  readonly instrument = this.store.instruments;
  readonly filteredInstruments = this.store.filteredInstruments;

  loadInstruments(): void {
    this.store.loadInstruments();
  }

  setSearchTerm(searchTerm: string): void {
    this.store.setSearchTerm(searchTerm);
  }

  setSelectedStatus(status: InstrumentStatusFilter): void {
    this.store.setSelectedStatus(status);
  }

  updateStatus(set: InstrumentSet, newStatus: InstrumentSetStatus): void {
    this.store.updateStatus({ set, newStatus });
  }

  clearError(): void {
    this.store.clearError();
  }
}

export { InstrumentFacade as InstrumentsFacade };
