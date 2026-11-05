import { Injectable } from '@angular/core';
import { of, Observable, delay, throwError } from 'rxjs';
import { INITIAL_INSTRUMENT_SETS } from '../../data/synthetic-data';
import {
  canTransitionInstrumentSet,
  InstrumentSet,
  InstrumentSetStatus,
} from '../../models/instrument-set/instrument-set.model';
import { IInstrumentApi } from '../../api/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class InstrumentSetService implements IInstrumentApi {
  private instrumentSets: InstrumentSet[] = [...INITIAL_INSTRUMENT_SETS];

  getInstrumentSets(): Observable<readonly InstrumentSet[]> {
    return of(this.instrumentSets).pipe(delay(200));
  }

  getInstrumentSetById(id: string): Observable<InstrumentSet | undefined> {
    const item = this.instrumentSets.find((p) => p.id === id);
    return of(item).pipe(delay(100));
  }

  updateStatus(id: string, newStatus: InstrumentSetStatus): Observable<InstrumentSet> {
    const currentIndex = this.instrumentSets.findIndex((p) => p.id === id);

    if (currentIndex === -1) {
      return throwError(() => new Error('Instrument Set  with id "${id}" not found.'));
    }

    const currentItem = this.instrumentSets[currentIndex];

    if (!canTransitionInstrumentSet(currentItem.status, newStatus)) {
      return throwError(
        () => new Error('Cannot transition from "${currentItem.status}" to "${newStatus}"'),
      );
    }

    const updatedItem: InstrumentSet = {
      ...currentItem,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this.instrumentSets = this.instrumentSets.map((item, index) =>
      index === currentIndex ? updatedItem : item,
    );

    return of(updatedItem).pipe(delay(200));
  }
}
