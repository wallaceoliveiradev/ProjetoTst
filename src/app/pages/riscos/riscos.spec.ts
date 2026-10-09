import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RiscoApiService } from '../../services/risco-api.service';

import { Riscos } from './riscos';

const riscosIniciais = [{
  id: 1,
  setor: 'Manutenção',
  risco: 'Choque elétrico',
  nivel: 'ALTO' as const,
  situacao: 'ATIVO' as const,
  icone: 'bi-lightning-charge',
}];

describe('Riscos', () => {
  let component: Riscos;
  let fixture: ComponentFixture<Riscos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Riscos],
      providers: [{
        provide: RiscoApiService,
        useValue: {
          listar: () => of(riscosIniciais),
          obter: () => of(null),
          criar: () => of(null),
          atualizar: () => of(null),
        },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(Riscos);
    fixture.detectChanges();
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads risk rows on page entry without requiring a user click', () => {
    expect(component.riscos).toHaveLength(1);
    expect(component.riscos[0].risco).toBe('Choque elétrico');
    expect(component.carregando).toBe(false);
  });
});
