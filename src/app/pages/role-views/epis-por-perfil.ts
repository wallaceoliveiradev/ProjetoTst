import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MeusEpis } from '../../colaborador/meus-epis/meus-epis';
import { Epis } from '../epis/epis';

@Component({
  selector: 'app-epis-por-perfil',
  standalone: true,
  imports: [NgComponentOutlet],
  template: '<ng-container *ngComponentOutlet="componente()" />',
})
export class EpisPorPerfil {
  private readonly authService = inject(AuthService);
  readonly componente = computed<Type<unknown>>(() =>
    this.authService.isColaborador() ? MeusEpis : Epis,
  );
}
