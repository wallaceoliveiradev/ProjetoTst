import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Perfil } from './auth.service';

export interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  cargo: string | null;
  status: 'ATIVO' | 'INATIVO';
}

interface UsuarioApiResponse extends Omit<UsuarioApi, 'perfil' | 'status'> {
  perfil: string;
  status: string;
}

export interface UsuarioCadastroApi {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  cargo: string;
  status: 'ATIVO' | 'INATIVO';
}

@Injectable({ providedIn: 'root' })
export class UsuarioApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/usuarios';

  listar(): Observable<UsuarioApi[]> {
    return this.http.get<UsuarioApiResponse[]>(this.url).pipe(
      map((usuarios) => usuarios.map((usuario) => this.adaptar(usuario))),
    );
  }

  obterUsuarioAtual(): Observable<UsuarioApi> {
    return this.http.get<UsuarioApiResponse>(`${this.url}/me`).pipe(
      map((usuario) => this.adaptar(usuario)),
    );
  }

  cadastrar(usuario: UsuarioCadastroApi): Observable<UsuarioApi> {
    return this.http.post<UsuarioApiResponse>(this.url, {
      ...usuario,
      perfil: usuario.perfil.toUpperCase(),
    }).pipe(map((resposta) => this.adaptar(resposta)));
  }

  private adaptar(usuario: UsuarioApiResponse): UsuarioApi {
    const perfil = usuario.perfil.toLowerCase();
    if (perfil !== 'admin' && perfil !== 'colaborador') {
      throw new Error(`Perfil de usuário não reconhecido: ${usuario.perfil}`);
    }

    return {
      ...usuario,
      perfil,
      status: usuario.status.toUpperCase() === 'ATIVO' ? 'ATIVO' : 'INATIVO',
    };
  }
}
