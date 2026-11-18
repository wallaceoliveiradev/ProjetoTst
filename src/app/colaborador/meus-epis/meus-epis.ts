import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EpisApiService, EntregaEpiApi, EpiCatalogoApi } from '../../services/epis-api.service';

@Component({
  selector: 'app-meus-epis',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './meus-epis.html',
  styleUrl: './meus-epis.scss',
})
export class MeusEpis implements OnInit {
  private readonly api = inject(EpisApiService);
  private readonly auth = inject(AuthService);

  aba = 'meus';
  catalogo: EpiCatalogoApi[] = [];
  historico: EntregaEpiApi[] = [];
  carregandoCatalogo = false;
  carregandoEntregas = false;
  erro = '';
  mensagem = '';
  form = { nome: '', quantidade: 1, motivo: '' };

  ngOnInit(): void {
    this.carregarCatalogo();
    this.carregarMinhasEntregas();
  }

  carregarCatalogo(): void {
    this.carregandoCatalogo = true;
    this.api.listarCatalogoColaborador().subscribe({
      next: (epis) => {
        this.catalogo = epis;
        this.carregandoCatalogo = false;
      },
      error: (erro: unknown) => {
        console.error('Não foi possível carregar o catálogo de EPIs.', erro);
        this.erro = 'Não foi possível carregar os EPIs cadastrados no sistema.';
        this.carregandoCatalogo = false;
      },
    });
  }

  carregarMinhasEntregas(): void {
    this.carregandoEntregas = true;
    this.api.listarMinhasEntregas().subscribe({
      next: (entregas) => {
        this.historico = entregas;
        this.carregandoEntregas = false;
      },
      error: (erro: unknown) => {
        console.error('Não foi possível carregar as entregas do colaborador.', erro);
        this.erro = 'Não foi possível carregar seus EPIs recebidos.';
        this.carregandoEntregas = false;
      },
    });
  }

  get meusEpis(): Array<{ nome: string; quantidade: number; validade: string }> {
    const porNome = new Map<string, { nome: string; quantidade: number; validade: string }>();
    for (const entrega of this.historico) {
      for (const item of this.itens(entrega)) {
        const atual = porNome.get(item.nome) ?? {
          nome: item.nome,
          quantidade: 0,
          validade: entrega.dataValidade ?? '',
        };
        atual.quantidade += item.quantidade;
        if (entrega.dataValidade && (!atual.validade || entrega.dataValidade < atual.validade)) {
          atual.validade = entrega.dataValidade;
        }
        porNome.set(item.nome, atual);
      }
    }
    return [...porNome.values()];
  }

  itens(entrega: EntregaEpiApi): Array<{ nome: string; quantidade: number }> {
    return entrega.itens?.length
      ? entrega.itens
      : entrega.epi
        ? [{ nome: entrega.epi, quantidade: entrega.quantidade }]
        : [];
  }

  data(valor: string | null | undefined): string {
    if (!valor) return '—';
    const partes = valor.slice(0, 10).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
  }

  solicitar(): void {
    this.erro = '';
    this.mensagem = '';
    if (
      !this.form.nome ||
      !Number.isInteger(Number(this.form.quantidade)) ||
      Number(this.form.quantidade) < 1 ||
      !this.form.motivo.trim()
    ) {
      this.erro = 'Informe o EPI, uma quantidade válida e o motivo da solicitação.';
      return;
    }
    if (typeof localStorage === 'undefined') {
      this.erro = 'Não foi possível enviar a solicitação.';
      return;
    }
    try {
      const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes-epis') || '[]') as unknown[];
      solicitacoes.push({
        id: Date.now(),
        funcionarioId: this.auth.getUsuarioLogado()?.id ?? null,
        nomeColaborador: this.auth.getUsuarioLogado()?.nome ?? 'Colaborador',
        epi: this.form.nome,
        quantidade: Number(this.form.quantidade),
        motivo: this.form.motivo.trim(),
        data: new Date().toISOString(),
        lida: false,
      });
      localStorage.setItem('solicitacoes-epis', JSON.stringify(solicitacoes));
      this.mensagem = 'Solicitação enviada. O administrador será informado ao acessar este navegador.';
      this.form = { nome: '', quantidade: 1, motivo: '' };
    } catch {
      this.erro = 'Não foi possível registrar a solicitação.';
    }
  }
}
