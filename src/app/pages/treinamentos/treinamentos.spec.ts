// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { of } from 'rxjs';

// import { Treinamentos } from './treinamentos';
// import { TreinamentoService } from '../../services/Treinamento.service';

// describe('Treinamentos', () => {
//   let component: Treinamentos;
//   let fixture: ComponentFixture<Treinamentos>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [Treinamentos],
//       providers: [
//         {
//           provide: TreinamentoService,
//           useValue: {
//             listar: () => of([]),
//             criar: () => of({}),
//             atualizar: () => of({}),
//           },
//         },
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(Treinamentos);
//     component = fixture.componentInstance;
//     await fixture.whenStable();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
