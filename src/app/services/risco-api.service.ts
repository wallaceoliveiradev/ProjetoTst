import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type NivelRiscoApi = 'ALTO' | 'MEDIO' | 'BAIXO';
export type SituacaoRiscoApi = 'ATIVO' | 'INATIVO';

export interface RiscoApi {
  id: number;
  setor: string;
  risco: string;
  nivel: NivelRiscoApi;
  situacao: SituacaoRiscoApi;
  icone: string | null;
}

export type RiscoRequestApi = Omit<RiscoApi, 'id'>;

export interface FiltroRiscoApi {
  busca?: string;
  nivel?: NivelRiscoApi;
  situacao?: SituacaoRiscoApi;
}

export interface RiscoUsuarioApi {
  riscoId: number;
  setor: string;
  risco: string;
  nivel: NivelRiscoApi;
  situacao: SituacaoRiscoApi;
  validade: string;
  validadeValida: boolean;
  validado: boolean;
}

export interface RiscoUsuarioRequestApi {
  riscoId: number;
  validade: string;
  validado: boolean;
}

@Injectable({ providedIn: 'root' })
export class RiscoApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/riscos';
  private readonly usuariosUrl = 'http://localhost:8080/api/usuarios';

  listar(filtro: FiltroRiscoApi = {}): Observable<RiscoApi[]> {
    let params = new HttpParams();
    if (filtro.busca) {
      params = params.set('busca', filtro.busca);
    }
    if (filtro.nivel) {
      params = params.set('nivel', filtro.nivel);
    }
    if (filtro.situacao) {
      params = params.set('situacao', filtro.situacao);
    }

    return this.http.get<RiscoApi[]>(this.url, { params });
  }

  obter(id: number): Observable<RiscoApi> {
    return this.http.get<RiscoApi>(`${this.url}/${id}`);
  }

  criar(dados: RiscoRequestApi): Observable<RiscoApi> {
    return this.http.post<RiscoApi>(this.url, dados);
  }

  atualizar(id: number, dados: RiscoRequestApi): Observable<RiscoApi> {
    return this.http.put<RiscoApi>(`${this.url}/${id}`, dados);
  }

  listarAssociacoes(usuarioId: number): Observable<RiscoUsuarioApi[]> {
    return this.http.get<RiscoUsuarioApi[]>(`${this.usuariosUrl}/${usuarioId}/riscos`);
  }

  listarMinhasAssociacoes(): Observable<RiscoUsuarioApi[]> {
    return this.http.get<RiscoUsuarioApi[]>(`${this.usuariosUrl}/me/riscos`);
  }

  substituirAssociacoes(
    usuarioId: number,
    riscos: RiscoUsuarioRequestApi[],
  ): Observable<RiscoUsuarioApi[]> {
    return this.http.put<RiscoUsuarioApi[]>(`${this.usuariosUrl}/${usuarioId}/riscos`, {
      riscos,
    });
  }
}
