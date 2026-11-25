import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardResponse } from '../../services/dashboard-api.service';
import { Dashboard } from './dashboard';

const resposta: DashboardResponse = {
  dataReferencia: '2026-11-24',
  geradoEm: '2026-11-25T00:00:00Z',
  diasAlertaEpi: 30,
  treinamentosVencidos: 0,
  percentualTreinamentosVencidos: 0,
  episProximosVencimento: 0,
  percentualEpisProximosVencimento: 0,
  colaboradoresCertificados: 0,
  percentualColaboradoresCertificados: 0,
  riscosAltosAtivos: 0,
  percentualRiscosAltosAtivos: 0,
};
const endpoint = 'http://localhost:8080/api/dashboard?diasAlertaEpi=30';

describe('Dashboard integrado', () => {
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;
  let admin: boolean;

  beforeEach(() => {
    admin = true;
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAdmin: () => admin } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function abrir(): Dashboard {
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('não apresenta zeros antes da resposta e aceita quatro zeros reais', () => {
    abrir();
    expect(fixture.nativeElement.textContent).toContain('Carregando indicadores');
    expect(fixture.nativeElement.querySelectorAll('app-indicador-card')).toHaveLength(0);
    http.expectOne(endpoint).flush(resposta);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-indicador-card strong')).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('24/11/2026');
    expect(fixture.nativeElement.textContent).toContain('Nenhum risco alto ativo encontrado');
    expect(fixture.nativeElement.textContent).not.toContain('operação regular');
  });

  it('bloqueia consultas duplicadas e permite atualizar ao concluir', () => {
    const component = abrir();
    component.carregar();
    http.expectOne(endpoint).flush(resposta);
    component.carregar();
    expect(component.dados()).toBeNull();
    expect(component.carregando()).toBe(true);
    http.expectOne(endpoint).flush({ ...resposta, riscosAltosAtivos: 2 });
    expect(component.dados()?.riscosAltosAtivos).toBe(2);
    expect(component.carregando()).toBe(false);
  });

  it.each([
    [0, 'Não foi possível conectar'],
    [401, 'Sua sessão expirou'],
    [403, 'Sua conta não tem permissão'],
    [500, 'HTTP 500'],
  ])('mostra a falha HTTP %s sem inventar indicadores', (status, mensagem) => {
    const component = abrir();
    http.expectOne(endpoint).flush(null, { status, statusText: 'Falha de teste' });
    fixture.detectChanges();
    expect(component.carregando()).toBe(false);
    expect(component.dados()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(mensagem);
    expect(fixture.nativeElement.querySelectorAll('app-indicador-card')).toHaveLength(0);
    component.carregar();
    http.expectOne(endpoint).flush(resposta);
    expect(component.erro()).toBe('');
  });

  it('não consulta indicadores para colaborador', () => {
    admin = false;
    const component = abrir();
    component.carregar();
    http.expectNone(endpoint);
    expect(fixture.nativeElement.querySelectorAll('app-indicador-card')).toHaveLength(0);
  });

  it('não consulta a API durante SSR', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAdmin: () => true } },
      ],
    });
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    abrir();
    http.expectNone(endpoint);
  });

  it('cancela a consulta ao sair da página', () => {
    abrir();
    const request = http.expectOne(endpoint);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });

  it('abre os destinos e parâmetros indicados pelo guia', () => {
    abrir();
    http.expectOne(endpoint).flush({ ...resposta, riscosAltosAtivos: 2 });
    fixture.detectChanges();
    const urls = Array.from(
      fixture.nativeElement.querySelectorAll(
        'app-indicador-card a',
      ) as NodeListOf<HTMLAnchorElement>,
    ).map((link) => link.getAttribute('href'));
    expect(urls).toEqual([
      '/sistema/treinamentos?aba=reciclagens',
      '/sistema/epis-admin?aba=cadastro',
      '/sistema/treinamentos?aba=certificados',
      '/sistema/riscos?nivel=ALTO&situacao=ATIVO',
    ]);
    expect(
      fixture.nativeElement.querySelector('a[href="/sistema/checklist?tela=selecao"]'),
    ).toBeTruthy();
  });
});
