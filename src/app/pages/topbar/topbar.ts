import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // 👈 importe o serviço
import { NotificacaoAdminApiService, NotificacaoBloqueio } from '../../services/notificacao-admin-api.service';

interface SolicitacaoEpi {
  id: number;
  funcionarioId: number | null;
  nomeColaborador: string;
  epi: string;
  quantidade: number;
  motivo: string;
  data?: string;
  lida?: boolean;
}

type NotificacaoItem =
  | { tipo: 'epi'; data: SolicitacaoEpi }
  | { tipo: 'bloqueio'; data: NotificacaoBloqueio };

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit, OnDestroy {
  searchTerm = '';
  bloqueiosPendentes: NotificacaoBloqueio[] = [];
  solicitacoesEpiPendentes: SolicitacaoEpi[] = [];
  notificacoesAbertas = false;
  private notificacoesSubscription?: Subscription;

  get notificacoes(): NotificacaoItem[] {
    return [
      ...this.solicitacoesEpiPendentes.map((data) => ({ tipo: 'epi' as const, data })),
      ...this.bloqueiosPendentes.map((data) => ({ tipo: 'bloqueio' as const, data })),
    ].sort((a, b) => this.dataNotificacao(b) - this.dataNotificacao(a));
  }

  // 👇 aqui você injeta o AuthService junto com o Router
  constructor(
    public authService: AuthService,
    private router: Router,
    private notificacaoApi: NotificacaoAdminApiService,
  ) {}

  ngOnInit(): void {
    if (typeof localStorage === 'undefined' || !this.authService.isAdmin()) return;
    this.notificacoesSubscription = timer(0, 30_000).subscribe(() => this.carregarNotificacoes());
  }

  ngOnDestroy(): void {
    this.notificacoesSubscription?.unsubscribe();
  }

  private carregarNotificacoes(): void {
    this.carregarSolicitacoesEpi();
    this.notificacaoApi.listarBloqueios().subscribe({
      next: (notificacoes) => (this.bloqueiosPendentes = notificacoes.filter((item) => !item.lida)),
      error: () => (this.bloqueiosPendentes = []),
    });
  }

  private carregarSolicitacoesEpi(): void {
    try {
      this.solicitacoesEpiPendentes = (
        JSON.parse(localStorage.getItem('solicitacoes-epis') || '[]') as SolicitacaoEpi[]
      ).filter((item) => !item.lida);
    } catch {
      this.solicitacoesEpiPendentes = [];
    }
  }

  alternarNotificacoes(): void {
    if (!this.authService.isAdmin()) return;
    this.notificacoesAbertas = !this.notificacoesAbertas;
    if (this.notificacoesAbertas) this.carregarNotificacoes();
  }

  fecharNotificacoes(): void {
    this.notificacoesAbertas = false;
  }

  @HostListener('document:click', ['$event'])
  fecharNotificacoesAoClicarFora(event: MouseEvent): void {
    const alvo = event.target;
    if (typeof Element !== 'undefined' && alvo instanceof Element && !alvo.closest('.notification-center')) {
      this.fecharNotificacoes();
    }
  }

  abrirNotificacao(notificacao: NotificacaoItem): void {
    if (!this.authService.isAdmin()) return;
    this.notificacoesAbertas = false;

    if (notificacao.tipo === 'epi') {
      const solicitacao = notificacao.data;
      try {
        const todas = JSON.parse(localStorage.getItem('solicitacoes-epis') || '[]') as SolicitacaoEpi[];
        localStorage.setItem(
          'solicitacoes-epis',
          JSON.stringify(todas.map((item) => item.id === solicitacao.id ? { ...item, lida: true } : item)),
        );
      } catch {
        // Continua para a tela mesmo se o navegador não conseguir atualizar o estado local.
      }
      this.carregarSolicitacoesEpi();
      this.router.navigate(['/sistema/epis-admin'], {
        queryParams: {
          aba: 'entrega',
          funcionarioId: solicitacao.funcionarioId,
          epi: solicitacao.epi,
          quantidade: solicitacao.quantidade,
          motivo: solicitacao.motivo,
          solicitacao: solicitacao.id,
        },
      });
      return;
    }

    const bloqueio = notificacao.data;
    this.notificacaoApi.marcarComoLida(bloqueio.id).subscribe({
      next: () => {
        this.bloqueiosPendentes = this.bloqueiosPendentes.filter((item) => item.id !== bloqueio.id);
        this.router.navigate(['/sistema/usuarios'], { queryParams: { usuarioId: bloqueio.usuarioId } });
      },
      error: () => this.router.navigate(['/sistema/usuarios'], { queryParams: { usuarioId: bloqueio.usuarioId } }),
    });
  }

  formatarDataNotificacao(data: string | undefined): string {
    if (!data) return '';
    const dataValida = new Date(data);
    return Number.isNaN(dataValida.getTime()) ? '' : dataValida.toLocaleString('pt-BR');
  }

  private dataNotificacao(item: NotificacaoItem): number {
    const data = item.tipo === 'epi' ? item.data.data : item.data.criadaEm;
    const timestamp = data ? new Date(data).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  resolveRoute(term: string): { path: string; queryParams?: Record<string, string> } {
    const normalized = term
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) {
      return { path: '/sistema' };
    }

    const routes = [
      { keywords: ['dashboard', 'inicio', 'inicial', 'painel'], path: '/sistema' },
      { keywords: ['treinamentos', 'treinamento'], path: '/sistema/treinamentos' },
      {
        keywords: ['treinamentos vencidos', 'vencidos', 'treinamento vencido'],
        path: '/sistema',
        queryParams: { search: 'treinamentos-vencidos' },
      },
      {
        keywords: ['epis', 'epi', 'equipamento de protecao individual', 'e pi'],
        path: '/sistema/epis',
      },
      {
        keywords: [
          'epis proximos do vencimento',
          'epis proximo do vencimento',
          'proximos do vencimento',
          'vencimento epi',
        ],
        path: '/sistema',
        queryParams: { search: 'epis-proximos' },
      },
      {
        keywords: ['riscos', 'risco', 'riscos criticos', 'risco critico'],
        path: '/sistema/riscos',
      },
      {
        keywords: ['checklist', 'check list', 'lista de seguranca', 'seguranca'],
        path: '/sistema/checklist',
      },
      { keywords: ['relatorios', 'relatorio'], path: '/sistema/relatorios' },
      {
        keywords: ['usuarios', 'usuario', 'funcionarios', 'funcionario'],
        path: '/sistema/usuarios',
      },
    ];

    const match = routes.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword)),
    );

    return match ?? { path: '/sistema' };
  }

  buscar(): void {
    const route = this.resolveRoute(this.searchTerm);
    this.router.navigate([route.path], {
      queryParams: route.queryParams ?? {},
    });
  }

  fecharConta(event: Event): void {
    const target = event.currentTarget;
    if (typeof Element !== 'undefined' && target instanceof Element) {
      const details = target.closest('details');
      details?.removeAttribute('open');
      details?.querySelector('summary')?.focus();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
