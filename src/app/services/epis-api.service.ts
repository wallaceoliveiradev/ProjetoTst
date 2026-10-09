import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface EpisApiItem {
  id: number;
  nome: string;
  categoria: string;
  dataEntrada: string;
  quantidade: number;
  validade: string;
  ca: string;
}

export interface EntregaEpiApi {
  id: number;
  funcionarioId: number;
  funcionario: string;
  dataEntrega: string;
  observacoes: string | null;
  epi: string;
  quantidade: number;
  dataValidade: string;
  ca: string;
  remessas: Array<{ remessaId: number; quantidade: number; dataValidade: string }>;
  itens: Array<{ nome: string; quantidade: number }>;
}

export interface EntregaEpiRequestApi {
  funcionarioId: number;
  dataEntrega: string;
  observacoes: string;
  itens: Array<{ nome: string; quantidade: number }>;
}

@Injectable({ providedIn: 'root' })
export class EpisApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/epis';

  listar(): Observable<EpisApiItem[]> {
    return this.http.get<EpisApiItem[]>(this.url);
  }

  criar(epi: Omit<EpisApiItem, 'id'>): Observable<EpisApiItem> {
    return this.http.post<EpisApiItem>(this.url, epi);
  }

  atualizar(id: number, epi: Omit<EpisApiItem, 'id'>): Observable<EpisApiItem> {
    return this.http.put<EpisApiItem>(`${this.url}/${id}`, epi);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  listarEntregas(): Observable<EntregaEpiApi[]> {
    return this.http.get<EntregaEpiApi[]>(`${this.url}/entregas`);
  }

  salvarEntrega(request: EntregaEpiRequestApi, id?: number): Observable<EntregaEpiApi> {
    return id === undefined
      ? this.http.post<EntregaEpiApi>(`${this.url}/entregas`, request)
      : this.http.put<EntregaEpiApi>(`${this.url}/entregas/${id}`, request);
  }

  excluirEntrega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/entregas/${id}`);
  }
}
