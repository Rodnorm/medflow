import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty-state" role="status">
      <mat-icon class="empty-icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <p class="empty-message">{{ message() }}</p>
      @if (hint()) {
        <p class="empty-hint">{{ hint() }}</p>
      }
      <div class="empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 56px 20px;
      text-align: center;
    }

    .empty-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--med-text-muted);
    }

    .empty-message {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--med-text-primary);
    }

    .empty-hint {
      margin: 0;
      font-size: 0.875rem;
      color: var(--med-text-secondary);
    }

    .empty-actions {
      margin-top: 8px;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly message = input.required<string>();
  readonly hint = input<string>('');
}

