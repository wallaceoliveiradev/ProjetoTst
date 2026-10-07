import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Epis } from './epis';

describe('Epis', () => {
  let component: Epis;
  let fixture: ComponentFixture<Epis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Epis],
    }).compileComponents();

    fixture = TestBed.createComponent(Epis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
