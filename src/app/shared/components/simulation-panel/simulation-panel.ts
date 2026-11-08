import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { INSTRUMENT_SET_API_TOKEN, PROCEDURE_API_TOKEN } from '../../../core/api/api.tokens';
import {
  ApiSimulationService,
  DEFAULT_LATENCY_MS,
} from '../../../core/services/api-simulation/api-simulation.service';
import { ActivityStore } from '../../../core/store/activity/activity.store';
import { InstrumentsFacade } from '../../../core/store/instruments/instruments.facade';
import { ProceduresFacade } from '../../../core/store/procedures/procedures.facade';

@Component({
  selector: 'app-simulation-panel',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatSliderModule, MatSlideToggleModule],
  templateUrl: './simulation-panel.html',
  styleUrl: './simulation-panel.scss',
})
export class SimulationPanelComponent {
  readonly simulation = inject(ApiSimulationService);
  private readonly procedureApi = inject(PROCEDURE_API_TOKEN);
  private readonly instrumentApi = inject(INSTRUMENT_SET_API_TOKEN);
  private readonly proceduresFacade = inject(ProceduresFacade);
  private readonly instrumentsFacade = inject(InstrumentsFacade);
  private readonly activityStore = inject(ActivityStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly customized = computed(
    () => this.simulation.forceFailures() || this.simulation.latencyMs() !== DEFAULT_LATENCY_MS,
  );

  resetDemo(): void {
    this.simulation.reset();
    this.procedureApi.reset();
    this.instrumentApi.reset();
    this.activityStore.reset();
    this.proceduresFacade.loadProcedures();
    this.instrumentsFacade.loadInstruments();
    this.snackBar.open('Demo data and API simulation reset', 'Dismiss', { duration: 3000 });
  }
}
