import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type Perfil = 'admin' | 'colaborador';

export interface LoginApiResponse {
  token: string;
  expiresIn: number;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    cargo: string | null;
    status: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) {}

  loginApi(email: string, senha: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(this.apiUrl, { email, senha }).pipe(
      tap((resposta) => {
        if (typeof window === 'undefined') {
          return;
        }

        localStorage.setItem('accessToken', resposta.token);
        localStorage.setItem(
          'tokenExpiresAt',
          String(Date.now() + resposta.expiresIn * 1000),
        );
        localStorage.setItem('perfil', resposta.usuario.perfil.toLowerCase());
        localStorage.setItem('nomeUsuario', resposta.usuario.nome);
        localStorage.setItem('usuarioLogado', JSON.stringify(resposta.usuario));
        localStorage.removeItem('isLoggedIn');
      }),
    );
  }

  logout(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('perfil');
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('isLoggedIn');
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const token = localStorage.getItem('accessToken');
    const expiresAt = Number(localStorage.getItem('tokenExpiresAt'));
    return Boolean(token && expiresAt > Date.now());
  }

  getPerfil(): Perfil | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const perfil = localStorage.getItem('perfil');
    return perfil === 'admin' || perfil === 'colaborador' ? perfil : null;
  }

  isAdmin(): boolean {
    return this.getPerfil() === 'admin';
  }

  isColaborador(): boolean {
    return this.getPerfil() === 'colaborador';
  }

  getNomeUsuario(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    return localStorage.getItem('nomeUsuario') ?? '';
  }

  getUsuarioLogado(): { nome: string; role: Perfil; email: string } | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioSalvo) as LoginApiResponse['usuario'];
      const perfil = usuario.perfil.toLowerCase();
      if (perfil !== 'admin' && perfil !== 'colaborador') {
        throw new Error(`Perfil de usuário não reconhecido: ${usuario.perfil}`);
      }

      return { nome: usuario.nome, email: usuario.email, role: perfil };
    } catch (erro) {
      console.error('Erro ao ler usuário autenticado:', erro);
      this.logout();
      return null;
    }
  }
}
