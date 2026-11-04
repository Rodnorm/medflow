import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () => import('./features/overview/overview').then((m) => m.OverviewComponent),
  },
  {
    path: 'instruments',
    loadComponent: () =>
      import('./features/instruments/instrument-list/instrument-list').then(
        (m) => m.InstrumentListComponent,
      ),
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./features/schedule/or-schedule').then((m) => m.OrScheduleComponent),
  },
  {
    path: 'procedures/:id',
    loadComponent: () =>
      import('./features/procedures/procedure-detail/procedure-detail').then(
        (m) => m.ProcedureDetailComponent,
      ),
  },
  {
    path: 'procedure/:id',
    redirectTo: 'procedures/:id',
  },
  {
    path: 'procedures',
    loadComponent: () =>
      import('./features/procedures/procedure-list/procedure-list').then(
        (m) => m.ProcedureListComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'overview',
  },
];
