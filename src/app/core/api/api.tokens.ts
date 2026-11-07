import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { InstrumentSet, InstrumentSetStatus } from '../models/instrument-set/instrument-set.model';
import { Procedure, ProcedureStatus } from '../models/procedure/procedure.model';
import { ProcedureService } from '../services/procedure/procedure.service';
import { InstrumentSetService } from '../services/instrument-set/instrument-set.service';

export interface IProcedureApi {
  getProcedures(): Observable<readonly Procedure[]>;
  getProcedureById(id: string): Observable<Procedure | undefined>;
  updateStatus(id: string, newStatus: ProcedureStatus): Observable<Procedure>;
  moveProcedure(id: string, operatingRoom: string, scheduledDate: string): Observable<Procedure>;
  reset(): void;
}

export interface IInstrumentApi {
  getInstrumentSets(): Observable<readonly InstrumentSet[]>;
  getInstrumentSetById(id: string): Observable<InstrumentSet | undefined>;
  updateStatus(id: string, newStatus: InstrumentSetStatus): Observable<InstrumentSet>;
  reset(): void;
}

export const PROCEDURE_API_TOKEN = new InjectionToken<IProcedureApi>('PROCEDURE_API_TOKEN', {
  providedIn: 'root',
  factory: () => inject(ProcedureService),
});

export const INSTRUMENT_SET_API_TOKEN = new InjectionToken<IInstrumentApi>(
  'INSTRUMENT_SET_API_TOKEN',
  {
    providedIn: 'root',
    factory: () => inject(InstrumentSetService),
  },
);
