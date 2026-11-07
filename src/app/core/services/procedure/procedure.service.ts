import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { canPlaceProcedure } from '../../domain/schedule.rules';
import {
  canTransitionProcedure,
  Procedure,
  ProcedureStatus,
} from '../../models/procedure/procedure.model';
import { INITIAL_PROCEDURES } from '../../data/synthetic-data';
import type { IProcedureApi } from '../../api/api.tokens';
import { ApiSimulationService } from '../api-simulation/api-simulation.service';
import { loadStorage, removeStorage, saveStorage } from '../../util/storage.util';

export const PROCEDURES_STORAGE_KEY = 'medflow_procedures_v1';

@Injectable({
  providedIn: 'root',
})
export class ProcedureService implements IProcedureApi {
  private readonly simulation = inject(ApiSimulationService);
  private procedures: Procedure[] = loadStorage(PROCEDURES_STORAGE_KEY, [...INITIAL_PROCEDURES]);

  getProcedures(): Observable<readonly Procedure[]> {
    return this.simulation.respond(() => this.procedures);
  }

  getProcedureById(id: string): Observable<Procedure | undefined> {
    return this.simulation.respond(() => this.procedures.find((p) => p.id === id), 0.5);
  }

  updateStatus(id: string, newStatus: ProcedureStatus): Observable<Procedure> {
    return this.simulation.respond(() => {
      const current = this.requireProcedure(id);

      if (!canTransitionProcedure(current.status, newStatus)) {
        throw new Error(`Cannot transition from "${current.status}" to "${newStatus}"`);
      }

      return this.replace({ ...current, status: newStatus, updatedAt: new Date().toISOString() });
    });
  }

  moveProcedure(id: string, operatingRoom: string, scheduledDate: string): Observable<Procedure> {
    return this.simulation.respond(() => {
      const current = this.requireProcedure(id);
      const placement = canPlaceProcedure(this.procedures, current, operatingRoom, scheduledDate);

      if (!placement.ok) {
        throw new Error(placement.reason);
      }

      return this.replace({
        ...current,
        operatingRoom,
        scheduledDate,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  reset(): void {
    removeStorage(PROCEDURES_STORAGE_KEY);
    this.procedures = [...INITIAL_PROCEDURES];
  }

  private requireProcedure(id: string): Procedure {
    const procedure = this.procedures.find((p) => p.id === id);
    if (!procedure) {
      throw new Error(`Procedure with id "${id}" not found.`);
    }
    return procedure;
  }

  private replace(updated: Procedure): Procedure {
    this.procedures = this.procedures.map((item) => (item.id === updated.id ? updated : item));
    saveStorage(PROCEDURES_STORAGE_KEY, this.procedures);
    return updated;
  }
}
