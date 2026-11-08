import { TestBed } from '@angular/core/testing';
import { BarChartComponent, niceCeiling } from './bar-chart';

describe('niceCeiling', () => {
  it('rounds up to a readable axis maximum', () => {
    expect(niceCeiling(0)).toBe(1);
    expect(niceCeiling(3)).toBe(5);
    expect(niceCeiling(7)).toBe(10);
    expect(niceCeiling(13)).toBe(20);
    expect(niceCeiling(86)).toBe(100);
    expect(niceCeiling(240)).toBe(500);
  });
});

describe('BarChartComponent', () => {
  function create(data: { id: string; label: string; value: number }[], extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(BarChartComponent);
    fixture.componentRef.setInput('title', 'Case load');
    fixture.componentRef.setInput('data', data);
    Object.entries(extra).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
    return fixture;
  }

  it('renders one bar per datum and mirrors the data in an accessible table', () => {
    const fixture = create([
      { id: 'a', label: 'OR-1', value: 40 },
      { id: 'b', label: 'OR-2', value: 80 },
    ]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('rect.bar')).toHaveLength(2);
    const rows = element.querySelectorAll('table.sr-only tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).toContain('OR-2');
    expect(rows[1].textContent).toContain('80');
  });

  it('scales bar heights against the axis maximum', () => {
    const fixture = create(
      [
        { id: 'a', label: 'A', value: 50 },
        { id: 'b', label: 'B', value: 100 },
      ],
      { maxValue: 100 },
    );
    const [first, second] = fixture.componentInstance.bars();
    expect(second.height).toBeGreaterThan(0);
    expect(first.height).toBeCloseTo(second.height / 2, 5);
  });

  it('hides value labels for empty bars and thins axis labels', () => {
    const fixture = create(
      [
        { id: 'a', label: '0h', value: 0 },
        { id: 'b', label: '1h', value: 2 },
        { id: 'c', label: '2h', value: 3 },
        { id: 'd', label: '3h', value: 1 },
      ],
      { labelEvery: 2 },
    );
    const bars = fixture.componentInstance.bars();
    expect(bars.map((bar) => bar.showValue)).toEqual([false, true, true, true]);
    expect(bars.map((bar) => bar.showLabel)).toEqual([true, false, true, false]);
  });

  it('copes with an empty dataset', () => {
    const fixture = create([]);
    expect(fixture.componentInstance.bars()).toEqual([]);
    expect(fixture.componentInstance.yMax()).toBe(1);
  });
});

