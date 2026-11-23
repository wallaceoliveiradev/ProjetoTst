import { AuthService, Perfil } from '../../services/auth.service';
import { UsuarioApi, UsuarioApiService } from '../../services/usuario-api.service';
import {
  NivelRiscoApi,
  RiscoApi,
  RiscoApiService,
  RiscoUsuarioApi,
  RiscoUsuarioRequestApi,
} from '../../services/risco-api.service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

interface RiscoUsuario {
  riscoId: number;
  setor: string;
  risco: string;
  nivel: 'Baixo' | 'Médio' | 'Alto';
  situacao: 'Ativo' | 'Inativo';
  validade: string;
  validadeValida: boolean;
  validado: boolean;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: Perfil;
  ativo: boolean;
  dataCadastro: string | null;
  riscos: RiscoUsuario[];
}

interface CadastroUsuario {
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  perfil: Perfil;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuariosComponent implements OnInit {

  termoBusca = '';
  mensagem = '';
  subNavAtiva: 'lista' | 'cadastro' | 'riscos' = 'lista';

  usuarios: Usuario[] = [];

  get usuariosElegiveisParaRiscos(): Usuario[] {
    return this.usuarios.filter((usuario) => usuario.perfil !== 'admin');
  }

  usuariosFiltrados: Usuario[] = [];

  usuarioVisualizado: Usuario | null = null;
  usuarioGestaoRisco: Usuario | null = null;
  riscosEmEdicao: RiscoUsuario[] = [];
  riscosOriginais: RiscoUsuario[] = [];
  usuarioSelecionado: Usuario | null = null;
  novoUsuario: CadastroUsuario = this.novoUsuarioVazio();
  riscosDisponiveis: RiscoApi[] = [];
  riscosCarregando = false;
  salvandoRiscos = false;
  riscosMensagem = '';
  riscoSelecionadoId: number | null = null;
  novaValidade = '';
  readonly hoje = this.dataHojeLocal();

  constructor(
    public authService: AuthService,
    private usuarioApiService: UsuarioApiService,
    private riscosApi: RiscoApiService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (!usuarioLogado) {
      this.usuariosFiltrados = [];
      return;
    }

    const carregar = (usuarios: UsuarioApi[]) => {
      this.usuarios = usuarios.map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo ?? '',
        perfil: usuario.perfil,
        ativo: usuario.status === 'ATIVO',
        dataCadastro: usuario.dataCadastro ?? usuario.dataAdmissao ?? usuario.dataCriacao ?? usuario.criadoEm ?? usuario.createdAt ?? null,
        riscos: [],
      }));
      this.buscarUsuario();
      this.changeDetector.markForCheck();
    };

    if (this.authService.isAdmin()) {
      this.usuarioApiService.listar().subscribe({
        next: carregar,
        error: (erro: HttpErrorResponse) => {
          this.mensagem = `Não foi possível carregar usuários (HTTP ${erro.status}).`;
          this.changeDetector.markForCheck();
        },
      });
      return;
    }

    this.usuarioApiService.obterUsuarioAtual().subscribe({
      next: (usuario) => carregar([usuario]),
      error: (erro: HttpErrorResponse) => {
        this.mensagem = `Não foi possível carregar seu usuário (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  buscarUsuario(): void {

    const termo = this.termoBusca.trim().toLowerCase();

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      this.usuariosFiltrados = [];
      return;
    }

    let usuariosPermitidos: Usuario[];

    if (usuarioLogado.role === 'admin') {
      usuariosPermitidos = this.usuarios;
    } else {
      
      usuariosPermitidos = this.usuarios.filter(
        usuario => usuario.nome === usuarioLogado.nome
      );
    }

    if (!termo) {
      this.usuariosFiltrados = [...usuariosPermitidos];
      return;
    }

    this.usuariosFiltrados = usuariosPermitidos.filter(usuario =>
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.cargo.toLowerCase().includes(termo) ||
      usuario.perfil.toLowerCase().includes(termo)
    );
  }

  visualizarUsuario(usuario: Usuario): void {

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      return;
    }

   
    if (
      usuarioLogado.role === 'colaborador' &&
      usuario.nome !== usuarioLogado.nome
    ) {
      alert('Você não tem permissão para visualizar este usuário.');
      return;
    }

    this.usuarioSelecionado = null;
    this.usuarioGestaoRisco = null;
    this.usuarioVisualizado = { ...usuario, riscos: [] };
    this.riscosMensagem = '';
    this.riscosCarregando = true;

    if (usuario.perfil === 'admin') {
      this.riscosCarregando = false;
      return;
    }

    const requisicao = this.authService.isAdmin()
      ? this.riscosApi.listarAssociacoes(usuario.id)
      : this.riscosApi.listarMinhasAssociacoes();
    requisicao.subscribe({
      next: (riscos) => {
        if (this.usuarioVisualizado?.id === usuario.id) {
          this.usuarioVisualizado.riscos = riscos.map((risco) => this.adaptarRiscoUsuario(risco));
        }
        this.riscosCarregando = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.riscosMensagem = erro.status === 0
          ? 'Não foi possível conectar à API de riscos.'
          : `Não foi possível carregar os riscos associados (HTTP ${erro.status}).`;
        this.riscosCarregando = false;
        this.changeDetector.markForCheck();
      },
    });

  }

  abrirGestaoRiscoUsuario(usuario: Usuario | null = null): void {
    if (!this.authService.isAdmin()) return;
    if (usuario?.perfil === 'admin') {
      this.riscosMensagem = 'Não é possível associar riscos a um perfil administrador.';
      return;
    }
    this.usuarioVisualizado = null;
    this.usuarioSelecionado = null;
    this.subNavAtiva = 'riscos';
    this.usuarioGestaoRisco = null;
    this.riscosEmEdicao = [];
    this.riscosOriginais = [];
    this.riscosMensagem = '';
    this.riscosApi.listar({ situacao: 'ATIVO' }).subscribe({
      next: (riscos) => {
        this.riscosDisponiveis = riscos.filter((risco) => risco.situacao === 'ATIVO');
        if (usuario) this.selecionarUsuarioParaRiscos(usuario);
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.riscosMensagem = erro.status === 0
          ? 'Não foi possível conectar à API para carregar riscos ativos.'
          : `Não foi possível carregar riscos ativos (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  selecionarUsuarioParaRiscos(usuario: Usuario | null): void {
    if (usuario?.perfil === 'admin') {
      this.usuarioGestaoRisco = null;
      this.riscosEmEdicao = [];
      this.riscosOriginais = [];
      this.riscosMensagem = 'Não é possível associar riscos a um perfil administrador.';
      return;
    }
    this.usuarioGestaoRisco = usuario;
    this.riscosEmEdicao = [];
    this.riscosOriginais = [];
    this.riscoSelecionadoId = null;
    this.novaValidade = '';
    this.riscosMensagem = '';
    if (!usuario) return;
    this.riscosCarregando = true;
    this.riscosApi.listarAssociacoes(usuario.id).subscribe({
      next: (riscos) => {
        if (this.usuarioGestaoRisco?.id !== usuario.id) return;
        this.riscosOriginais = riscos.map((risco) => this.adaptarRiscoUsuario(risco));
        this.riscosEmEdicao = this.riscosOriginais.map((risco) => ({ ...risco }));
        this.riscosCarregando = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.riscosCarregando = false;
        this.riscosMensagem = erro.status === 0
          ? 'Não foi possível conectar à API para carregar as associações.'
          : `Não foi possível carregar as associações (HTTP ${erro.status}).`;
        this.changeDetector.markForCheck();
      },
    });
  }

  adicionarRiscoAoUsuario(): void {
    if (!this.usuarioGestaoRisco || !this.authService.isAdmin()) {
      return;
    }
    if (this.riscoSelecionadoId === null || !this.novaValidade || this.novaValidade < this.hoje) {
      this.riscosMensagem = 'Selecione um risco ativo e informe uma validade válida.';
      return;
    }
    if (this.riscosEmEdicao.some((risco) => risco.riscoId === this.riscoSelecionadoId)) {
      this.riscosMensagem = 'Este risco já está associado a este usuário.';
      return;
    }

    const risco = this.riscosDisponiveis.find((item) => item.id === this.riscoSelecionadoId);
    if (!risco || risco.situacao !== 'ATIVO') {
      this.riscosMensagem = 'Selecione um risco ativo disponível.';
      return;
    }

    this.riscosEmEdicao.push({
      riscoId: risco.id,
      setor: risco.setor,
      risco: risco.risco,
      nivel: this.nivelRiscoLegivel(risco.nivel),
      situacao: 'Ativo',
      validade: this.novaValidade,
      validadeValida: this.novaValidade >= new Date().toISOString().slice(0, 10),
      validado: false,
    });
    this.riscoSelecionadoId = null;
    this.novaValidade = '';
    this.riscosMensagem = 'Risco adicionado à lista. Salve as associações para confirmar.';
    this.changeDetector.markForCheck();
  }

  removerRiscoDoUsuario(riscoId: number): void {
    if (!this.usuarioGestaoRisco || !this.authService.isAdmin()) {
      return;
    }
    this.riscosEmEdicao = this.riscosEmEdicao
      .filter((risco) => risco.riscoId !== riscoId);
    this.riscosMensagem = 'Associação removida da lista. Salve para confirmar.';
    this.changeDetector.markForCheck();
  }

  salvarAssociacoesRisco(): void {
    if (!this.usuarioGestaoRisco || !this.authService.isAdmin() || this.salvandoRiscos) {
      return;
    }

    if (this.riscosEmEdicao.some((risco) => !risco.validade)) {
      this.riscosMensagem = 'Informe a validade de todas as associações.';
      return;
    }

    const associacoes: RiscoUsuarioRequestApi[] = this.riscosEmEdicao.map((risco) => ({
      riscoId: risco.riscoId,
      validade: risco.validade,
      validado: risco.validado,
    }));
    this.salvandoRiscos = true;
    this.riscosApi.substituirAssociacoes(this.usuarioGestaoRisco.id, associacoes).subscribe({
      next: (riscos) => {
        this.riscosOriginais = riscos.map((risco) => this.adaptarRiscoUsuario(risco));
        this.riscosEmEdicao = this.riscosOriginais.map((risco) => ({ ...risco }));
        this.riscosMensagem = 'Associações de riscos salvas com sucesso.';
        this.salvandoRiscos = false;
        this.changeDetector.markForCheck();
      },
      error: (erro: HttpErrorResponse) => {
        this.riscosMensagem = erro.status === 0
          ? 'Não foi possível conectar à API para salvar as associações.'
          : `Não foi possível salvar as associações (HTTP ${erro.status}).`;
        this.salvandoRiscos = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  cancelarAssociacoesRisco(): void {
    this.riscosEmEdicao = this.riscosOriginais.map((risco) => ({ ...risco }));
    this.riscoSelecionadoId = null;
    this.novaValidade = '';
    this.riscosMensagem = '';
  }

  editarUsuario(usuario: Usuario): void {

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      return;
    }

    // ADM pode editar qualquer usuário
    // Colaborador só pode editar a si mesmo
    const podeEditar =
      usuarioLogado.role === 'admin' ||
      usuario.nome === usuarioLogado.nome;

    if (!podeEditar) {
      alert('Você não tem permissão para editar este usuário.');
      return;
    }

    this.usuarioVisualizado = null;
    this.usuarioSelecionado = { ...usuario };
    this.mensagem = '';
  }

  salvarEdicao(): void {

    if (!this.usuarioSelecionado) {
      return;
    }

    const index = this.usuarios.findIndex(
      usuario => usuario.id === this.usuarioSelecionado!.id
    );

    if (index !== -1) {
      this.usuarios[index] = { ...this.usuarioSelecionado };
    }

    this.buscarUsuario();

    this.mensagem = 'Usuário atualizado com sucesso!';
    this.usuarioSelecionado = null;
  }

  cancelarEdicao(): void {
    this.usuarioSelecionado = null;
    this.mensagem = 'Edição cancelada.';
  }

  abrirCadastro(): void {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.mensagem = '';
    this.usuarioVisualizado = null;
    this.usuarioSelecionado = null;
    this.subNavAtiva = 'cadastro';
  }

  mostrarUsuarios(): void {
    this.mensagem = '';
    this.usuarioVisualizado = null;
    this.usuarioSelecionado = null;
    this.usuarioGestaoRisco = null;
    this.subNavAtiva = 'lista';
  }

  cadastrarUsuario(formulario: NgForm): void {
    if (!this.authService.isAdmin()) {
      return;
    }

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();
      const problemas: string[] = [];
      const controles = formulario.controls;

      if (controles['nome']?.errors?.['required']) {
        problemas.push('preencha o nome');
      }
      if (controles['email']?.errors?.['required']) {
        problemas.push('preencha o e-mail');
      } else if (controles['email']?.errors?.['email']) {
        problemas.push('informe um e-mail válido, como nome@empresa.com');
      }
      if (controles['cargo']?.errors?.['required']) {
        problemas.push('preencha o cargo');
      }
      if (controles['senha']?.errors?.['required']) {
        problemas.push('preencha a senha');
      } else if (controles['senha']?.errors?.['minlength']) {
        problemas.push('a senha deve ter pelo menos 6 caracteres');
      }

      this.mensagem = problemas.length
        ? `Verifique os campos: ${problemas.join('; ')}.`
        : 'Confira os campos destacados e tente novamente.';
      return;
    }

    this.usuarioApiService.cadastrar({
      ...this.novoUsuario,
      status: 'ATIVO',
    }).subscribe({
      next: () => {
        this.termoBusca = '';
        this.novoUsuario = this.novoUsuarioVazio();
        formulario.resetForm(this.novoUsuario);
        this.subNavAtiva = 'lista';
        this.mensagem = 'Usuário registrado com sucesso.';
        this.carregarUsuarios();
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 401) {
          this.mensagem = 'Sua sessão expirou. Faça login novamente e tente registrar o usuário.';
          return;
        }

        if (erro.status === 403) {
          this.mensagem = 'Sua conta não tem permissão para registrar usuários. Entre com um perfil administrador.';
          return;
        }

        this.mensagem = erro.status === 409
          ? 'Este e-mail já está cadastrado.'
          : `Não foi possível registrar o usuário (HTTP ${erro.status}).`;
      },
    });
  }

  cancelarCadastro(): void {
    this.novoUsuario = this.novoUsuarioVazio();
    this.subNavAtiva = 'lista';
    this.mensagem = '';
  }

  private novoUsuarioVazio(): CadastroUsuario {
    return {
      nome: '',
      email: '',
      senha: '',
      cargo: '',
      perfil: 'colaborador',
    };
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isColaborador(): boolean {
    return this.authService.isColaborador();
  }

  private adaptarRiscoUsuario(risco: RiscoUsuarioApi): RiscoUsuario {
    return {
      riscoId: risco.riscoId,
      setor: risco.setor,
      risco: risco.risco,
      nivel: this.nivelRiscoLegivel(risco.nivel),
      situacao: risco.situacao === 'ATIVO' ? 'Ativo' : 'Inativo',
      validade: risco.validade,
      validadeValida: risco.validadeValida,
      validado: risco.validado,
    };
  }

  private nivelRiscoLegivel(nivel: NivelRiscoApi): RiscoUsuario['nivel'] {
    const niveis: Record<NivelRiscoApi, RiscoUsuario['nivel']> = {
      ALTO: 'Alto',
      MEDIO: 'Médio',
      BAIXO: 'Baixo',
    };
    return niveis[nivel];
  }

  private dataHojeLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
