import { Component, OnInit, signal } from '@angular/core';
import { Treinamento } from './treinamento.model';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TreinamentoService, TreinamentoRequest } from '../../services/Treinamento.service';
import { AuthService } from '../../services/auth.service';
import { UsuarioApi, UsuarioApiService } from '../../services/usuario-api.service';

@Component({
  selector: 'app-treinamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treinamentos.html',
  styleUrl: './treinamentos.scss',
})
export class Treinamentos implements OnInit {
  constructor(
    public authService: AuthService,
    private treinamentoService: TreinamentoService,
    private usuarioApiService: UsuarioApiService,
  ) {}

  formularioAberto = false;
  abaAtiva: 'cadastrados' | 'formulario' = 'cadastrados';
  salvando = false;
  treinamentoEditando: Treinamento | null = null;
  mensagemErro: string | null = null;
  mensagemSucesso: string | null = null;
  colaboradores = signal<UsuarioApi[]>([]);

  abrirFormulario() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.mensagemSucesso = null;
    this.mensagemErro = null;
    this.formularioAberto = true;
    this.abaAtiva = 'formulario';
    this.carregarColaboradores();
  }

  fecharFormulario() {
    this.formularioAberto = false;
    this.abaAtiva = 'cadastrados';
  }

  salvarTreinamento(formulario: NgForm) {
    if (this.salvando) {
      return;
    }

    if (formulario.invalid || this.novoTreinamento.validade < 1) {
      formulario.control.markAllAsTouched();
      this.mensagemErro = 'Preencha os campos obrigatórios e selecione uma validade.';
      return;
    }

    if (this.treinamentoEditando) {
      this.atualizarTreinamento();
    } else {
      this.criarTreinamento();
    }
  }

  criarTreinamento() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.salvando = true;
    this.treinamentoService.criar(this.obterDadosTreinamento()).subscribe({
      next: (treinamento) => {
        this.treinamentos.update((treinamentos) => [...treinamentos, treinamento]);
        this.mensagemSucesso = 'Treinamento salvo com sucesso.';
        this.salvando = false;
        this.finalizarSalvamento();
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro = this.mensagemDaFalha(erro);
        this.salvando = false;
      },
    });
  }

  atualizarTreinamento() {
    if (!this.authService.isAdmin()) {
      return;
    }

    const treinamentoEditando = this.treinamentoEditando;
    if (!treinamentoEditando) {
      return;
    }

    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.salvando = true;
    this.treinamentoService
      .atualizar(treinamentoEditando.id, this.obterDadosTreinamento())
      .subscribe({
        next: (treinamentoAtualizado) => {
          this.treinamentos.update((treinamentos) =>
            treinamentos.map((treinamento) =>
              treinamento.id === treinamentoAtualizado.id ? treinamentoAtualizado : treinamento,
            ),
          );
          this.mensagemSucesso = 'Treinamento atualizado com sucesso.';
          this.salvando = false;
          this.finalizarSalvamento();
        },
        error: (erro: HttpErrorResponse) => {
          this.mensagemErro = this.mensagemDaFalha(erro);
          this.salvando = false;
        },
      });
  }

  private mensagemDaFalha(erro: HttpErrorResponse): string {
    if (erro.status === 400) {
      return 'A API rejeitou os dados. Confira os campos obrigatórios e tente novamente.';
    }

    if (erro.status === 0) {
      return 'Não foi possível conectar à API de treinamentos.';
    }

    return `Não foi possível salvar o treinamento (HTTP ${erro.status}).`;
  }

  limparFormulario() {
    this.novoTreinamento = {
      id: 0,
      nome: '',
      norma: '',
      descricao: '',
      cargaHoraria: 0,
      validade: 0,
      participantes: 0,
      status: 'Ativo',
      usuarioIds: [],
    };
  }

  private obterDadosTreinamento(): TreinamentoRequest {
    const { id: _id, ...dados } = this.novoTreinamento;
    return {
      ...dados,
      usuarioIds: this.novoTreinamento.usuarioIds ?? [],
    };
  }

  private finalizarSalvamento() {
    this.limparFormulario();
    this.fecharFormulario();
    this.treinamentoEditando = null;
  }

  ngOnInit() {
    this.mensagemErro = null;
    this.treinamentoService.listar().subscribe({
      next: (dados) => {
        this.treinamentos.set(dados);
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 401) {
          this.mensagemErro = 'Sua sessão expirou ou é inválida. Saia e entre novamente para carregar os treinamentos.';
          return;
        }

        if (erro.status === 403) {
          this.mensagemErro = 'Sua conta não tem permissão para consultar os treinamentos.';
          return;
        }

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar à API de treinamentos.';
          return;
        }

        this.mensagemErro = `Não foi possível carregar os treinamentos (HTTP ${erro.status}).`;
      },
    });
  }

  editarTreinamento(treinamento: Treinamento) {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.treinamentoEditando = treinamento;

    this.novoTreinamento = {
      ...treinamento,
      usuarioIds: treinamento.usuarioIds ?? [],
    };

    this.formularioAberto = true;
    this.abaAtiva = 'formulario';
    this.carregarColaboradores();
  }

  mostrarTreinamentosCadastrados() {
    this.formularioAberto = false;
    this.treinamentoEditando = null;
    this.abaAtiva = 'cadastrados';
  }

  alternarColaborador(usuarioId: number, evento: Event): void {
    const elemento = evento.currentTarget;
    if (!(elemento instanceof HTMLInputElement)) {
      return;
    }

    const selecionados = new Set(this.novoTreinamento.usuarioIds ?? []);
    if (elemento.checked) {
      selecionados.add(usuarioId);
    } else {
      selecionados.delete(usuarioId);
    }
    this.novoTreinamento.usuarioIds = [...selecionados];
  }

  private carregarColaboradores(): void {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.usuarioApiService.listar().subscribe({
      next: (usuarios) => {
        this.colaboradores.set(
          usuarios.filter(
            (usuario) => usuario.perfil === 'colaborador' && usuario.status === 'ATIVO',
          ),
        );
      },
      error: (erro: HttpErrorResponse) => {
        this.mensagemErro =
          erro.status === 401 || erro.status === 403
            ? 'Sua sessão não permite carregar os colaboradores.'
            : `Não foi possível carregar os colaboradores (HTTP ${erro.status}).`;
      },
    });
  }

  novoTreinamento: Treinamento = {
    id: 0,
    nome: '',
    norma: '',
    descricao: '',
    cargaHoraria: 0,
    validade: 0,
    participantes: 0,
    status: 'Ativo',
    usuarioIds: [],
  };

  treinamentos = signal<Treinamento[]>([]);
}
