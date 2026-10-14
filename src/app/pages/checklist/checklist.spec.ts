import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';

import { Checklist } from './checklist';

describe('Checklist', () => {
  let component: Checklist;
  let fixture: ComponentFixture<Checklist>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checklist],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getUsuarioLogado: () => ({ nome: 'Responsável teste' }) },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Checklist);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/api/inspecoes').flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('envia o cabeçalho e todas as respostas com datas ISO', () => {
    component.iniciarInspecao('onibus');
    component.inspecao.data = '2026-10-06';
    component.todosOsItens.forEach((item) => component.marcarItem(item, 'conforme'));

    const respostaNaoConforme = component.todosOsItens[0];
    component.marcarItem(respostaNaoConforme, 'naoConforme');
    respostaNaoConforme.observacao = 'Pneu com desgaste irregular.';
    respostaNaoConforme.prazo = '2026-10-13';
    respostaNaoConforme.responsavelCorrecao = 'Equipe de manutenção';

    component.salvarChecklist();

    const request = http.expectOne({
      method: 'POST',
      url: 'http://localhost:8080/api/inspecoes',
    });
    expect(request.request.body.data).toBe('2026-10-06');
    expect(request.request.body.respostas).toHaveLength(component.totalItens);
    expect(request.request.body.respostas[0]).toMatchObject({
      itemId: respostaNaoConforme.id,
      status: 'naoConforme',
      prazoCorrecao: '2026-10-13',
    });
    expect(request.request.body.respostas[1].prazoCorrecao).toBeNull();

    request.flush({
      ...request.request.body,
      id: 99,
      criadoPor: 'Responsável teste',
      totalItens: component.totalItens,
      conformes: component.totalItens - 1,
      naoConformes: 1,
      pendentes: 0,
      conformidade: Math.round(((component.totalItens - 1) / component.totalItens) * 100),
    });

    expect(component.salvandoChecklist).toBe(false);
    expect(component.inspecoesSalvas[0].id).toBe(99);
    expect(component.tela).toBe('painel');
  });

  it('não envia o checklist enquanto houver itens sem resposta explícita', () => {
    component.iniciarInspecao('onibus');
    component.salvarChecklist();

    expect(component.feedbackSalvamento).toContain('todos os itens');
    expect(component.salvandoChecklist).toBe(false);
    http.expectNone('http://localhost:8080/api/inspecoes');
  });

  it('carrega uma inspeção salva e atualiza cabeçalho e respostas pelo mesmo endpoint', () => {
    component.abrirInspecaoRecente({
      id: 42,
      data: '2026-10-06',
      tipoId: 'onibus',
      tipo: 'Inspeção de Ônibus',
      localVeiculo: 'Ônibus 3021',
      responsavel: 'Responsável teste',
      conformidade: 100,
      origem: 'api',
    });

    http.expectOne('http://localhost:8080/api/inspecoes/42').flush({
      id: 42,
      data: '2026-10-06',
      tipoId: 'onibus',
      tipo: 'Pré-operacional',
      local: 'Garagem Austin',
      setor: 'Operacional',
      numeroOnibus: '3021',
      placa: 'RIO-3A21',
      responsavel: 'Responsável teste',
      observacoesGerais: '',
      criadoPor: 'Responsável teste',
      totalItens: 1,
      conformes: 1,
      naoConformes: 0,
      pendentes: 0,
      conformidade: 100,
      respostas: [{
        itemId: 'pneus',
        descricao: 'Pneus em condições adequadas',
        status: 'conforme',
        observacao: '',
        prioridade: 'Média',
        prazoCorrecao: null,
        responsavelCorrecao: '',
      }],
    });

    expect(component.inspecaoEditandoId).toBe(42);
    expect(component.todosOsItens.find((item) => item.id === 'pneus')?.status).toBe('conforme');
    component.todosOsItens.forEach((item) => component.marcarItem(item, 'conforme'));
    component.salvarChecklist();

    const request = http.expectOne({
      method: 'PUT',
      url: 'http://localhost:8080/api/inspecoes/42',
    });
    expect(request.request.body.data).toBe('2026-10-06');
    request.flush({
      ...request.request.body,
      id: 42,
      criadoPor: 'Responsável teste',
      totalItens: component.totalItens,
      conformes: component.totalItens,
      naoConformes: 0,
      pendentes: 0,
      conformidade: 100,
    });

    expect(component.inspecoesSalvas[0].id).toBe(42);
    expect(component.inspecoesSalvas).toHaveLength(1);
  });
});
