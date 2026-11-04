import { Component, computed, input, output, signal } from '@angular/core';

export interface ChartSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}
@Component({
  selector: 'app-donut-chart',
  templateUrl: './donut-chart.html',
  styleUrls: ['./donut-chart.scss'],
})
export class DonutChartComponent {
  readonly title = input<string>('Chart');
  readonly data = input.required<readonly ChartSegment[]>();
  readonly segmentClick = output<string | null>();

  readonly activeId = signal<string | null>(null);
  readonly total = computed(() => this.data().reduce((acc, curr) => acc + curr.value, 0));

  readonly circumference = 2 * Math.PI * 40;

  readonly slices = computed(() => {
    const totalVal = this.total();
    let accumulated = 0;
    return this.data().map((item) => {
      const ratio = totalVal > 0 ? item.value / totalVal : 0;
      const strokeLength = ratio * this.circumference;
      const dashArray = `${strokeLength} ${this.circumference - strokeLength}`;
      const dashOffset = -accumulated;

      accumulated += strokeLength;

      return {
        ...item,
        dashArray,
        dashOffset,
      };
    });
  });

  selectSegment(id: string): void {
    const next = this.activeId() === id ? null : id;
    this.activeId.set(next);
    this.segmentClick.emit(next);
  }

  getPercentage(value: number): number {
    const t = this.total();
    return t > 0 ? Math.round((value / t) * 100) : 0;
  }
}
