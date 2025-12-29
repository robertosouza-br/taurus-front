import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorPublicoService } from '../../../core/services/corretor-publico.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-corretor-cadastro-publico',
  templateUrl: './corretor-cadastro-publico.component.html',
  styleUrls: ['./corretor-cadastro-publico.component.scss']
})
export class CorretorCadastroPublicoComponent implements OnInit {
  formulario!: FormGroup;
  carregando = false;
  submitted = false;
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  
  // Controle de validação de CPF
  cpfJaCadastrado = false;
  cpfInvalido = false;
  mensagemValidacaoCpf = '';
  validandoCpf = false;

  constructor(
    private fb: FormBuilder,
    private corretorPublicoService: CorretorPublicoService,
    private usuarioService: UsuarioService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.carregarOpcoes();
    this.configurarValidacaoCpf();
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
      numeroBanco: [''],
      numeroAgencia: [''],
      numeroContaCorrente: [''],
      tipoConta: [''],
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

  /**
   * Configura validação automática de CPF com debounce
   */
  private configurarValidacaoCpf(): void {
    this.formulario.get('cpf')?.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged()
    ).subscribe(cpf => {
      if (cpf && cpf.length === 11) {
        // Valida o CPF antes de chamar o backend
        if (!this.validarCPF(cpf)) {
          this.validandoCpf = false;
          this.cpfJaCadastrado = false;
          this.cpfInvalido = true;
          this.mensagemValidacaoCpf = 'CPF inválido. Verifique o número digitado.';
          return;
        }
        this.cpfInvalido = false;
        this.validarCpfNoBackend(cpf);
      } else {
        this.limparValidacaoCpf();
      }
    });
  }

  /**
   * Valida CPF usando algoritmo de dígitos verificadores
   */
  private validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  /**
   * Valida CPF no backend
   */
  private validarCpfNoBackend(cpf: string): void {
    this.validandoCpf = true;
    this.mensagemValidacaoCpf = '';

    this.usuarioService.validarCpf(cpf).subscribe({
      next: (response) => {
        this.validandoCpf = false;
        this.cpfJaCadastrado = response.cpfCadastrado;
        this.mensagemValidacaoCpf = response.mensagem;

        if (response.cpfCadastrado) {
          // Bloqueia todos os campos exceto CPF
          Object.keys(this.formulario.controls).forEach(key => {
            if (key !== 'cpf') {
              this.formulario.get(key)?.disable();
            }
          });
        } else {
          // Habilita todos os campos
          this.formulario.enable();
        }
      },
      error: (error) => {
        this.validandoCpf = false;
        console.error('Erro ao validar CPF:', error);
        
        if (error.status === 400) {
          this.mensagemValidacaoCpf = 'CPF inválido. Verifique o número digitado.';
        } else {
          this.mensagemValidacaoCpf = 'Erro ao validar CPF. Tente novamente mais tarde.';
        }
        this.cpfJaCadastrado = false;
      }
    });
  }

  /**
   * Limpa validação de CPF
   */
  private limparValidacaoCpf(): void {
    this.cpfJaCadastrado = false;
    this.cpfInvalido = false;
    this.mensagemValidacaoCpf = '';
    this.validandoCpf = false;
    this.formulario.enable();
  }

  /**
   * Redireciona para tela de recuperar senha
   */
  recuperarSenha(): void {
    const cpf = this.formulario.get('cpf')?.value;
    this.router.navigate(['/auth/recuperar-senha'], {
      queryParams: { cpf: cpf }
    });
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

  formatarCpfDisplay(cpf: string): string {
    if (!cpf) return '';
    const value = cpf.replace(/\D/g, '');
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    // O autocomplete do PrimeNG já faz a filtragem internamente,
    // mas podemos implementar uma filtragem customizada se necessário
    // Por enquanto, não precisamos filtrar pois são poucas opções
  }

  filtrarTiposChavePix(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposChavePixFiltrados = this.tiposChavePixOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }

  onSubmit(): void {
    this.submitted = true;

    // Impede cadastro se CPF já existe
    if (this.cpfJaCadastrado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Este CPF já está cadastrado. Utilize a opção "Recuperar Senha".'
      });
      return;
    }

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
