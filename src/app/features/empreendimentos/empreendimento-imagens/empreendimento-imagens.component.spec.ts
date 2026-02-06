import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmpreendimentoImagensComponent } from './empreendimento-imagens.component';

describe('EmpreendimentoImagensComponent', () => {
  let component: EmpreendimentoImagensComponent;
  let fixture: ComponentFixture<EmpreendimentoImagensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmpreendimentoImagensComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpreendimentoImagensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
