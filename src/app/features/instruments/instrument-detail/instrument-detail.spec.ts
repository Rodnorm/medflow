import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { InstrumentDetailComponent } from './instrument-detail';
import { INSTRUMENT_SET_API_TOKEN } from '../../../core/api/api.tokens';
import { INITIAL_INSTRUMENT_SETS } from '../../../core/data/synthetic-data';
import { InstrumentSet } from '../../../core/models/instrument-set/instrument-set.model';
import { Procedure } from '../../../core/models/procedure/procedure.model';
import { RealtimeService } from '../../../core/services/realtime/realtime.service';
import { ActivityStore } from '../../../core/store/activity/activity.store';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../../core/store/procedures/procedures.selectors';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

const instrument: InstrumentSet = INITIAL_INSTRUMENT_SETS[0];

function procedure(id: string, status: Procedure['status'], day: number): Procedure {
  return {
    id,
    code: id.toUpperCase(),
    title: `Procedure ${id}`,
    operatingRoom: 'OR-2',
    scheduledDate: new Date(2026, 10, day, 9).toISOString(),
    status,
    instrumentSetId: instrument.id,
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

describe('InstrumentDetailComponent', () => {
  const api = { getInstrumentSets: vi.fn(), updateStatus: vi.fn(), reset: vi.fn() };
  const confirm = vi.fn();

  function setup(procedures: Procedure[], id = instrument.id) {
    TestBed.configureTestingModule({
      imports: [InstrumentDetailComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectAllProcedures, value: procedures },
            { selector: selectProceduresLoading, value: false },
            { selector: selectProceduresError, value: null },
          ],
        }),
        { provide: INSTRUMENT_SET_API_TOKEN, useValue: api },
        { provide: RealtimeService, useValue: { event$: new Subject() } },
        { provide: ConfirmDialogService, useValue: { confirm } },
      ],
    });
    const fixture = TestBed.createComponent(InstrumentDetailComponent);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    api.getInstrumentSets.mockReturnValue(of([instrument]));
    api.updateStatus.mockImplementation((id: string, status: InstrumentSet['status']) =>
      of({ ...instrument, id, status }),
    );
    confirm.mockReturnValue(of(true));
  });

  it('shows the set with its upcoming reservations and usage history', () => {
    const fixture = setup([
      procedure('a', 'planned', 3),
      procedure('b', 'in-progress', 2),
      procedure('c', 'completed', 1),
    ]);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.title')?.textContent).toContain(instrument.name);
    expect(fixture.componentInstance.upcoming().map((p) => p.id)).toEqual(['b', 'a']);
    expect(fixture.componentInstance.history().map((p) => p.id)).toEqual(['c']);
    expect(element.querySelectorAll('.procedure-item')).toHaveLength(3);
  });

  it('resolves the set by its code as well as its id', () => {
    const fixture = setup([], instrument.code.toLowerCase());
    expect(fixture.componentInstance.instrument()?.id).toBe(instrument.id);
  });

  it('offers only transitions that the state machine allows', () => {
    const fixture = setup([]);
    expect(fixture.componentInstance.transitions()).toEqual(['reserved', 'maintenance']);
  });

  it('applies a regular transition without asking for confirmation', () => {
    const fixture = setup([procedure('a', 'planned', 3)]);
    fixture.componentInstance.transition('reserved');
    expect(confirm).not.toHaveBeenCalled();
    expect(api.updateStatus).toHaveBeenCalledWith(instrument.id, 'reserved');
  });

  it('asks before sending a reserved set to maintenance and honours a refusal', () => {
    confirm.mockReturnValue(of(false));
    const fixture = setup([procedure('a', 'planned', 3)]);
    fixture.componentInstance.transition('maintenance');
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: `Send ${instrument.code} to maintenance?`, tone: 'danger' }),
    );
    expect(api.updateStatus).not.toHaveBeenCalled();
  });

  it('sends the set to maintenance after confirmation', () => {
    const fixture = setup([procedure('a', 'planned', 3)]);
    fixture.componentInstance.transition('maintenance');
    expect(api.updateStatus).toHaveBeenCalledWith(instrument.id, 'maintenance');
  });

  it('skips the confirmation when no procedure depends on the set', () => {
    const fixture = setup([procedure('c', 'completed', 1)]);
    fixture.componentInstance.transition('maintenance');
    expect(confirm).not.toHaveBeenCalled();
    expect(api.updateStatus).toHaveBeenCalledWith(instrument.id, 'maintenance');
  });

  it('only lists activity that belongs to this set', () => {
    const fixture = setup([]);
    const activity = TestBed.inject(ActivityStore);
    activity.recordEvent({
      type: 'instrument_status_changed',
      title: 'Instrument Set RESERVED',
      description: 'reserved',
      entityId: instrument.id,
      entityCode: instrument.code,
      toStatus: 'reserved',
      author: 'Test',
    });
    activity.recordEvent({
      type: 'instrument_status_changed',
      title: 'Other',
      description: 'other',
      entityId: 'ins-999',
      entityCode: 'INS-999',
      toStatus: 'reserved',
      author: 'Test',
    });
    expect(fixture.componentInstance.events().map((event) => event.entityId)).toEqual([instrument.id]);
  });

  it('renders a not-found state for an unknown set', () => {
    const fixture = setup([], 'does-not-exist');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Instrument set not found');
  });
});

