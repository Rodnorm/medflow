import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { SimulationPanelComponent } from './simulation-panel';
import { INSTRUMENT_SET_API_TOKEN, PROCEDURE_API_TOKEN } from '../../../core/api/api.tokens';
import { RealtimeService } from '../../../core/services/realtime/realtime.service';
import { ApiSimulationService } from '../../../core/services/api-simulation/api-simulation.service';
import { ActivityStore } from '../../../core/store/activity/activity.store';
import { ProceduresActions } from '../../../core/store/procedures/procedures.action';

describe('SimulationPanelComponent', () => {
  const procedureApi = { reset: vi.fn() };
  const instrumentApi = { reset: vi.fn(), getInstrumentSets: vi.fn(() => of([])) };

  function setup() {
    TestBed.configureTestingModule({
      imports: [SimulationPanelComponent],
      providers: [
        provideMockStore(),
        { provide: PROCEDURE_API_TOKEN, useValue: procedureApi },
        { provide: INSTRUMENT_SET_API_TOKEN, useValue: instrumentApi },
        { provide: RealtimeService, useValue: { event$: new Subject() } },
      ],
    });
    const store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(SimulationPanelComponent);
    fixture.detectChanges();
    return { fixture, store };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the trigger when the simulation deviates from the defaults', () => {
    const { fixture } = setup();
    const simulation = TestBed.inject(ApiSimulationService);
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('.simulation-trigger') as HTMLElement;

    expect(trigger.classList.contains('active')).toBe(false);
    simulation.setForceFailures(true);
    fixture.detectChanges();
    expect(trigger.classList.contains('active')).toBe(true);
  });

  it('resets data, activity and simulation settings, then reloads both collections', () => {
    const { fixture, store } = setup();
    const simulation = TestBed.inject(ApiSimulationService);
    const activity = TestBed.inject(ActivityStore);
    simulation.setLatency(1500);
    simulation.setForceFailures(true);
    activity.recordEvent({
      type: 'procedure_status_changed',
      title: 'x',
      description: 'x',
      entityId: 'p',
      entityCode: 'P',
      toStatus: 'planned',
      author: 'test',
    });
    const baseline = activity.activities().length - 1;

    fixture.componentInstance.resetDemo();

    expect(procedureApi.reset).toHaveBeenCalledTimes(1);
    expect(instrumentApi.reset).toHaveBeenCalledTimes(1);
    expect(simulation.latencyMs()).toBe(200);
    expect(simulation.forceFailures()).toBe(false);
    expect(activity.activities()).toHaveLength(baseline);
    expect(store.dispatch).toHaveBeenCalledWith(ProceduresActions.loadProcedures());
    expect(instrumentApi.getInstrumentSets).toHaveBeenCalled();
  });
});

