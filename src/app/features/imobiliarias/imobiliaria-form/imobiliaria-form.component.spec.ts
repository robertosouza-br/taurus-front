import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImobiliariaFormComponent } from './imobiliaria-form.component';

describe('ImobiliariaFormComponent', () => {
  let component: ImobiliariaFormComponent;
  let fixture: ComponentFixture<ImobiliariaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImobiliariaFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImobiliariaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
