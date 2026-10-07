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
        this.mostrarMensagemFlutuante(
          erro.status === 0 ? 'API indisponível' : 'Falha no login',
          erro.status === 0
            ? 'Não foi possível conectar ao servidor de autenticação.'
            : 'Confira seu e-mail e senha cadastrados no sistema.',
        );
      },
    });
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
