import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardApiService, DashboardResponse } from '../../services/dashboard-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  activeSearch: string | null = null;
  readonly dados = signal<DashboardResponse | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal('');

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService,
    private dashboardApi: DashboardApiService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.activeSearch = params.get('search');
    });
    if (this.authService.isAdmin()) {
      this.carregar();
    }
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.dashboardApi.obter().subscribe({
      next: (resposta) => {
        this.dados.set(resposta);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.dados.set(null);
        this.erro.set(
          erro.status === 0
            ? 'Não foi possível conectar à API. Verifique se o servidor está disponível.'
            : `Não foi possível carregar os indicadores (HTTP ${erro.status}).`,
        );
        this.carregando.set(false);
      },
    });
  }

  isCardActive(term: string): boolean {
    return !!this.activeSearch && this.activeSearch.toLowerCase().includes(term.toLowerCase());
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }
}
