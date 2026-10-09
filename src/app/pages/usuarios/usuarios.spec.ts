import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RiscoApiService } from '../../services/risco-api.service';
import { UsuarioApiService } from '../../services/usuario-api.service';

import { UsuariosComponent } from './usuarios';

describe('Usuarios', () => {
  let component: UsuariosComponent;
  let fixture: ComponentFixture<UsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getUsuarioLogado: () => null,
            isAdmin: () => false,
            isColaborador: () => false,
          },
        },
        {
          provide: UsuarioApiService,
          useValue: {
            listar: () => of([]),
            obterUsuarioAtual: () => of(null),
            cadastrar: () => of(null),
          },
        },
        {
          provide: RiscoApiService,
          useValue: {
            listar: () => of([]),
            listarAssociacoes: () => of([]),
            listarMinhasAssociacoes: () => of([]),
            substituirAssociacoes: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
