import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { TreinamentoService } from '../../services/Treinamento.service';
import { UsuarioApiService } from '../../services/usuario-api.service';
import { HistoricoTreinamento, ParametroTreinamento } from './treinamento.model';
import { Treinamentos } from './treinamentos';

describe('Treinamentos', () => {
  let component: Treinamentos;
  let fixture: ComponentFixture<Treinamentos>;
  let excluirParametro: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    excluirParametro = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [Treinamentos],
      providers: [
        { provide: AuthService, useValue: { isAdmin: () => true } },
        {
          provide: TreinamentoService,
          useValue: {
            listar: () => of([]),
            listarHistorico: () => of([]),
            listarParametros: () => of([]),
            excluirParametro,
            criar: () => of({}),
            atualizar: () => of({}),
          },
        },
        { provide: UsuarioApiService, useValue: { listar: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Treinamentos);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('mostra as cinco subnavs de treinamentos', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.training-sub-nav button') as NodeListOf<HTMLButtonElement>,
    );

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Treinamentos cadastrados',
      'Novo treinamento',
      'Certificados',
      'Reciclagens obrigatórias',
      'Controle de validades',
    ]);
  });

  it('separa alertas, vencimentos e invalidações para a fila de reciclagem', () => {
    component.historico.set([
      registro(1, 'ALERTA'),
      registro(2, 'VENCIDO'),
      registro(3, 'VALIDO'),
      registro(4, 'SUBSTITUIDO'),
      registro(5, 'INVALIDADO'),
    ]);

    expect(component.registrosEmReciclagem.map((item) => item.id)).toEqual([1, 2, 5]);
    expect(component.statusLabel('ALERTA')).toBe('Em alerta / reciclagem');
    expect(component.statusLabel('VENCIDO')).toBe('Vencido');
  });

  it('abre o cadastro de um curso somente para administrador', () => {
    component.abrirFormulario();

    expect(component.abaAtiva).toBe('novo');
  });

  it('sugere a validade padrão das NRs modeladas sem sobrescrever um ajuste manual', () => {
    component.novoTreinamento.norma = 'NR-10';
    component.sugerirValidadeNorma();
    expect(component.novoTreinamento.validade).toBe(24);

    component.novoTreinamento.validade = 18;
    component.novoTreinamento.norma = 'NR-35';
    component.sugerirValidadeNorma();
    expect(component.novoTreinamento.validade).toBe(18);

    component.novoTreinamento.validade = 0;
    component.novoTreinamento.norma = 'NR-33';
    component.sugerirValidadeNorma();
    expect(component.novoTreinamento.validade).toBe(12);
  });

  it('confirma a exclusão da regra e remove-a da lista sem alterar o histórico', () => {
    const parametro = parametroDeValidade();
    const confirmacao = vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.parametros.set([parametro]);
    component.editarParametro(parametro);

    component.excluirParametro(parametro);

    expect(confirmacao).toHaveBeenCalledOnce();
    expect(excluirParametro).toHaveBeenCalledWith(parametro.treinamentoId, parametro.id);
    expect(component.parametros()).toEqual([]);
    expect(component.parametroEditandoId).toBeNull();
    expect(component.mensagemSucesso).toContain('Certificados já registrados');
    confirmacao.mockRestore();
  });

  it('mantém a regra configurada se a confirmação da exclusão for cancelada', () => {
    const parametro = parametroDeValidade();
    const confirmacao = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.parametros.set([parametro]);

    component.excluirParametro(parametro);

    expect(excluirParametro).not.toHaveBeenCalled();
    expect(component.parametros()).toEqual([parametro]);
    confirmacao.mockRestore();
  });

  function parametroDeValidade(): ParametroTreinamento {
    return {
      id: 4,
      treinamentoId: 10,
      treinamentoNome: 'Trabalho em Altura',
      norma: 'NR-35',
      cargo: 'Operador',
      validadeMeses: 24,
      diasAntecedenciaAlerta: 60,
    };
  }

  function registro(id: number, status: HistoricoTreinamento['status']): HistoricoTreinamento {
    return {
      id,
      treinamentoId: 10,
      treinamentoNome: 'Trabalho em Altura',
      norma: 'NR-35',
      usuarioId: 20,
      colaboradorNome: 'Colaborador',
      colaboradorEmail: 'colaborador@example.com',
      cargo: 'Operador',
      dataConclusao: '2026-10-15',
      dataVencimento: '2028-10-15',
      validadeAplicadaMeses: 24,
      diasAntecedenciaAlerta: 60,
      cargaHoraria: 8,
      instrutor: 'Instrutor',
      conteudoProgramatico: 'Conteúdo',
      certificadoNome: 'certificado.pdf',
      certificadoContentType: 'application/pdf',
      status,
      motivoInvalidacao: null,
      dataInvalidacao: null,
    };
  }
});
