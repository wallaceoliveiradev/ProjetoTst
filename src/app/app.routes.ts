import { Routes } from '@angular/router';
import { Layout } from './pages/layout/layout';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin-guard';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

const colaboradorGuard = () => inject(AuthService).isColaborador()
  ? true
  : inject(Router).createUrlTree(['/sistema']);

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
        loadComponent: () => inject(AuthService).isColaborador()
          ? import('./colaborador/dashboard-colaborador/dashboard-colaborador').then((module) => module.DashboardColaborador)
          : import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
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
        loadComponent: () => inject(AuthService).isColaborador()
          ? import('./colaborador/meus-epis/meus-epis').then((module) => module.MeusEpis)
          : import('./pages/epis/epis').then((module) => module.Epis),
      },
      {
        path: 'meus-epis',
        canActivate: [colaboradorGuard],
        loadComponent: () => import('./colaborador/meus-epis/meus-epis').then((module) => module.MeusEpis),
      },
      {
        path: 'suporte',
        canActivate: [colaboradorGuard],
        loadComponent: () => import('./colaborador/suporte/suporte').then((module) => module.Suporte),
      },
      {
        path: 'epis-admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/epis/epis').then((module) => module.Epis),
      },
      {
        path: 'riscos',
        loadComponent: () => inject(AuthService).isColaborador()
          ? import('./colaborador/riscos/riscos-colaborador').then((module) => module.RiscosColaborador)
          : import('./pages/riscos/riscos').then((module) => module.Riscos),
      },
      {
        path: 'relatorios',
        canActivate: [adminGuard],
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
