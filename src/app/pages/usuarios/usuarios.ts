import { AuthService, Perfil } from '../../services/auth.service';
import { UsuarioApi, UsuarioApiService } from '../../services/usuario-api.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

interface RiscoUsuario {
  setor: string;
  risco: string;
  nivel: 'Baixo' | 'Médio' | 'Alto';
  situacao: 'Ativo' | 'Inativo';
  validade: string;
  validadeValida: boolean;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: Perfil;
  ativo: boolean;
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
  subNavAtiva: 'lista' | 'cadastro' = 'lista';

  usuarios: Usuario[] = [];

  usuariosFiltrados: Usuario[] = [];

  usuarioVisualizado: Usuario | null = null;
  usuarioSelecionado: Usuario | null = null;
  novoUsuario: CadastroUsuario = this.novoUsuarioVazio();

  constructor(
    public authService: AuthService,
    private usuarioApiService: UsuarioApiService,
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
        riscos: [],
      }));
      this.buscarUsuario();
    };

    if (this.authService.isAdmin()) {
      this.usuarioApiService.listar().subscribe({
        next: carregar,
        error: (erro: HttpErrorResponse) => {
          this.mensagem = `Não foi possível carregar usuários (HTTP ${erro.status}).`;
        },
      });
      return;
    }

    this.usuarioApiService.obterUsuarioAtual().subscribe({
      next: (usuario) => carregar([usuario]),
      error: (erro: HttpErrorResponse) => {
        this.mensagem = `Não foi possível carregar seu usuário (HTTP ${erro.status}).`;
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

    this.usuarioVisualizado = usuario;
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
    this.subNavAtiva = 'cadastro';
  }

  mostrarUsuarios(): void {
    this.mensagem = '';
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
}