import { Routes } from '@angular/router';
import { Layout } from './pages/layout/layout';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: 'sistema',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'usuarios',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/usuarios/usuarios').then((module) => module.UsuariosComponent),
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil/perfil').then((module) => module.Perfil),
      },
      {
        path: 'treinamentos',
        loadComponent: () =>
          import('./pages/treinamentos/treinamentos').then((module) => module.Treinamentos),
      },
      {
        path: 'epis',
        loadComponent: () =>
          import('./pages/epis/epis').then((module) => module.Epis),
      },
      {
        path: 'riscos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/riscos/riscos').then((module) => module.Riscos),
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./pages/relatorios/relatorios').then((module) => module.Relatorios),
      },
      {
        path: 'topbar',
        loadComponent: () =>
          import('./pages/topbar/topbar').then((module) => module.Topbar),
      },
      {
        path: 'checklist',
        loadComponent: () =>
          import('./pages/checklist/checklist').then((module) => module.Checklist),
      },
      {
        path: 'footer',
        loadComponent: () =>
          import('./pages/footer/footer').then((module) => module.Footer),
      },
    ],
  },
];