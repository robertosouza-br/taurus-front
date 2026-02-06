import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmpreendimentosListaComponent } from './empreendimentos-lista.component';

describe('EmpreendimentosListaComponent', () => {
  let component: EmpreendimentosListaComponent;
  let fixture: ComponentFixture<EmpreendimentosListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmpreendimentosListaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpreendimentosListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
