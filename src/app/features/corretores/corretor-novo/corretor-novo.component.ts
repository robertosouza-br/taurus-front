import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, Banco, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-corretor-novo',
  templateUrl: './corretor-novo.component.html',
  styleUrls: ['./corretor-novo.component.scss']
})
export class CorretorNovoComponent implements OnInit {
  formulario!: FormGroup;
  carregando = false;
  submitted = false;
  bancos: Banco[] = [];
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private fb: FormBuilder,
    private corretorService: CorretorService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.inicializarFormulario();
    this.carregarBancos();
    this.carregarOpcoes();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores', url: '/cadastros/corretores' },
      { label: 'Novo Corretor' }
    ];
  }

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
      cargo: [CorretorCargo.CORRETOR, Validators.required],
      banco: [null, Validators.required],
      agencia: ['', [Validators.required, Validators.minLength(1)]],
      conta: ['', [Validators.required, Validators.minLength(1)]],
      digitoConta: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2)]],
      tipoChavePix: [TipoChavePix.CPF, Validators.required],
      chavePix: ['', [Validators.required, Validators.minLength(1)]],
      ativo: [true]
    });

    // Atualizar validação da chave PIX quando o tipo mudar
    this.formulario.get('tipoChavePix')?.valueChanges.subscribe(() => {
      this.atualizarValidacaoChavePix();
    });

    // Copiar CPF para chave PIX se tipo for CPF
    this.formulario.get('cpf')?.valueChanges.subscribe((cpf) => {
      if (this.formulario.get('tipoChavePix')?.value === TipoChavePix.CPF) {
        this.formulario.get('chavePix')?.setValue(cpf);
      }
    });
  }

  private carregarBancos(): void {
    this.corretorService.listarBancos().subscribe({
      next: (bancos) => {
        this.bancos = bancos;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar lista de bancos'
        });
      }
    });
  }

  private carregarOpcoes(): void {
    this.cargosOptions = Object.keys(CorretorCargo).map(key => ({
      label: CARGO_LABELS[key as CorretorCargo],
      value: key as CorretorCargo
    }));

    this.tiposChavePixOptions = Object.keys(TipoChavePix).map(key => ({
      label: TIPO_CHAVE_PIX_LABELS[key as TipoChavePix],
      value: key as TipoChavePix
    }));
  }

  private atualizarValidacaoChavePix(): void {
    const tipoChave = this.formulario.get('tipoChavePix')?.value;
    const chavePix = this.formulario.get('chavePix');

    chavePix?.clearValidators();
    chavePix?.addValidators(Validators.required);

    switch (tipoChave) {
      case TipoChavePix.CPF:
        chavePix?.addValidators([Validators.minLength(11), Validators.maxLength(11)]);
        // Copiar CPF automaticamente
        const cpf = this.formulario.get('cpf')?.value;
        if (cpf) {
          chavePix?.setValue(cpf);
        }
        break;
      case TipoChavePix.CELULAR:
        chavePix?.addValidators([Validators.minLength(10), Validators.maxLength(11)]);
        break;
      case TipoChavePix.EMAIL:
        chavePix?.addValidators(Validators.email);
        break;
      case TipoChavePix.CHAVE_ALEATORIA:
        chavePix?.addValidators([Validators.minLength(32), Validators.maxLength(36)]);
        break;
    }

    chavePix?.updateValueAndValidity();
  }

  onCpfInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    this.formulario.get('cpf')?.setValue(value);
  }

  onTelefoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    this.formulario.get('telefone')?.setValue(value);
  }

  formatarCpfDisplay(cpf: string): string {
    if (!cpf) return '';
    const value = cpf.replace(/\D/g, '');
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  formatarTelefoneDisplay(telefone: string): string {
    if (!telefone) return '';
    const value = telefone.replace(/\D/g, '');
    if (value.length === 11) {
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) {
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.formulario.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios corretamente'
      });
      return;
    }

    this.carregando = true;

    const corretor: CorretorDTO = {
      ...this.formulario.value,
      cpf: this.formulario.value.cpf.replace(/\D/g, ''),
      telefone: this.formulario.value.telefone.replace(/\D/g, ''),
      chavePix: this.formulario.value.chavePix.replace(/\D/g, '')
    };

    this.corretorService.cadastrar(corretor).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Corretor cadastrado com sucesso!'
        });
        this.router.navigate(['/cadastros/corretores']);
      },
      error: (error) => {
        this.carregando = false;
        let mensagem = 'Erro ao cadastrar corretor';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'CPF já cadastrado ou dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/cadastros/corretores']);
  }

  get f() {
    return this.formulario.controls;
  }
}
