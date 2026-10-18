import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardResponse {
  dataReferencia: string;
  geradoEm: string;
  diasAlertaEpi: number;
  treinamentosVencidos: number;
  percentualTreinamentosVencidos: number;
  episProximosVencimento: number;
  percentualEpisProximosVencimento: number;
  colaboradoresCertificados: number;
  percentualColaboradoresCertificados: number;
  riscosAltosAtivos: number;
  percentualRiscosAltosAtivos: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/dashboard';

  obter(diasAlertaEpi = 30): Observable<DashboardResponse> {
    const params = new HttpParams().set('diasAlertaEpi', diasAlertaEpi);
    return this.http.get<DashboardResponse>(this.url, { params });
  }
}
