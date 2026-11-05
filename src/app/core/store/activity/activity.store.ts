import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ActivityEvent } from '../../models/activity/activity.model';
import { computed } from '@angular/core';

interface ActivityState {
  activities: ActivityEvent[];
}

const initialState: ActivityState = {
  activities: [
    {
      id: 'act-001',
      type: 'procedure_status_changed',
      title: 'Procedure In Progress',
      description: 'Laparoscopic Appendectomy started in OR-1',
      entityId: 'prc-001',
      entityCode: 'PRC-2026-001',
      toStatus: 'in-progress',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      author: 'Dr. Sarah Jenkins',
    },
    {
      id: 'act-002',
      type: 'procedure_status_changed',
      title: 'Procedure Completed',
      description: 'Total Hip Arthroplasty finished in OR-3',
      entityId: 'prc-002',
      entityCode: 'PRC-2026-002',
      toStatus: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      author: 'Dr. Marcus Vance',
    },
  ],
};
export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ activities }) => ({
    recentActivities: computed(() => activities().slice(0, 8)),
  })),
  withMethods((store) => ({
    recordEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
      const newEvent: ActivityEvent = {
        ...event,
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      patchState(store, { activities: [newEvent, ...store.activities()] });
    },
  })),
);
