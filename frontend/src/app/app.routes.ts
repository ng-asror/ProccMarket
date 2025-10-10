// app.routes.ts
import { Routes } from '@angular/router';
import { newsRoutes } from './modules/news/news.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { authGuard } from './core';
import { profileRoutes } from './modules/profile/profile.routes';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./modules').then((m) => m.Home),
      },
      ...newsRoutes,
      ...notificationRoutes,
      ...profileRoutes,
      {
        path: 'search',
        loadComponent: () => import('./modules').then((m) => m.Search),
      },
      {
        path: 'balance',
        loadComponent: () => import('./modules').then((m) => m.Balance),
      },
      {
        path: 'comments/:id',
        loadComponent: () => import('./modules').then((p) => p.Comments),
      },
      {
        path: 'user/:username',
        loadComponent: () => import('./modules').then((p) => p.User),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth').then((p) => p.Auth),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/components').then((c) => c.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/components').then((c) => c.Register),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];
