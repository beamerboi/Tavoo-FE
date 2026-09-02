import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
    title: 'Sign in · Tavoo',
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/home-redirect').then((m) => m.HomeRedirect),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'WAITER'] },
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard · Tavoo',
  },
  {
    path: 'tables',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'WAITER'] },
    loadComponent: () => import('./features/tables/tables').then((m) => m.Tables),
    title: 'Tables · Tavoo',
  },
  {
    path: 'new-order',
    canActivate: [roleGuard],
    data: { roles: ['WAITER'] },
    loadComponent: () => import('./features/orders/new-order').then((m) => m.NewOrder),
    title: 'New order · Tavoo',
  },
  {
    path: 'menu',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'WAITER'] },
    loadComponent: () => import('./features/menu/menu').then((m) => m.Menu),
    title: 'Menu · Tavoo',
  },
  {
    path: 'orders',
    canActivate: [roleGuard],
    data: { roles: ['WAITER'] },
    loadComponent: () => import('./features/orders/order-lookup').then((m) => m.OrderLookup),
    title: 'Orders · Tavoo',
  },
  {
    path: 'kitchen',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'KITCHEN'] },
    loadComponent: () => import('./features/kitchen/kitchen').then((m) => m.Kitchen),
    title: 'Kitchen · Tavoo',
  },
  {
    path: 'admin/menu',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/menu-management/menu-management').then((m) => m.MenuManagement),
    title: 'Menu management · Tavoo',
  },
  {
    path: 'admin/users',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./features/admin/users').then((m) => m.Users),
    title: 'Staff accounts · Tavoo',
  },
  {
    path: 'forbidden',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/forbidden').then((m) => m.Forbidden),
    title: 'Access denied · Tavoo',
  },
  { path: '**', redirectTo: '' },
];
