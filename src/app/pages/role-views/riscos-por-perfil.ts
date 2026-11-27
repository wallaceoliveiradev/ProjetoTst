import { NgComponentOutlet } from '@angular/common';
import { Component, Type, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RiscosColaborador } from '../../colaborador/riscos/riscos-colaborador';
import { Riscos } from '../riscos/riscos';

@Component({
  selector: 'app-riscos-por-perfil',
  standalone: true,
  imports: [NgComponentOutlet],
  template: '<ng-container *ngComponentOutlet="componente()" />',
})
export class RiscosPorPerfil {
  private readonly authService = inject(AuthService);
  readonly componente = computed<Type<unknown>>(() =>
    this.authService.isColaborador() ? RiscosColaborador : Riscos,
  );
}
