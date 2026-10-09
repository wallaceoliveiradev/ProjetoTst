import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  usuario = '';
  senha = '';
  autenticando = false;

  // Controle da mensagem flutuante
  mensagemFlutuante = '';
  mostrarMensagem = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  fazerLogin(): void {
    if (this.autenticando) {
      return;
    }

    this.autenticando = true;
    this.authService.loginApi(this.usuario.trim(), this.senha).subscribe({
      next: () => {
        this.autenticando = false;
        this.router.navigate(['/sistema']);
      },
      error: (erro: HttpErrorResponse) => {
        this.autenticando = false;
        const mensagem = this.obterMensagemErro(erro);
        this.mostrarMensagemFlutuante(mensagem.titulo, mensagem.texto);
      },
    });
  }

  private obterMensagemErro(erro: HttpErrorResponse): { titulo: string; texto: string } {
    if (erro.status === 0) {
      return {
        titulo: 'API indisponível',
        texto: 'Não foi possível conectar a http://localhost:8080. Confirme que o backend está iniciado e que a origem do frontend está liberada no CORS.',
      };
    }

    if (erro.status === 400) {
      return {
        titulo: 'Dados inválidos',
        texto: 'O backend exige um e-mail válido e uma senha preenchida. Confira os dados e tente novamente.',
      };
    }

    if (erro.status === 401) {
      return {
        titulo: 'Credenciais recusadas',
        texto: 'O backend não autenticou essa conta. Confirme se o e-mail e a senha pertencem ao mesmo banco usado pela API e se o usuário está ATIVO.',
      };
    }

    return {
      titulo: 'Erro no login',
      texto: `O backend respondeu com HTTP ${erro.status}. Confira os logs da API para identificar a causa.`,
    };
  }

  abrirRecuperacao(): void {
    this.mostrarMensagemFlutuante(
      'Recuperação de senha',
      'Solicite a redefinição da senha ao administrador do sistema.',
    );
  }

  mostrarMensagemFlutuante(
    titulo: string,
    mensagem: string
  ): void {

    this.mensagemFlutuante =
      `${titulo}|${mensagem}`;

    this.mostrarMensagem = true;
  }

  fecharMensagem(): void {

    this.mostrarMensagem = false;
    this.mensagemFlutuante = '';
  }

  getTituloMensagem(): string {

    return this.mensagemFlutuante.split('|')[0] || '';
  }

  getTextoMensagem(): string {

    return this.mensagemFlutuante.split('|')[1] || '';
  }
}
