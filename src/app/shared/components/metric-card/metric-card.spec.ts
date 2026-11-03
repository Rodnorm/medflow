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
    // Setting modern Signal Inputs in tests via setInput
    fixture.componentRef.setInput('title', 'Total Procedures');
    fixture.componentRef.setInput('value', 24);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.metric-title')?.textContent).toContain('Total Procedures');
    expect(compiled.querySelector('.metric-value')?.textContent).toContain('24');
  });

  it('should display loading spinner when loading is true', () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('title', 'In Progress');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-progress-spinner')).not.toBeNull();
    expect(compiled.querySelector('.metric-value')).toBeNull();
  });

  it('should render link when route input is provided', () => {
    const fixture = TestBed.createComponent(MetricCard);
    fixture.componentRef.setInput('title', 'Available Sets');
    fixture.componentRef.setInput('route', '/instruments');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.metric-link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/instruments');
  });
});

