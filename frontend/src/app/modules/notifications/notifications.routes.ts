import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: 'notifications',
    loadComponent: () => import('./notifications').then((p) => p.Notifications),
    children: [
      {
        path: 'all',
        loadComponent: () => import('./pages').then((p) => p.All),
      },
      {
        path: 'comments',
        loadComponent: () => import('./pages').then((p) => p.Comments),
      },
      {
        path: 'friends',
        loadComponent: () => import('./pages').then((p) => p.Friends),
      },
      {
        path: '',
        redirectTo: 'all',
        pathMatch: 'full',
      },
    ],
  },
];
