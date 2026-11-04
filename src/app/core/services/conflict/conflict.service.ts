import { computed, inject, Injectable } from '@angular/core';
import { InstrumentFacade } from '../../store/instruments/instruments.facade';
import { ProceduresFacade } from '../../store/procedures/procedures.facade';
import { InstrumentSet } from '../../models/instrument-set/instrument-set.model';
import { detectOperationalConflicts, OperationalAlert } from '../../domain/conflict.detector';

@Injectable({
  providedIn: 'root',
})
export class ConflictService {
  private readonly proceduresFacade = inject(ProceduresFacade);
  private readonly instrumentFacade = inject(InstrumentFacade);

  readonly instrumentsMap = computed(() => {
    const map = new Map<string, InstrumentSet>();
    for (const item of this.instrumentFacade.instrument()) {
      map.set(item.id, item);
    }
    return map;
  });

  readonly activeAlerts = computed<readonly OperationalAlert[]>(() => {
    return detectOperationalConflicts(this.proceduresFacade.procedures(), this.instrumentsMap());
  });

  readonly criticalCount = computed(
    () => this.activeAlerts().filter((a) => a.severity === 'critical').length,
  );

  readonly totalAlertsCount = computed(() => this.activeAlerts().length);
}
