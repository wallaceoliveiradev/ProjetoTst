import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { RiscoApiService, RiscoUsuarioApi } from '../../services/risco-api.service';

@Component({
  selector: 'app-riscos-colaborador',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './riscos-colaborador.html',
  styleUrl: './riscos-colaborador.scss',
})
export class RiscosColaborador implements OnInit {
  private readonly riscosApi = inject(RiscoApiService);
  private readonly plataformaId = inject(PLATFORM_ID);

  riscosAssociados: RiscoUsuarioApi[] = [];
  riscosCarregando = true;
  erroAoCarregar = false;

  ngOnInit(): void {
    // A autenticação usa localStorage e não está disponível durante o SSR.
    if (isPlatformBrowser(this.plataformaId)) {
      this.carregarRiscos();
    }
  }

  carregarRiscos(): void {
    if (!isPlatformBrowser(this.plataformaId)) return;

    this.riscosCarregando = true;
    this.erroAoCarregar = false;
    this.riscosApi
      .listarMinhasAssociacoes()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.riscosCarregando = false;
        }),
      )
      .subscribe({
        next: (riscos) => {
          this.riscosAssociados = riscos;
        },
        error: () => {
          this.erroAoCarregar = true;
        },
      });
  }
}
