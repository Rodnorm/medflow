import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { CommandPaletteComponent } from './command-palette';
import { INSTRUMENT_SET_API_TOKEN } from '../../../core/api/api.tokens';
import { INITIAL_INSTRUMENT_SETS, INITIAL_PROCEDURES } from '../../../core/data/synthetic-data';
import { RealtimeService } from '../../../core/services/realtime/realtime.service';
import { ThemeService } from '../../../core/services/theme/theme.service';
import {
  selectAllProcedures,
  selectProceduresError,
  selectProceduresLoading,
  selectTotalProcedures,
} from '../../../core/store/procedures/procedures.selectors';

describe('CommandPaletteComponent', () => {
  const close = vi.fn();
  const toggleTheme = vi.fn();
  const procedures = INITIAL_PROCEDURES.slice(0, 5);
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  function setup() {
    TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAllProcedures, value: procedures },
            { selector: selectTotalProcedures, value: procedures.length },
            { selector: selectProceduresLoading, value: false },
            { selector: selectProceduresError, value: null },
          ],
        }),
        { provide: MatDialogRef, useValue: { close } },
        { provide: ThemeService, useValue: { toggleTheme } },
        { provide: RealtimeService, useValue: { event$: new Subject() } },
        {
          provide: INSTRUMENT_SET_API_TOKEN,
          useValue: { getInstrumentSets: () => of(INITIAL_INSTRUMENT_SETS) },
        },
      ],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CommandPaletteComponent);
    fixture.detectChanges();
    return fixture;
  }

  const key = (value: string) => new KeyboardEvent('keydown', { key: value, cancelable: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with pages and actions', () => {
    const labels = setup().componentInstance.results().map((item) => item.label);
    expect(labels).toContain('Overview');
    expect(labels).toContain('Toggle theme');
    expect(labels.every((label) => !label.startsWith('PRC-'))).toBe(true);
  });

  it('finds procedures and instrument sets from the loaded stores', () => {
    const component = setup().componentInstance;
    component.onQuery(procedures[0].code);
    expect(component.results()[0].url).toBe(`/procedures/${procedures[0].id}`);

    component.onQuery(INITIAL_INSTRUMENT_SETS[0].code);
    expect(component.results()[0].url).toBe(`/instruments/${INITIAL_INSTRUMENT_SETS[0].id}`);
  });

  it('wraps the active option when navigating with the arrow keys', () => {
    const component = setup().componentInstance;
    const count = component.results().length;
    component.onKeydown(key('ArrowUp'));
    expect(component.activeIndex()).toBe(count - 1);
    component.onKeydown(key('ArrowDown'));
    expect(component.activeIndex()).toBe(0);
  });

  it('navigates to the active result with Enter and closes the dialog', () => {
    const component = setup().componentInstance;
    component.onQuery('schedule');
    component.onKeydown(key('Enter'));
    expect(navigateByUrl).toHaveBeenCalledWith('/schedule');
    expect(close).toHaveBeenCalled();
  });

  it('runs the theme action instead of navigating', () => {
    const component = setup().componentInstance;
    component.onQuery('theme');
    component.onKeydown(key('Enter'));
    expect(toggleTheme).toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('resets the active option when the query changes and reports empty results', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    component.activeIndex.set(3);
    component.onQuery('zzzz-no-match');
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No results for "zzzz-no-match".');
    component.onKeydown(key('Enter'));
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});

