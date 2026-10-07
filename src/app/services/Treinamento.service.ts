import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { StatusTreinamento, Treinamento } from '../pages/treinamentos/treinamento.model';

export type TreinamentoRequest = Omit<Treinamento, 'id'>;

type StatusTreinamentoApi = 'ATIVO' | 'INATIVO' | 'PLANEJADO' | 'CONCLUIDO';
type TreinamentoApiRequest = Omit<TreinamentoRequest, 'status'> & {
  status: StatusTreinamentoApi;
};
type TreinamentoApiResponse = Omit<Treinamento, 'status'> & {
  status: StatusTreinamentoApi;
  usuarioIds: number[];
};

const statusParaApi: Record<StatusTreinamento, StatusTreinamentoApi> = {
  Ativo: 'ATIVO',
  Inativo: 'INATIVO',
  Planejado: 'PLANEJADO',
  'Concluído': 'CONCLUIDO',
};

const statusDaApi: Record<StatusTreinamentoApi, StatusTreinamento> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  PLANEJADO: 'Planejado',
  CONCLUIDO: 'Concluído',
};

@Injectable({ providedIn: 'root' })
export class TreinamentoService {
  private http = inject(HttpClient);
  private url = 'http://localhost:8080/api/treinamentos';

  listar() {
    return this.http.get<TreinamentoApiResponse[]>(this.url).pipe(
      map((treinamentos) =>
        treinamentos.map((treinamento) => ({
          ...treinamento,
          status: statusDaApi[treinamento.status],
        })),
      ),
    );
  }

  criar(dados: TreinamentoRequest) {
    return this.http.post<TreinamentoApiResponse>(this.url, this.paraApi(dados)).pipe(
      map((treinamento) => ({
        ...treinamento,
        status: statusDaApi[treinamento.status],
      })),
    );
  }

  atualizar(id: number, dados: TreinamentoRequest) {
    return this.http.put<TreinamentoApiResponse>(
      `${this.url}/${id}`,
      this.paraApi(dados),
    ).pipe(
      map((treinamento: TreinamentoApiResponse) => ({
        ...treinamento,
        status: statusDaApi[treinamento.status],
      })),
    );
  }

  private paraApi(dados: TreinamentoRequest): TreinamentoApiRequest {
    return {
      ...dados,
      status: statusParaApi[dados.status],
    };
  }
}