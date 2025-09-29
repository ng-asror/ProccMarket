// app.routes.ts
import { Routes } from '@angular/router';
import { newsRoutes } from './modules/news/news.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((p) => p.Layout),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./modules').then((m) => m.Home),
      },
      ...newsRoutes,
      ...notificationRoutes,
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
    ],
  },
  {
    path: 'comments/:id',
    loadComponent: () => import('./modules').then((p) => p.Comments),
  },
  {
    path: 'user/:username',
    loadComponent: () => import('./modules').then((p) => p.User),
  },
];
