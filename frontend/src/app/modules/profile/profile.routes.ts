import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile').then((p) => p.Profile),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages').then((p) => p.Main),
      },
      {
        path: 'update-profile',
        loadComponent: () => import('./pages').then((p) => p.UpdatePorfile),
      },
      {
        path: 'my-topics',
        loadComponent: () => import('./pages').then((p) => p.Topics),
      },
    ],
  },
];
