import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface NotificacaoBloqueio {
  id: number;
  usuarioId: number;
  emailUsuario: string;
  nomeUsuario: string;
  criadaEm: string;
  lida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8080/api/notificacoes/admin/bloqueios';

  listarBloqueios(): Observable<NotificacaoBloqueio[]> {
    return this.http.get<NotificacaoBloqueio[]>(this.url);
  }

  marcarComoLida(id: number): Observable<NotificacaoBloqueio> {
    return this.http.patch<NotificacaoBloqueio>(`${this.url}/${id}/lida`, {});
  }
}
