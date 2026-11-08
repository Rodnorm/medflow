import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ActivityEvent } from '../../../core/models/activity/activity.model';
import { formatRelativeTime } from '../../../core/util/relative-time';
import { EmptyStateComponent } from '../empty-state/empty-state';

interface FeedItem {
  readonly event: ActivityEvent;
  readonly icon: string;
  readonly link: readonly string[];
  readonly relative: string;
}

const ICONS: Record<ActivityEvent['type'], string> = {
  procedure_status_changed: 'swap_horiz',
  procedure_rescheduled: 'event_repeat',
  instrument_status_changed: 'inventory_2',
};

@Component({
  selector: 'app-activity-feed',
  imports: [DatePipe, RouterLink, MatIconModule, EmptyStateComponent],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
})
export class ActivityFeedComponent {
  readonly events = input.required<readonly ActivityEvent[]>();
  readonly emptyMessage = input<string>('No activity recorded yet.');
  readonly compact = input<boolean>(false);

  readonly items = computed<readonly FeedItem[]>(() => {
    const now = new Date();
    return this.events().map((event) => ({
      event,
      icon: ICONS[event.type],
      link:
        event.type === 'instrument_status_changed'
          ? ['/instruments', event.entityId]
          : ['/procedures', event.entityId],
      relative: formatRelativeTime(event.timestamp, now),
    }));
  });
}

