import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({ selector: 'app-dashboard-colaborador', standalone: true, imports: [RouterLink], templateUrl: './dashboard-colaborador.html', styleUrl: './dashboard-colaborador.scss' })
export class DashboardColaborador { constructor(private auth: AuthService) {} get nome(): string { return this.auth.getUsuarioLogado()?.nome ?? 'colaborador'; } }

