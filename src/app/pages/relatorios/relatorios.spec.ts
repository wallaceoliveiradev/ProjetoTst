import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Relatorios } from './relatorios';
import { RelatoriosApiService } from '../../services/relatorios-api.service';

describe('Relatorios', () => {
  let component: Relatorios;
  let fixture: ComponentFixture<Relatorios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Relatorios],
      providers: [
        {
          provide: RelatoriosApiService,
          useValue: {
            obterResumo: () =>
              of({
                inicio: '2026-10-01',
                fim: '2026-10-31',
                dataReferenciaAtual: '2026-10-18',
                geradoEm: '2026-10-18T12:00:00Z',
                colaboradoresAtivosAtuais: 0,
                conclusoesNoPeriodo: 0,
                unidadesEpiEntreguesNoPeriodo: 0,
                riscosAtivosAtuais: 0,
                treinamentosPorTipo: [],
                episPorTipo: [],
                riscosPorNivel: [],
                treinamentosPorMes: [],
              }),
            obterDados: () =>
              of({
                tipo: 'geral',
                titulo: 'Relatório Geral',
                inicio: '2026-10-01',
                fim: '2026-10-31',
                geradoEm: '2026-10-18T12:00:00Z',
                colunas: [],
                linhas: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Relatorios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
