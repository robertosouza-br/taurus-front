import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputCepComponent } from './input-cep.component';

describe('InputCepComponent', () => {
  let component: InputCepComponent;
  let fixture: ComponentFixture<InputCepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputCepComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InputCepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
