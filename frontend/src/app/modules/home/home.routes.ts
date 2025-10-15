import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home').then((p) => p.Home),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages').then((p) => p.Main),
      },
      {
        path: 'topic/:id',
        loadComponent: () => import('./pages').then((p) => p.Topic),
      },
      {
        path: 'section/:form_id',
        loadComponent: () => import('./pages').then((p) => p.SectionComponent),
      },
    ],
  },
];
