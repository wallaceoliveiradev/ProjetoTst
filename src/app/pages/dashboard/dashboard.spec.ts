import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AuthService } from '../../services/auth.service';
import { DashboardApiService } from '../../services/dashboard-api.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
        { provide: AuthService, useValue: { isAdmin: () => true } },
        {
          provide: DashboardApiService,
          useValue: {
            obter: () =>
              of({
                dataReferencia: '2026-10-18',
                geradoEm: '2026-10-18T12:00:00Z',
                diasAlertaEpi: 30,
                treinamentosVencidos: 0,
                percentualTreinamentosVencidos: 0,
                episProximosVencimento: 0,
                percentualEpisProximosVencimento: 0,
                colaboradoresCertificados: 0,
                percentualColaboradoresCertificados: 0,
                riscosAltosAtivos: 0,
                percentualRiscosAltosAtivos: 0,
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
