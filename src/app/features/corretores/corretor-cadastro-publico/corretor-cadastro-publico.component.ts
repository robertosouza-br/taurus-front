import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorPublicoService } from '../../../core/services/corretor-publico.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, Banco, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';

@Component({
  selector: 'app-corretor-cadastro-publico',
  templateUrl: './corretor-cadastro-publico.component.html',
  styleUrls: ['./corretor-cadastro-publico.component.scss']
})
export class CorretorCadastroPublicoComponent implements OnInit {
  formulario!: FormGroup;
  carregando = false;
  submitted = false;
  bancos: Banco[] = [];
  bancosFiltrados: Banco[] = [];
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];

  constructor(
    private fb: FormBuilder,
    private corretorPublicoService: CorretorPublicoService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarBancos();
    this.carregarOpcoes();
  }

  private inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      email: ['', [Validators.required, Validators.email]],
      nomeGuerra: [''],
      telefone: [''],
      numeroCreci: [''],
      cargo: [CorretorCargo.CORRETOR, Validators.required],
      banco: [null],
      agencia: [''],
      conta: [''],
      digitoConta: [''],
      tipoChavePix: [TipoChavePix.CPF],
      chavePix: [''],
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
    this.corretorPublicoService.listarBancos().subscribe({
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

  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    // O autocomplete do PrimeNG já faz a filtragem internamente,
    // mas podemos implementar uma filtragem customizada se necessário
    // Por enquanto, não precisamos filtrar pois são poucas opções
  }

  filtrarBancos(event: any): void {
    const query = event.query.toLowerCase();
    this.bancosFiltrados = this.bancos.filter(banco => 
      banco.nome.toLowerCase().includes(query) || 
      banco.codigo.includes(query)
    );
  }

  carregarTodosBancos(): void {
    this.bancosFiltrados = [...this.bancos];
  }

  filtrarTiposChavePix(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposChavePixFiltrados = this.tiposChavePixOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
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

    this.corretorPublicoService.cadastrar(corretor).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Cadastro realizado com sucesso! Em breve você receberá um e-mail com suas credenciais de acesso.'
        });
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        this.carregando = false;
        let mensagem = 'Erro ao realizar cadastro';
        
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

  voltarLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  get f() {
    return this.formulario.controls;
  }
}
