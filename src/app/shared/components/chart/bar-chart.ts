import { Component, computed, input } from '@angular/core';

export interface BarDatum {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

interface PlottedBar extends BarDatum {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly labelX: number;
  readonly showLabel: boolean;
  readonly showValue: boolean;
}

interface AxisTick {
  readonly value: number;
  readonly y: number;
}

export function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChartComponent {
  readonly title = input.required<string>();
  readonly data = input.required<readonly BarDatum[]>();
  readonly unit = input<string>('');
  readonly maxValue = input<number | null>(null);
  readonly labelEvery = input<number>(1);

  readonly viewWidth = 640;
  readonly viewHeight = 240;
  private readonly plot = { left: 40, right: 632, top: 16, bottom: 208 };

  readonly yMax = computed(() => {
    const explicit = this.maxValue();
    if (explicit !== null) return explicit;
    return niceCeiling(Math.max(0, ...this.data().map((datum) => datum.value)));
  });

  readonly ticks = computed<readonly AxisTick[]>(() => {
    const max = this.yMax();
    const { top, bottom } = this.plot;
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      value: Math.round(max * ratio * 100) / 100,
      y: bottom - ratio * (bottom - top),
    }));
  });

  readonly gridBounds = { left: this.plot.left, right: this.plot.right };
  readonly labelBaseline = this.plot.bottom + 18;

  readonly bars = computed<readonly PlottedBar[]>(() => {
    const data = this.data();
    const { left, right, top, bottom } = this.plot;
    const slot = (right - left) / Math.max(1, data.length);
    const barWidth = Math.min(36, slot * 0.64);
    const max = this.yMax();
    const every = Math.max(1, this.labelEvery());

    return data.map((datum, index) => {
      const height = max > 0 ? Math.min(1, datum.value / max) * (bottom - top) : 0;
      const x = left + index * slot + (slot - barWidth) / 2;
      return {
        ...datum,
        x,
        y: bottom - height,
        width: barWidth,
        height,
        labelX: x + barWidth / 2,
        showLabel: index % every === 0,
        showValue: datum.value > 0,
      };
    });
  });
}

