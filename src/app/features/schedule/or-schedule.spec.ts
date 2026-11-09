import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';
import { OrScheduleComponent } from './or-schedule';
import { Procedure } from '../../core/models/procedure/procedure.model';
import { toDayKey } from '../../core/domain/schedule.rules';
import { ProceduresActions } from '../../core/store/procedures/procedures.action';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
} from '../../core/store/procedures/procedures.selectors';

function procedure(overrides: Partial<Procedure> & Pick<Procedure, 'id'>): Procedure {
  return {
    code: overrides.id.toUpperCase(),
    title: `Procedure ${overrides.id}`,
    operatingRoom: 'OR-1',
    scheduledDate: new Date(2026, 10, 2, 9, 0).toISOString(),
    status: 'planned',
    instrumentSetId: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
    durationMinutes: 60,
    ...overrides,
  };
}

const at = (hour: number, minute = 0) => new Date(2026, 10, 2, hour, minute).toISOString();

describe('OrScheduleComponent', () => {
  let store: MockStore;

  function setup(procedures: Procedure[]) {
    TestBed.configureTestingModule({
      imports: [OrScheduleComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectAllProcedures, value: procedures },
            { selector: selectProceduresLoading, value: false },
            { selector: selectProceduresError, value: null },
          ],
        }),
      ],
    });
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');

    const fixture = TestBed.createComponent(OrScheduleComponent);
    fixture.componentRef.setInput('date', '2026-11-02');
    fixture.detectChanges();
    vi.mocked(store.dispatch).mockClear();
    return fixture;
  }

  function pressShift(fixture: ReturnType<typeof setup>, code: string, key: string) {
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      `button.schedule-block[aria-label^="${code},"]`,
    ) as HTMLButtonElement;
    button.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey: true, bubbles: true }));
    fixture.detectChanges();
  }

  it('renders a row for every known theater, including those from the data', () => {
    const fixture = setup([procedure({ id: 'a' }), procedure({ id: 'b', operatingRoom: 'OR-10' })]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.room-row')).toHaveLength(10);
    expect(element.querySelectorAll('button.schedule-block')).toHaveLength(2);
  });

  it('only shows procedures from the selected day', () => {
    const fixture = setup([
      procedure({ id: 'a' }),
      procedure({ id: 'b', scheduledDate: new Date(2026, 10, 3, 9).toISOString() }),
    ]);
    expect(fixture.componentInstance.dayProcedures().map((p) => p.id)).toEqual(['a']);
  });

  it('positions blocks proportionally to time and duration', () => {
    const fixture = setup([procedure({ id: 'a', scheduledDate: at(12), durationMinutes: 120 })]);
    const [block] = fixture.componentInstance.rows()[0].blocks;
    expect(block.left).toBeCloseTo(50, 5);
    expect(block.width).toBeCloseTo((120 / 1440) * 100, 5);
  });

  it('flags overlapping procedures', () => {
    const fixture = setup([
      procedure({ id: 'a' }),
      procedure({ id: 'b', scheduledDate: at(9, 30) }),
      procedure({ id: 'c', scheduledDate: at(15) }),
    ]);
    expect(fixture.componentInstance.conflictCount()).toBe(2);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.schedule-block.conflict')).toHaveLength(2);
  });

  it('reschedules a planned block 15 minutes later with Shift + ArrowRight', () => {
    const fixture = setup([procedure({ id: 'a' })]);
    pressShift(fixture, 'A', 'ArrowRight');
    expect(store.dispatch).toHaveBeenCalledWith(
      ProceduresActions.moveProcedure({ id: 'a', operatingRoom: 'OR-1', scheduledDate: at(9, 15) }),
    );
    expect(fixture.componentInstance.announcement()).toBe('A moved to OR-1 at 09:15');
  });

  it('moves a block to the next theater with Shift + ArrowDown', () => {
    const fixture = setup([procedure({ id: 'a' })]);
    pressShift(fixture, 'A', 'ArrowDown');
    expect(store.dispatch).toHaveBeenCalledWith(
      ProceduresActions.moveProcedure({ id: 'a', operatingRoom: 'OR-2', scheduledDate: at(9) }),
    );
  });

  it('rejects a move into an occupied slot and explains why', () => {
    const fixture = setup([
      procedure({ id: 'a' }),
      procedure({ id: 'b', operatingRoom: 'OR-2', scheduledDate: at(9) }),
    ]);
    pressShift(fixture, 'A', 'ArrowDown');
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(fixture.componentInstance.announcement()).toBe('OR-2 is already booked by B at that time.');
  });

  it('keeps started procedures fixed', () => {
    const fixture = setup([procedure({ id: 'a', status: 'in-progress' })]);
    pressShift(fixture, 'A', 'ArrowRight');
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('ignores arrow keys without Shift', () => {
    const fixture = setup([procedure({ id: 'a' })]);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button.schedule-block') as HTMLButtonElement;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('does not move past the first room or midnight', () => {
    const fixture = setup([procedure({ id: 'a', scheduledDate: at(23), durationMinutes: 60 })]);
    pressShift(fixture, 'A', 'ArrowUp');
    pressShift(fixture, 'A', 'ArrowRight');
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('navigates between days through the query string', () => {
    const fixture = setup([procedure({ id: 'a' })]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.shiftDay(1);
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { date: '2026-11-03' } }),
    );
  });

  it('only shows the now marker when the selected day is today', () => {
    const fixture = setup([procedure({ id: 'a' })]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.now-line')).toBeNull();

    fixture.componentRef.setInput('date', toDayKey(new Date()));
    fixture.detectChanges();
    expect(fixture.componentInstance.isToday()).toBe(true);
    expect(element.querySelector('.now-line')).not.toBeNull();
  });
});