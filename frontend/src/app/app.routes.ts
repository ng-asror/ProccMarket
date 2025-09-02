import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((p) => p.Layout),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./modules').then((m) => m.Home),
      },
      {
        path: 'forum',
        loadComponent: () => import('./modules').then((m) => m.Forum),
      },
      {
        path: 'search',
        loadComponent: () => import('./modules').then((m) => m.Search),
      },
      {
        path: 'balance',
        loadComponent: () => import('./modules').then((m) => m.Balance),
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules').then((m) => m.Profile),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
