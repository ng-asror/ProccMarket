// forum.routes.ts
import { Routes } from '@angular/router';

export const forumRoutes: Routes = [
  {
    path: 'forum',
    loadComponent: () => import('./forum').then((m) => m.Forum),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages').then((p) => p.Main),
      },
      {
        path: 'section/:id',
        loadComponent: () => import('./pages').then((p) => p.Section),
      },
    ],
  },
];
