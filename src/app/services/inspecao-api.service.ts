import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type StatusRespostaInspecaoApi = 'conforme' | 'naoConforme' | 'pendente';
export type PrioridadeInspecaoApi = 'Baixa' | 'Média' | 'Alta';

export interface RespostaInspecaoRequestApi {
  itemId: string;
  descricao: string;
  status: StatusRespostaInspecaoApi;
  observacao: string;
  prioridade: PrioridadeInspecaoApi;
  prazoCorrecao: string | null;
  responsavelCorrecao: string;
}

export interface InspecaoRequestApi {
  data: string;
  tipoId: string;
  tipo: string;
  local: string;
  setor: string;
  numeroOnibus: string;
  placa: string;
  responsavel: string;
  observacoesGerais: string;
  respostas: RespostaInspecaoRequestApi[];
}

export interface RespostaInspecaoApi extends RespostaInspecaoRequestApi {}

export interface InspecaoApi extends InspecaoRequestApi {
  id: number;
  criadoPor: string;
  totalItens: number;
  conformes: number;
  naoConformes: number;
  pendentes: number;
  conformidade: number;
  respostas: RespostaInspecaoApi[];
}

@Injectable({ providedIn: 'root' })
export class InspecaoApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/inspecoes';

  listar(): Observable<InspecaoApi[]> {
    return this.http.get<InspecaoApi[]>(this.url);
  }

  obter(id: number): Observable<InspecaoApi> {
    return this.http.get<InspecaoApi>(`${this.url}/${id}`);
  }

  criar(request: InspecaoRequestApi): Observable<InspecaoApi> {
    return this.http.post<InspecaoApi>(this.url, request);
  }

  atualizar(id: number, request: InspecaoRequestApi): Observable<InspecaoApi> {
    return this.http.put<InspecaoApi>(`${this.url}/${id}`, request);
  }
}
