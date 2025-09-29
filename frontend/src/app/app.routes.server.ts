import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'home', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },
  { path: 'news', renderMode: RenderMode.Server },
  { path: 'news/:id', renderMode: RenderMode.Server },
  { path: 'profile', renderMode: RenderMode.Server },
  { path: 'balance', renderMode: RenderMode.Server },
  { path: 'comments/:id', renderMode: RenderMode.Server },
  { path: 'user/:username', renderMode: RenderMode.Server },
  { path: 'notifications', renderMode: RenderMode.Server },
  { path: 'notifications/all', renderMode: RenderMode.Server },
  { path: 'notifications/comments', renderMode: RenderMode.Server },
  { path: 'notifications/friends', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
