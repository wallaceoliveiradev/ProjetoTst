import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type TipoRelatorio =
  | 'geral'
  | 'funcionarios'
  | 'treinamentos'
  | 'epis'
  | 'riscos'
  | 'inspecoes'
  | 'checklist';

export interface RelatorioQuantidade {
  rotulo: string;
  quantidade: number;
}

export interface RelatorioQuantidadeMensal {
  anoMes: string;
  quantidade: number;
}

export interface RelatorioResumoResponse {
  inicio: string;
  fim: string;
  dataReferenciaAtual: string;
  geradoEm: string;
  colaboradoresAtivosAtuais: number;
  conclusoesNoPeriodo: number;
  unidadesEpiEntreguesNoPeriodo: number;
  riscosAtivosAtuais: number;
  treinamentosPorTipo: RelatorioQuantidade[];
  episPorTipo: RelatorioQuantidade[];
  riscosPorNivel: RelatorioQuantidade[];
  treinamentosPorMes: RelatorioQuantidadeMensal[];
}

export interface RelatorioDadosResponse {
  tipo: TipoRelatorio;
  titulo: string;
  inicio: string;
  fim: string;
  geradoEm: string;
  colunas: string[];
  linhas: (string | number | null)[][];
}

@Injectable({ providedIn: 'root' })
export class RelatoriosApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/relatorios';

  obterResumo(inicio: string, fim: string): Observable<RelatorioResumoResponse> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<RelatorioResumoResponse>(`${this.url}/resumo`, { params });
  }

  obterDados(
    tipo: TipoRelatorio,
    inicio: string,
    fim: string,
  ): Observable<RelatorioDadosResponse> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('inicio', inicio)
      .set('fim', fim);
    return this.http.get<RelatorioDadosResponse>(`${this.url}/dados`, { params });
  }
}
