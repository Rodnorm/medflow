export interface ActivityEvent {
  id: string;
  type: 'procedure_status_changed' | 'instrument_status_changed' | 'procedure_rescheduled';
  title: string;
  description: string;
  entityId: string;
  entityCode: string;
  toStatus: string;
  timestamp: string;
  author: string;
}
