import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NivelRiscoApi,
  RiscoApi,
  RiscoApiService,
  RiscoRequestApi,
  SituacaoRiscoApi,
} from '../../services/risco-api.service';

type NivelRiscoUi = 'Alto' | 'Médio' | 'Baixo';
type SituacaoRiscoUi = 'Ativo' | 'Inativo';

interface Risco {
  id: number;
  setor: string;
  risco: string;
  nivel: NivelRiscoUi;
  situacao: SituacaoRiscoUi;
  icone: string;
}

interface FormularioRisco {
  setor: string;
  risco: string;
  nivel: NivelRiscoUi;
  situacao: SituacaoRiscoUi;
  icone: string;
}

const nivelParaApi: Record<NivelRiscoUi, NivelRiscoApi> = {
  Alto: 'ALTO',
  'Médio': 'MEDIO',
  Baixo: 'BAIXO',
};

const nivelDaApi: Record<NivelRiscoApi, NivelRiscoUi> = {
  ALTO: 'Alto',
  MEDIO: 'Médio',
  BAIXO: 'Baixo',
};

const situacaoParaApi: Record<SituacaoRiscoUi, SituacaoRiscoApi> = {
  Ativo: 'ATIVO',
  Inativo: 'INATIVO',
};

const situacaoDaApi: Record<SituacaoRiscoApi, SituacaoRiscoUi> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};

@Component({
  selector: 'app-riscos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './riscos.html',
  styleUrl: './riscos.scss',
})
export class Riscos implements OnInit {
  busca = '';
  nivelFiltro: 'Todos' | NivelRiscoUi = 'Todos';
  situacaoFiltro: 'Todos' | SituacaoRiscoUi = 'Todos';

  readonly niveis = ['Todos', 'Alto', 'Médio', 'Baixo'];
  readonly situacoes = ['Todos', 'Ativo', 'Inativo'];

  riscos: Risco[] = [];
  private todosRiscos: Risco[] = [];
  carregando = true;
  salvando = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formularioAberto = false;
  editandoId: number | null = null;
  riscoVisualizado: Risco | null = null;
  formulario = this.novoFormulario();

  constructor(
    private riscoApi: RiscoApiService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarTodos();
  }

  get totalRiscos(): number {
    return this.todosRiscos.length;
  }

  get totalAltos(): number {
    return this.todosRiscos.filter((risco) => risco.nivel === 'Alto').length;
  }

  get totalMedios(): number {
    return this.todosRiscos.filter((risco) => risco.nivel === 'Médio').length;
  }

  get totalBaixos(): number {
    return this.todosRiscos.filter((risco) => risco.nivel === 'Baixo').length;
  }

  novoRisco(): void {
    this.formulario = this.novoFormulario();
    this.editandoId = null;
    this.riscoVisualizado = null;
    this.formularioAberto = true;
    this.limparMensagens();
  }

  editarRisco(risco: Risco): void {
    this.formulario = {
      setor: risco.setor,
      risco: risco.risco,
      nivel: risco.nivel,
      situacao: risco.situacao,
      icone: risco.icone,
    };
    this.editandoId = risco.id;
    this.riscoVisualizado = null;
    this.formularioAberto = true;
    this.limparMensagens();
  }

  cancelarEdicao(): void {
    this.formularioAberto = false;
    this.editandoId = null;
    this.formulario = this.novoFormulario();
  }

  salvarRisco(): void {
    if (this.salvando) {
      return;
    }

    this.salvando = true;
    this.limparMensagens();
    const dados: RiscoRequestApi = {
      setor: this.formulario.setor.trim(),
      risco: this.formulario.risco.trim(),
      nivel: nivelParaApi[this.formulario.nivel],
      situacao: situacaoParaApi[this.formulario.situacao],
      icone: this.formulario.icone.trim() || null,
    };
    const requisicao = this.editandoId === null
      ? this.riscoApi.criar(dados)
      : this.riscoApi.atualizar(this.editandoId, dados);

    requisicao.subscribe({
      next: (resposta) => {
        const risco = this.adaptar(resposta);
        this.atualizarResumo(risco);
        this.formularioAberto = false;
        this.editandoId = null;
        this.salvando = false;
        this.filtrar();
        this.mensagemSucesso = 'Risco salvo com sucesso.';
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro = this.mensagemDaApi(erro, 'Não foi possível salvar o risco');
        this.salvando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  verRisco(risco: Risco): void {
    this.riscoVisualizado = risco;
    this.formularioAberto = false;
  }

  alternarSituacao(risco: Risco): void {
    const dados: RiscoRequestApi = {
      setor: risco.setor,
      risco: risco.risco,
      nivel: nivelParaApi[risco.nivel],
      situacao: risco.situacao === 'Ativo' ? 'INATIVO' : 'ATIVO',
      icone: risco.icone || null,
    };
    this.limparMensagens();
    this.riscoApi.atualizar(risco.id, dados).subscribe({
      next: (resposta) => {
        this.atualizarResumo(this.adaptar(resposta));
        this.filtrar();
        this.mensagemSucesso = `Risco ${resposta.situacao === 'ATIVO' ? 'ativado' : 'desativado'} com sucesso.`;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro = this.mensagemDaApi(erro, 'Não foi possível alterar a situação do risco');
        this.changeDetector.markForCheck();
      },
    });
  }

  filtrar(): void {
    this.limparMensagens();
    this.carregando = true;
    this.riscoApi.listar({
      busca: this.busca.trim() || undefined,
      nivel: this.nivelFiltro === 'Todos' ? undefined : nivelParaApi[this.nivelFiltro],
      situacao: this.situacaoFiltro === 'Todos'
        ? undefined
        : situacaoParaApi[this.situacaoFiltro],
    }).subscribe({
      next: (riscos) => {
        this.riscos = riscos.map((risco) => this.adaptar(risco));
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro = this.mensagemDaApi(erro, 'Não foi possível carregar os riscos');
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  limpar(): void {
    this.busca = '';
    this.nivelFiltro = 'Todos';
    this.situacaoFiltro = 'Todos';
    this.filtrar();
  }

  private carregarTodos(): void {
    this.carregando = true;
    this.riscoApi.listar().subscribe({
      next: (riscos) => {
        this.todosRiscos = riscos.map((risco) => this.adaptar(risco));
        this.riscos = [...this.todosRiscos];
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro = this.mensagemDaApi(erro, 'Não foi possível carregar os riscos');
        this.carregando = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private adaptar(risco: RiscoApi): Risco {
    return {
      id: risco.id,
      setor: risco.setor,
      risco: risco.risco,
      nivel: nivelDaApi[risco.nivel],
      situacao: situacaoDaApi[risco.situacao],
      icone: risco.icone || 'bi-exclamation-triangle',
    };
  }

  private atualizarResumo(risco: Risco): void {
    const indice = this.todosRiscos.findIndex((item) => item.id === risco.id);
    if (indice === -1) {
      this.todosRiscos = [...this.todosRiscos, risco];
      return;
    }
    this.todosRiscos = this.todosRiscos.map((item) => item.id === risco.id ? risco : item);
  }

  private novoFormulario(): FormularioRisco {
    return {
      setor: '',
      risco: '',
      nivel: 'Médio',
      situacao: 'Ativo',
      icone: 'bi-exclamation-triangle',
    };
  }

  private limparMensagens(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  private mensagemDaApi(erro: HttpErrorResponse, contexto: string): string {
    if (erro.status === 0) {
      return `${contexto}: API indisponível em http://localhost:8080.`;
    }
    if (erro.status === 401) {
      return `${contexto}: sessão expirada. Entre novamente.`;
    }
    if (erro.status === 403) {
      return `${contexto}: somente administradores podem gerenciar riscos.`;
    }
    return `${contexto} (HTTP ${erro.status}).`;
  }
}
