import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./features/overview/overview').then((m) => m.OverviewComponent),
  },
  {
    path: 'instruments',
    loadComponent: () =>
      import('./features/instruments/instrument-list/instrument-list').then(
        (m) => m.InstrumentListComponent
      ),
  },
  {
    path: 'procedures',
    loadComponent: () =>
      import('./features/procedures/procedure-list/procedure-list').then(
        (m) => m.ProcedureListComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'overview',
  },
];
