import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { FormsModule, NgForm } from '@angular/forms';
import {
  HistoricoTreinamento,
  ParametroTreinamento,
  RegistroConclusaoTreinamento,
  StatusHistoricoTreinamento,
  Treinamento,
} from './treinamento.model';
import { TreinamentoService, TreinamentoRequest } from '../../services/Treinamento.service';
import { AuthService } from '../../services/auth.service';
import { UsuarioApi, UsuarioApiService } from '../../services/usuario-api.service';

type AbaTreinamentos = 'cadastrados' | 'novo' | 'certificados' | 'reciclagens' | 'validades';

@Component({
  selector: 'app-treinamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treinamentos.html',
  styleUrl: './treinamentos.scss',
})
export class Treinamentos implements OnDestroy, OnInit {
  constructor(
    public authService: AuthService,
    private treinamentoService: TreinamentoService,
    private usuarioApiService: UsuarioApiService,
  ) {}

  abaAtiva: AbaTreinamentos = 'cadastrados';
  salvando = false;
  treinamentoEditando: Treinamento | null = null;
  mensagemErro: string | null = null;
  mensagemSucesso: string | null = null;
  colaboradores = signal<UsuarioApi[]>([]);
  treinamentos = signal<Treinamento[]>([]);
  historico = signal<HistoricoTreinamento[]>([]);
  parametros = signal<ParametroTreinamento[]>([]);
  arquivoCertificado: File | null = null;
  cicloParaInvalidarId: number | null = null;
  motivoInvalidacao = '';
  parametroEditandoId: number | null = null;
  private atualizacaoHistorico?: Subscription;

  novoTreinamento: Treinamento = this.criarTreinamentoVazio();
  conclusao: RegistroConclusaoTreinamento = this.conclusaoVazia();
  parametroForm = {
    treinamentoId: 0,
    cargo: '',
    validadeMeses: 12,
    diasAntecedenciaAlerta: 60,
  };

  get colaboradoresAtivos(): UsuarioApi[] {
    return this.colaboradores().filter((usuario) => usuario.status === 'ATIVO');
  }

  get registrosEmReciclagem(): HistoricoTreinamento[] {
    return this.historico().filter(
      registro =>
        registro.status === 'ALERTA' ||
        registro.status === 'VENCIDO' ||
        registro.status === 'INVALIDADO',
    );
  }

  ngOnInit(): void {
    this.carregarTreinamentos();
    this.carregarHistorico();
    this.carregarParametros();
    if (this.authService.isAdmin()) {
      this.carregarColaboradores();
    }
    this.atualizacaoHistorico = interval(5 * 60 * 1000).subscribe(() => this.carregarHistorico());
  }

  ngOnDestroy(): void {
    this.atualizacaoHistorico?.unsubscribe();
  }

  selecionarAba(aba: AbaTreinamentos): void {
    if (aba === 'novo' && !this.authService.isAdmin()) {
      return;
    }
    this.abaAtiva = aba;
    this.mensagemErro = null;
    this.mensagemSucesso = null;
    if (aba === 'novo' && !this.treinamentoEditando) {
      this.novoTreinamento = this.criarTreinamentoVazio();
    }
  }

  abrirFormulario(): void {
    if (!this.authService.isAdmin()) {
      return;
    }
    this.treinamentoEditando = null;
    this.novoTreinamento = this.criarTreinamentoVazio();
    this.selecionarAba('novo');
    if (this.colaboradores().length === 0) {
      this.carregarColaboradores();
    }
  }

  fecharFormulario(): void {
    this.treinamentoEditando = null;
    this.novoTreinamento = this.criarTreinamentoVazio();
    this.selecionarAba('cadastrados');
  }

  salvarTreinamento(formulario: NgForm): void {
    if (!this.authService.isAdmin() || this.salvando) {
      return;
    }
    if (
      formulario.invalid ||
      this.novoTreinamento.validade < 1 ||
      this.novoTreinamento.cargaHoraria < 1 ||
      this.novoTreinamento.participantes < 0
    ) {
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

  criarTreinamento(): void {
    if (!this.authService.isAdmin()) {
      return;
    }
    this.salvando = true;
    this.limparMensagens();
    this.treinamentoService.criar(this.obterDadosTreinamento()).subscribe({
      next: (treinamento) => {
        this.treinamentos.update((treinamentos) => [...treinamentos, treinamento]);
        this.mensagemSucesso = 'Treinamento salvo com sucesso.';
        this.salvando = false;
        this.fecharFormulario();
        this.mensagemSucesso = 'Treinamento salvo com sucesso.';
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'salvar o treinamento'),
    });
  }

  atualizarTreinamento(): void {
    const treinamento = this.treinamentoEditando;
    if (!this.authService.isAdmin() || !treinamento) {
      return;
    }
    this.salvando = true;
    this.limparMensagens();
    this.treinamentoService.atualizar(treinamento.id, this.obterDadosTreinamento()).subscribe({
      next: (atualizado) => {
        this.treinamentos.update((lista) =>
          lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
        );
        this.fecharFormulario();
        this.mensagemSucesso = 'Treinamento atualizado com sucesso.';
        this.salvando = false;
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'atualizar o treinamento'),
    });
  }

  editarTreinamento(treinamento: Treinamento): void {
    if (!this.authService.isAdmin()) {
      return;
    }
    this.treinamentoEditando = treinamento;
    this.novoTreinamento = { ...treinamento, usuarioIds: [...(treinamento.usuarioIds ?? [])] };
    this.abaAtiva = 'novo';
    if (this.colaboradores().length === 0) {
      this.carregarColaboradores();
    }
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

  sugerirValidadeNorma(): void {
    if (this.novoTreinamento.validade > 0) {
      return;
    }
    const norma = this.novoTreinamento.norma.replace(/\s/g, '').toUpperCase();
    if (norma === 'NR-10' || norma === 'NR10' || norma === 'NR-35' || norma === 'NR35') {
      this.novoTreinamento.validade = 24;
    } else if (norma === 'NR-33' || norma === 'NR33') {
      this.novoTreinamento.validade = 12;
    }
  }

  colaboradorDoId(id: number): string {
    return this.colaboradores().find((usuario) => usuario.id === id)?.nome ?? `Colaborador #${id}`;
  }

  selecionarTreinamentoDaConclusao(id: number): void {
    const treinamento = this.treinamentos().find((item) => item.id === Number(id));
    if (treinamento) {
      this.conclusao.cargaHoraria = treinamento.cargaHoraria;
      this.conclusao.conteudoProgramatico = treinamento.descricao;
    }
  }

  selecionarCertificado(evento: Event): void {
    const elemento = evento.currentTarget;
    if (!(elemento instanceof HTMLInputElement)) {
      return;
    }
    this.arquivoCertificado = elemento.files?.[0] ?? null;
  }

  registrarConclusao(formulario: NgForm): void {
    if (!this.authService.isAdmin() || this.salvando) {
      return;
    }
    if (
      !this.arquivoCertificado ||
      formulario.invalid ||
      this.conclusao.treinamentoId <= 0 ||
      this.conclusao.usuarioId <= 0 ||
      this.conclusao.cargaHoraria < 1
    ) {
      formulario.control.markAllAsTouched();
      this.mensagemErro = this.arquivoCertificado
        ? 'Preencha todos os dados obrigatórios da conclusão.'
        : 'Anexe o certificado em PDF ou imagem para registrar a conclusão.';
      return;
    }
    this.salvando = true;
    this.limparMensagens();
    this.treinamentoService.registrarConclusao(this.conclusao, this.arquivoCertificado).subscribe({
      next: () => {
        this.salvando = false;
        this.conclusao = this.conclusaoVazia();
        this.arquivoCertificado = null;
        if (typeof document !== 'undefined') {
          const seletor = document.getElementById('certificado');
          if (seletor instanceof HTMLInputElement) {
            seletor.value = '';
          }
        }
        formulario.resetForm(this.conclusao);
        this.carregarHistorico();
        this.mensagemSucesso = 'Conclusão registrada. O vencimento foi calculado e o ciclo anterior preservado.';
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'registrar a conclusão'),
    });
  }

  iniciarRenovacao(registro: HistoricoTreinamento): void {
    this.conclusao = {
      treinamentoId: registro.treinamentoId,
      usuarioId: registro.usuarioId,
      dataConclusao: new Date().toISOString().slice(0, 10),
      cargaHoraria: this.treinamentos().find((item) => item.id === registro.treinamentoId)?.cargaHoraria
        ?? registro.cargaHoraria,
      instrutor: '',
      conteudoProgramatico: this.treinamentos().find((item) => item.id === registro.treinamentoId)?.descricao
        ?? registro.conteudoProgramatico,
    };
    this.arquivoCertificado = null;
    this.selecionarAba('certificados');
  }

  iniciarInvalidacao(id: number): void {
    this.cicloParaInvalidarId = id;
    this.motivoInvalidacao = '';
    this.limparMensagens();
  }

  cancelarInvalidacao(): void {
    this.cicloParaInvalidarId = null;
    this.motivoInvalidacao = '';
  }

  forcarReciclagem(formulario: NgForm): void {
    if (!this.authService.isAdmin() || this.cicloParaInvalidarId === null || this.salvando) {
      return;
    }
    if (formulario.invalid || !this.motivoInvalidacao.trim()) {
      formulario.control.markAllAsTouched();
      return;
    }
    const id = this.cicloParaInvalidarId;
    const registroInvalidado = this.historico().find((registro) => registro.id === id);
    this.salvando = true;
    this.treinamentoService.invalidarCiclo(id, this.motivoInvalidacao.trim()).subscribe({
      next: () => {
        this.salvando = false;
        this.cancelarInvalidacao();
        this.carregarHistorico();
        if (registroInvalidado) {
          this.iniciarRenovacao(registroInvalidado);
        }
        this.mensagemSucesso = 'Certificado invalidado. Registre a nova conclusão para reiniciar o ciclo.';
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'invalidar o certificado'),
    });
  }

  abrirCertificado(registro: HistoricoTreinamento): void {
    this.treinamentoService.baixarCertificado(registro.id).subscribe({
      next: (arquivo) => {
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');
        link.href = url;
        link.download = registro.certificadoNome;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'baixar o certificado'),
    });
  }

  abrirRegraGeral(treinamento: Treinamento): void {
    this.abaAtiva = 'validades';
    const existente = this.parametros().find(
      (parametro) => parametro.treinamentoId === treinamento.id && !parametro.cargo,
    );
    this.parametroEditandoId = existente?.id ?? null;
    this.parametroForm = {
      treinamentoId: treinamento.id,
      cargo: '',
      validadeMeses: existente?.validadeMeses ?? treinamento.validade,
      diasAntecedenciaAlerta: existente?.diasAntecedenciaAlerta ?? 60,
    };
  }

  novaRegraPorCargo(): void {
    this.parametroEditandoId = null;
    this.parametroForm = {
      treinamentoId: this.treinamentos()[0]?.id ?? 0,
      cargo: '',
      validadeMeses: 12,
      diasAntecedenciaAlerta: 60,
    };
  }

  editarParametro(parametro: ParametroTreinamento): void {
    this.parametroEditandoId = parametro.id;
    this.parametroForm = {
      treinamentoId: parametro.treinamentoId,
      cargo: parametro.cargo ?? '',
      validadeMeses: parametro.validadeMeses,
      diasAntecedenciaAlerta: parametro.diasAntecedenciaAlerta,
    };
  }

  salvarParametro(formulario: NgForm): void {
    if (!this.authService.isAdmin() || this.salvando) {
      return;
    }
    if (formulario.invalid || this.parametroForm.treinamentoId <= 0) {
      formulario.control.markAllAsTouched();
      this.mensagemErro = 'Selecione um treinamento e informe uma validade e antecedência válidas.';
      return;
    }
    this.salvando = true;
    this.limparMensagens();
    this.treinamentoService.salvarParametro(
      this.parametroForm.treinamentoId,
      {
        cargo: this.parametroForm.cargo.trim() || null,
        validadeMeses: Number(this.parametroForm.validadeMeses),
        diasAntecedenciaAlerta: Number(this.parametroForm.diasAntecedenciaAlerta),
      },
      this.parametroEditandoId ?? undefined,
    ).subscribe({
      next: (parametro) => {
        this.parametros.update((lista) => [
          ...lista.filter((item) => item.id !== parametro.id),
          parametro,
        ]);
        this.parametroEditandoId = parametro.id;
        this.parametroForm = {
          treinamentoId: parametro.treinamentoId,
          cargo: parametro.cargo ?? '',
          validadeMeses: parametro.validadeMeses,
          diasAntecedenciaAlerta: parametro.diasAntecedenciaAlerta,
        };
        this.mensagemSucesso = 'Regra de validade salva.';
        this.salvando = false;
      },
      error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'salvar a regra de validade'),
    });
  }

  excluirParametro(parametro: ParametroTreinamento): void {
    if (
      !this.authService.isAdmin() ||
      typeof window === 'undefined' ||
      !window.confirm(
        `Excluir a regra de ${parametro.norma} para ${parametro.cargo || 'todos os cargos'}? Os certificados já registrados manterão a validade aplicada no histórico.`,
      )
    ) {
      return;
    }

    this.salvando = true;
    this.limparMensagens();
    this.treinamentoService
      .excluirParametro(parametro.treinamentoId, parametro.id)
      .subscribe({
        next: () => {
          this.parametros.update((lista) =>
            lista.filter((item) => item.id !== parametro.id),
          );
          if (this.parametroEditandoId === parametro.id) {
            this.parametroEditandoId = null;
          }
          this.salvando = false;
          this.mensagemSucesso =
            'Regra excluída. Certificados já registrados mantêm a validade aplicada.';
        },
        error: (erro: HttpErrorResponse) => this.finalizarErro(erro, 'excluir a regra de validade'),
      });
  }

  statusLabel(status: StatusHistoricoTreinamento): string {
    const labels: Record<StatusHistoricoTreinamento, string> = {
      VALIDO: 'Válido',
      ALERTA: 'Em alerta / reciclagem',
      VENCIDO: 'Vencido',
      INVALIDADO: 'Invalidado',
      SUBSTITUIDO: 'Ciclo anterior',
    };
    return labels[status];
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '—';
    }
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private carregarTreinamentos(): void {
    this.treinamentoService.listar().subscribe({
      next: (dados) => this.treinamentos.set(dados),
      error: (erro: HttpErrorResponse) => this.definirErro(erro, 'carregar os treinamentos'),
    });
  }

  private carregarHistorico(): void {
    this.treinamentoService.listarHistorico().subscribe({
      next: (dados) => this.historico.set(dados),
      error: (erro: HttpErrorResponse) => this.definirErro(erro, 'carregar certificados e validades'),
    });
  }

  private carregarParametros(): void {
    this.treinamentoService.listarParametros().subscribe({
      next: (dados) => this.parametros.set(dados),
      error: (erro: HttpErrorResponse) => this.definirErro(erro, 'carregar as regras de validade'),
    });
  }

  private carregarColaboradores(): void {
    this.usuarioApiService.listar().subscribe({
      next: (usuarios) =>
        this.colaboradores.set(usuarios.filter((usuario) => usuario.perfil === 'colaborador')),
      error: (erro: HttpErrorResponse) => this.definirErro(erro, 'carregar os colaboradores'),
    });
  }

  private criarTreinamentoVazio(): Treinamento {
    return {
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

  private conclusaoVazia(): RegistroConclusaoTreinamento {
    return {
      treinamentoId: 0,
      usuarioId: 0,
      dataConclusao: new Date().toISOString().slice(0, 10),
      cargaHoraria: 0,
      instrutor: '',
      conteudoProgramatico: '',
    };
  }

  private obterDadosTreinamento(): TreinamentoRequest {
    const { id: _id, ...dados } = this.novoTreinamento;
    return { ...dados, usuarioIds: this.novoTreinamento.usuarioIds ?? [] };
  }

  private finalizarErro(erro: HttpErrorResponse, acao: string): void {
    this.definirErro(erro, acao);
    this.salvando = false;
  }

  private definirErro(erro: HttpErrorResponse, acao: string): void {
    if (erro.status === 401) {
      this.mensagemErro = 'Sua sessão expirou ou é inválida. Entre novamente e tente outra vez.';
    } else if (erro.status === 403) {
      this.mensagemErro = 'Sua conta não tem permissão para executar esta ação.';
    } else if (erro.status === 413) {
      this.mensagemErro = 'O certificado excede o limite de 10 MB.';
    } else if (erro.status === 0) {
      this.mensagemErro = 'Não foi possível conectar à API de treinamentos.';
    } else if (erro.status === 400) {
      this.mensagemErro = erro.error?.detail ?? erro.error?.message
        ?? `A API rejeitou os dados ao ${acao}. Confira os campos e o arquivo anexado.`;
    } else {
      this.mensagemErro = `Não foi possível ${acao} (HTTP ${erro.status}).`;
    }
  }

  private limparMensagens(): void {
    this.mensagemErro = null;
    this.mensagemSucesso = null;
  }
}
