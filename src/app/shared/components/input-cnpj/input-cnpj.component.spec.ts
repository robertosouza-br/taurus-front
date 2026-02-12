import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputCnpjComponent } from './input-cnpj.component';

describe('InputCnpjComponent', () => {
  let component: InputCnpjComponent;
  let fixture: ComponentFixture<InputCnpjComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputCnpjComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InputCnpjComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
