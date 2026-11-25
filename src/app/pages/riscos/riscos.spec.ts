import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RiscoApiService } from '../../services/risco-api.service';

import { Riscos } from './riscos';

const riscosIniciais = [
  {
    id: 1,
    setor: 'Manutenção',
    risco: 'Choque elétrico',
    nivel: 'ALTO' as const,
    situacao: 'ATIVO' as const,
    icone: 'bi-lightning-charge',
  },
];

describe('Riscos', () => {
  const parametrosDaRota = new BehaviorSubject(convertToParamMap({}));
  let component: Riscos;
  let fixture: ComponentFixture<Riscos>;

  beforeEach(async () => {
    parametrosDaRota.next(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [Riscos],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametrosDaRota } },
        {
          provide: RiscoApiService,
          useValue: {
            listar: () => of(riscosIniciais),
            obter: () => of(null),
            criar: () => of(null),
            atualizar: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Riscos);
    fixture.detectChanges();
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('aplica ALTO e ATIVO sem perder os totais do catálogo', () => {
    const listar = vi.spyOn(TestBed.inject(RiscoApiService), 'listar');
    const catalogo = [
      ...riscosIniciais,
      { ...riscosIniciais[0], id: 2, situacao: 'INATIVO' as const },
    ];
    listar.mockImplementation((filtro = {}) => of(filtro.nivel ? riscosIniciais : catalogo));
    parametrosDaRota.next(convertToParamMap({ nivel: 'ALTO', situacao: 'ATIVO' }));
    expect(listar).toHaveBeenLastCalledWith({ busca: undefined, nivel: 'ALTO', situacao: 'ATIVO' });
    expect(component.totalRiscos).toBe(2);
    expect(component.totalAltos).toBe(2);
    expect(component.riscos).toHaveLength(1);
  });

  it('renderiza uma resposta assíncrona sem depender de outro clique', async () => {
    const resposta = new Subject<typeof riscosIniciais>();
    vi.spyOn(TestBed.inject(RiscoApiService), 'listar').mockReturnValue(resposta);
    parametrosDaRota.next(convertToParamMap({}));
    resposta.next(riscosIniciais);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Choque elétrico');
    expect(fixture.nativeElement.textContent).not.toContain('Carregando riscos');
    resposta.complete();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads risk rows on page entry without requiring a user click', () => {
    expect(component.riscos).toHaveLength(1);
    expect(component.riscos[0].risco).toBe('Choque elétrico');
    expect(component.riscos[0].icone).toBe('bi-shield-exclamation');
    expect(component.carregando).toBe(false);
  });

  it('assigns a Bootstrap icon for each risk level', () => {
    expect(component.iconePorNivel('Alto')).toBe('bi-shield-exclamation');
    expect(component.iconePorNivel('Médio')).toBe('bi-exclamation-triangle');
    expect(component.iconePorNivel('Baixo')).toBe('bi-shield-check');
  });
});
