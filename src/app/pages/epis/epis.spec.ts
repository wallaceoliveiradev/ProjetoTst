import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Epis } from './epis';

describe('Epis', () => {
  let component: Epis;
  let fixture: ComponentFixture<Epis>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Epis],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Epis);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/api/epis').flush([
      { id: 11, nome: 'Capacete', categoria: 'Cabeça', dataEntrada: '2026-01-01', quantidade: 10, validade: '2027-01-01', ca: 'CA 1' },
      { id: 12, nome: 'Óculos', categoria: 'Olhos', dataEntrada: '2026-01-01', quantidade: 5, validade: '2027-01-01', ca: 'CA 2' },
    ]);
    http.expectOne('http://localhost:8080/api/usuarios').flush([
      { id: 1, nome: 'Funcionário ativo', email: 'ativo@example.test', perfil: 'colaborador', cargo: 'Técnico', status: 'ATIVO' },
      { id: 2, nome: 'Funcionário inativo', email: 'inativo@example.test', perfil: 'colaborador', cargo: 'Técnico', status: 'INATIVO' },
    ]);
    http.expectOne('http://localhost:8080/api/epis/entregas').flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('uses only active users and database EPIs in the delivery form', () => {
    expect(component.funcionarios.map((user) => user.id)).toEqual([1]);
    expect(component.opcoesEpiParaEntrega.map((epi) => epi.nome)).toEqual(['Capacete', 'Óculos']);
  });

  it('submits multiple EPI types in one delivery and refreshes server stock', async () => {
    component.entregaForm.funcionarioId = 1;
    component.entregaForm.dataEntrega = '2026-10-08';
    component.entregaForm.itens = [
      { nome: 'Capacete', quantidade: 2 },
      { nome: 'Óculos', quantidade: 1 },
    ];
    component.registrarEntrega();

    const post = http.expectOne('http://localhost:8080/api/epis/entregas');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      funcionarioId: 1,
      dataEntrega: '2026-10-08',
      observacoes: '',
      itens: [
        { nome: 'Capacete', quantidade: 2 },
        { nome: 'Óculos', quantidade: 1 },
      ],
    });
    post.flush({
      id: 5,
      funcionarioId: 1,
      funcionario: 'Funcionário ativo',
      dataEntrega: '2026-10-08',
      observacoes: '',
      epi: 'Capacete, Óculos',
      quantidade: 3,
      dataValidade: '2027-01-01',
      ca: 'CA 1, CA 2',
      remessas: [
        { remessaId: 11, quantidade: 2, dataValidade: '2027-01-01' },
        { remessaId: 12, quantidade: 1, dataValidade: '2027-01-01' },
      ],
      itens: [
        { nome: 'Capacete', quantidade: 2 },
        { nome: 'Óculos', quantidade: 1 },
      ],
    });

    http.expectOne('http://localhost:8080/api/epis').flush([
      { id: 11, nome: 'Capacete', categoria: 'Cabeça', dataEntrada: '2026-01-01', quantidade: 8, validade: '2027-01-01', ca: 'CA 1' },
      { id: 12, nome: 'Óculos', categoria: 'Olhos', dataEntrada: '2026-01-01', quantidade: 4, validade: '2027-01-01', ca: 'CA 2' },
    ]);
    expect(component.entregas[0].epi).toBe('Capacete, Óculos');
    expect(component.episCadastrados.map((epi) => epi.quantidade)).toEqual([8, 4]);
    expect(component.feedbackEntrega).toBe('Entrega registrada com sucesso.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Entrega registrada com sucesso.');
    expect(fixture.nativeElement.textContent).not.toContain('Entregas registradas');

    const historyTab = Array.from(
      fixture.nativeElement.querySelectorAll('.tab-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Histórico de Entregas'));
    historyTab?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.abaAtual).toBe('historico');
    expect(fixture.nativeElement.textContent).toContain('Entregas registradas');
    expect(fixture.nativeElement.textContent).toContain('Capacete, Óculos');
  });

  it('displays the backend stock validation error without changing the local stock', () => {
    component.entregaForm.funcionarioId = 1;
    component.entregaForm.dataEntrega = '2026-10-08';
    component.entregaForm.itens = [{ nome: 'Capacete', quantidade: 99 }];
    component.registrarEntrega();

    http.expectOne('http://localhost:8080/api/epis/entregas').flush(
      { message: 'Estoque insuficiente para Capacete. Disponível: 10.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(component.feedbackEntrega).toContain('Estoque insuficiente');
    expect(component.episCadastrados.find((epi) => epi.nome === 'Capacete')?.quantidade).toBe(10);
  });
});
