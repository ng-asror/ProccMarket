import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: 'inbox',
    loadComponent: () => import('./notifications').then((p) => p.Notifications),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages').then((p) => p.Main),
        children: [
          {
            path: 'messages',
            loadComponent: () => import('./pages').then((p) => p.Messages),
          },
          {
            path: 'orders',
            loadComponent: () => import('./pages').then((p) => p.Comments),
          },
          {
            path: '',
            redirectTo: 'messages',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'chat/:chat_id/:user_id',
        loadComponent: () => import('./pages').then((p) => p.Chat),
      },
    ],
  },
];
