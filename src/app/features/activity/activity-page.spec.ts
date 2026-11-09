import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivityPageComponent } from './activity-page';
import { ActivityStore } from '../../core/store/activity/activity.store';

describe('ActivityPageComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(ActivityPageComponent);
    const store = TestBed.inject(ActivityStore);
    store.recordEvent({
      type: 'instrument_status_changed',
      title: 'Instrument Set CLEANING',
      description: 'Sinus set sent to cleaning',
      entityId: 'ins-004',
      entityCode: 'INS-ENT-01',
      toStatus: 'cleaning',
      author: 'Instrument Manager',
    });
    store.recordEvent({
      type: 'procedure_rescheduled',
      title: 'Procedure Rescheduled',
      description: 'Hip replacement moved to OR-4',
      entityId: 'prc-010',
      entityCode: 'PRC-2026-010',
      toStatus: 'planned',
      author: 'Nurse Coordinator',
    });
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ActivityPageComponent], providers: [provideRouter([])] });
  });

  it('lists every recorded event, newest first', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    expect(component.filteredEvents()).toHaveLength(component.totalCount());
    expect(component.filteredEvents()[0].entityCode).toBe('PRC-2026-010');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.feed-item')).toHaveLength(
      component.totalCount(),
    );
  });

  it('filters by entity type, treating reschedules as procedure activity', () => {
    const component = setup().componentInstance;
    component.typeFilter.set('instrument');
    expect(component.filteredEvents().map((event) => event.entityCode)).toEqual(['INS-ENT-01']);

    component.typeFilter.set('procedure');
    expect(component.filteredEvents().every((event) => event.type !== 'instrument_status_changed')).toBe(true);
    expect(component.filteredEvents().map((event) => event.entityCode)).toContain('PRC-2026-010');
  });

  it('searches across title, description, code and author', () => {
    const component = setup().componentInstance;
    component.search.set('  hip replacement ');
    expect(component.filteredEvents().map((event) => event.entityCode)).toEqual(['PRC-2026-010']);
    component.search.set('instrument manager');
    expect(component.filteredEvents().map((event) => event.entityCode)).toEqual(['INS-ENT-01']);
  });

  it('shows an empty state when nothing matches', () => {
    const fixture = setup();
    fixture.componentInstance.search.set('zzz-no-match');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No activity matches the current filters.',
    );
  });
});

