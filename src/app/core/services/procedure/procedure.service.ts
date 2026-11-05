import { of, Observable, delay, throwError } from 'rxjs';
import {
  canTransitionProcedure,
  Procedure,
  ProcedureStatus,
} from '../../models/procedure/procedure.model';
import { INITIAL_PROCEDURES } from '../../data/synthetic-data';
import { Injectable } from '@angular/core';
import type { IProcedureApi } from '../../api/api.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProcedureService implements IProcedureApi {
  private procedures: Procedure[] = [...INITIAL_PROCEDURES];

  getProcedures(): Observable<readonly Procedure[]> {
    return of(this.procedures).pipe(delay(200));
  }

  getProcedureById(id: string): Observable<Procedure | undefined> {
    const item = this.procedures.find((p) => p.id === id);
    return of(item).pipe(delay(100));
  }

  updateStatus(id: string, newStatus: ProcedureStatus): Observable<Procedure> {
    const currentIndex = this.procedures.findIndex((p) => p.id === id);

    if (currentIndex === -1) {
      return throwError(() => new Error(`Procedure with id "${id}" not found.`));
    }

    const currentItem = this.procedures[currentIndex];

    if (!canTransitionProcedure(currentItem.status, newStatus)) {
      return throwError(
        () => new Error(`Cannot transition from "${currentItem.status}" to "${newStatus}"`),
      );
    }

    const updatedItem: Procedure = {
      ...currentItem,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this.procedures = this.procedures.map((item, index) =>
      index === currentIndex ? updatedItem : item,
    );

    return of(updatedItem).pipe(delay(200));
  }
}
