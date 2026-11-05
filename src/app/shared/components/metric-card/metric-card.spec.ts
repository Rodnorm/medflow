import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render title and value correctly', () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('title', 'Total Procedures');
    fixture.componentRef.setInput('value', 24);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.metric-title')?.textContent).toContain('Total Procedures');
    expect(compiled.querySelector('.metric-value')?.textContent).toContain('24');
  });

  it('should display loading spinner when loading is true', () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('title', 'Total Procedures');
    fixture.componentRef.setInput('value', 24);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-progress-spinner')).not.toBeNull();
  });

  it('should render optional hint when provided', () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('title', 'Active Operating Rooms');
    fixture.componentRef.setInput('value', 6);
    fixture.componentRef.setInput('hint', 'All running smoothly');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.metric-hint')?.textContent).toContain('All running smoothly');
  });
});
