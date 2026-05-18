import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SincronizacaoEmpreendimentosComponent } from './sincronizacao-empreendimentos.component';

describe('SincronizacaoEmpreendimentosComponent', () => {
  let component: SincronizacaoEmpreendimentosComponent;
  let fixture: ComponentFixture<SincronizacaoEmpreendimentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SincronizacaoEmpreendimentosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SincronizacaoEmpreendimentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
