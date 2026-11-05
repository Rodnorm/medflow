import { ProcedureStatus } from '../procedure/procedure.model';
import { InstrumentSetStatus } from '../instrument-set/instrument-set.model';

export type RealtimeEventType = 'PROCEDURE_STATUS_CHANGED' | 'INSTRUMENT_STATUS_CHANGED';

export interface ProcedureStatusPayload {
  updatedAt: string;
  procedureId: string;
  status: ProcedureStatus;
}

export interface InstrumentStatusPayload {
  updatedAt: string;
  instrumentId: string;
  status: InstrumentSetStatus;
}

export interface RealtimeEvent<T = ProcedureStatusPayload | InstrumentStatusPayload> {
  payload: T;
  id: string;
  timestamp: string;
  type: RealtimeEventType;
}
