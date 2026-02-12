import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImobiliariasListaComponent } from './imobiliarias-lista.component';

describe('ImobiliariasListaComponent', () => {
  let component: ImobiliariasListaComponent;
  let fixture: ComponentFixture<ImobiliariasListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImobiliariasListaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImobiliariasListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
