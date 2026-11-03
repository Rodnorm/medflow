import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-metric-card',
  imports: [
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatProgressSpinner,
  ],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
})
export class MetricCard {
  readonly title = input.required<string>();
  readonly value = input<number | string>(0);
  readonly loading = input<boolean>(false);
  readonly hint = input<string | null>(null);
  readonly route = input<string | null>(null);
}

