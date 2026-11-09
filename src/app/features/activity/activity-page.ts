import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivityStore } from '../../core/store/activity/activity.store';
import { ActivityFeedComponent } from '../../shared/components/activity-feed/activity-feed';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

export type ActivityTypeFilter = 'all' | 'procedure' | 'instrument';

@Component({
  selector: 'app-activity-page',
  imports: [
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    ActivityFeedComponent,
    PageHeaderComponent,
  ],
  styleUrl: './activity-page.scss',
  templateUrl: './activity-page.html',
})
export class ActivityPageComponent {
  private readonly activityStore = inject(ActivityStore);

  readonly typeFilter = signal<ActivityTypeFilter>('all');
  readonly search = signal<string>('');

  readonly filteredEvents = computed(() => {
    const type = this.typeFilter();
    const term = this.search().trim().toLowerCase();

    return this.activityStore.activities().filter((event) => {
      const isInstrument = event.type === 'instrument_status_changed';
      const matchesType =
        type === 'all' || (type === 'instrument' ? isInstrument : !isInstrument);
      const matchesSearch =
        !term ||
        [event.title, event.description, event.entityCode, event.author].some((field) =>
          field.toLowerCase().includes(term),
        );

      return matchesType && matchesSearch;
    });
  });

  readonly totalCount = computed(() => this.activityStore.activities().length);
}

