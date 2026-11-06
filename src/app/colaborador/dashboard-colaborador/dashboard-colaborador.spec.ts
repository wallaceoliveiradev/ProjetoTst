import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardColaborador } from './dashboard-colaborador';

describe('DashboardColaborador', () => {
  let component: DashboardColaborador;
  let fixture: ComponentFixture<DashboardColaborador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardColaborador],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardColaborador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
