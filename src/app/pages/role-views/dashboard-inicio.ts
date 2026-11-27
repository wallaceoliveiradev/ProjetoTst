import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DashboardColaborador } from '../../colaborador/dashboard-colaborador/dashboard-colaborador';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-dashboard-inicio',
  standalone: true,
  imports: [NgComponentOutlet],
  template: '<ng-container *ngComponentOutlet="componente()" />',
})
export class DashboardInicio {
  private readonly authService = inject(AuthService);
  readonly componente = computed<Type<unknown>>(() =>
    this.authService.isColaborador() ? DashboardColaborador : Dashboard,
  );
}
