import { Routes } from '@angular/router';

export const newsRoutes: Routes = [
  {
    path: 'news',
    loadComponent: () => import('./news').then((m) => m.News),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages').then((p) => p.Main),
      },
      {
        path: ':id',
        loadComponent: () => import('./pages').then((p) => p.Section),
      },
    ],
  },
];
