import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardColaborador } from './dashboard-colaborador';

describe('DashboardColaborador', () => {
  let component: DashboardColaborador;
  let fixture: ComponentFixture<DashboardColaborador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
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
