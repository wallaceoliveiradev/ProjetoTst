import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import {
  HistoricoTreinamento,
  ParametroTreinamento,
  ParametroTreinamentoRequest,
  RegistroConclusaoTreinamento,
  StatusTreinamento,
  Treinamento,
} from '../pages/treinamentos/treinamento.model';

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

  listarHistorico() {
    return this.http.get<HistoricoTreinamento[]>(`${this.url}/historico`);
  }

  registrarConclusao(dados: RegistroConclusaoTreinamento, certificado: File) {
    const formulario = new FormData();
    formulario.append(
      'dados',
      new Blob([JSON.stringify(dados)], { type: 'application/json' }),
    );
    formulario.append('certificado', certificado, certificado.name);
    return this.http.post<HistoricoTreinamento>(`${this.url}/historico`, formulario);
  }

  invalidarCiclo(id: number, motivo: string) {
    return this.http.post<HistoricoTreinamento>(`${this.url}/historico/${id}/invalidar`, {
      motivo,
    });
  }

  baixarCertificado(id: number) {
    return this.http.get(`${this.url}/historico/${id}/certificado`, {
      responseType: 'blob',
    });
  }

  listarParametros() {
    return this.http.get<ParametroTreinamento[]>(`${this.url}/parametros`);
  }

  salvarParametro(
    treinamentoId: number,
    dados: ParametroTreinamentoRequest,
    parametroId?: number,
  ) {
    return parametroId === undefined
      ? this.http.post<ParametroTreinamento>(
          `${this.url}/${treinamentoId}/parametros`,
          dados,
        )
      : this.http.put<ParametroTreinamento>(
          `${this.url}/${treinamentoId}/parametros/${parametroId}`,
          dados,
        );
  }

  excluirParametro(treinamentoId: number, parametroId: number) {
    return this.http.delete<void>(
      `${this.url}/${treinamentoId}/parametros/${parametroId}`,
    );
  }

  private paraApi(dados: TreinamentoRequest): TreinamentoApiRequest {
    return {
      ...dados,
      status: statusParaApi[dados.status],
    };
  }
}