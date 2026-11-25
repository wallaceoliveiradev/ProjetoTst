import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DashboardApiService, DashboardResponse } from '../../services/dashboard-api.service';
import { IndicadorCard } from '../../shared/indicador-card/indicador-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IndicadorCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(DashboardApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(PLATFORM_ID);
  readonly dados = signal<DashboardResponse | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal('');
  readonly busca = signal('');

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.busca.set(params.get('search') ?? ''));
    this.carregar();
  }

  carregar(): void {
    if (!isPlatformBrowser(this.platform) || !this.authService.isAdmin() || this.carregando())
      return;
    this.carregando.set(true);
    this.erro.set('');
    this.dados.set(null);
    this.api
      .obter(30)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (resposta) => this.dados.set(resposta),
        error: (erro: HttpErrorResponse) => {
          this.erro.set(
            erro.status === 401
              ? 'Sua sessão expirou ou foi recusada. Entre novamente para consultar os indicadores.'
              : erro.status === 403
                ? 'Sua conta não tem permissão para consultar estes indicadores.'
                : erro.status === 0
                  ? 'Não foi possível conectar à API. Verifique se o servidor está disponível.'
                  : `Não foi possível carregar os indicadores (HTTP ${erro.status}).`,
          );
        },
      });
  }

  isCardActive(termo: string): boolean {
    return this.busca().toLowerCase().includes(termo.toLowerCase());
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }

  formatarEmissao(data: string): string {
    const instante = new Date(data);
    return Number.isNaN(instante.getTime())
      ? data
      : new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(instante);
  }
}
