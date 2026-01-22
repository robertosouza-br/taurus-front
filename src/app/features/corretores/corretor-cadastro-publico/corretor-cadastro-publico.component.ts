import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorPublicoService } from '../../../core/services/corretor-publico.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { BancoService } from '../../../core/services/banco.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { Banco } from '../../../core/models/banco.model';
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
  bancosOptions: { label: string; value: string; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: string; banco: Banco }[] = [];
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
    private bancoService: BancoService,
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
      email: [[], [Validators.required, this.validadorEmails]], // Array para múltiplos emails
      nomeGuerra: [''],
      telefone: ['', this.validadorTelefone],
      numeroCreci: [''],
      cargo: [CorretorCargo.CORRETOR, Validators.required],
      numeroBanco: [null], // Agora aceita objeto do autocomplete
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

    // Carregar lista de bancos
    this.bancoService.listarTodos().subscribe({
      next: (bancos) => {
        this.bancosOptions = bancos.map(banco => ({
          label: `${banco.codigo} - ${banco.nome}`,
          value: banco.codigo,
          banco: banco
        }));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Não foi possível carregar a lista de bancos'
        });
      }
    });
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
   * Validador customizado de email
   */
  private validadorEmail(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(control.value) ? null : { 'emailInvalido': true };
  }

  /**
   * Validador customizado de array de emails
   */
  private validadorEmails(control: any): { [key: string]: boolean } | null {
    if (!control.value || control.value.length === 0) {
      return { 'required': true };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emailsInvalidos = control.value.filter((email: string) => !emailRegex.test(email));
    return emailsInvalidos.length > 0 ? { 'emailInvalido': true } : null;
  }

  /**
   * Validador customizado de telefone
   */
  private validadorTelefone(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null; // Telefone é opcional
    const numbers = control.value.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11 ? null : { 'telefoneInvalido': true };
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

    // Limpa validadores anteriores
    chavePix?.clearValidators();
    
    // Se tipoChavePix estiver preenchido, chavePix se torna obrigatório
    if (tipoChave) {
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
          chavePix?.addValidators(this.validadorEmail);
          break;
        case TipoChavePix.CHAVE_ALEATORIA:
          chavePix?.addValidators([Validators.minLength(32), Validators.maxLength(36)]);
          break;
      }
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

  filtrarBancos(event: any): void {
    const query = event.query.toLowerCase();
    this.bancosFiltrados = this.bancosOptions.filter(banco =>
      banco.label.toLowerCase().includes(query) ||
      banco.value.includes(query)
    );
  }

  mostrarTodosBancos(): void {
    this.bancosFiltrados = [...this.bancosOptions];
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

    // Impede cadastro se CPF é inválido
    if (this.cpfInvalido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'CPF inválido. Verifique o número digitado.'
      });
      return;
    }

    if (this.formulario.invalid) {
      // Mostra erros específicos
      const errors = [];
      
      if (this.formulario.get('nome')?.hasError('required')) {
        errors.push('Nome é obrigatório');
      } else if (this.formulario.get('nome')?.hasError('minlength')) {
        errors.push('Nome deve ter no mínimo 3 caracteres');
      }
      
      if (this.formulario.get('cpf')?.hasError('required')) {
        errors.push('CPF é obrigatório');
      }
      
      if (this.formulario.get('email')?.hasError('required')) {
        errors.push('E-mail é obrigatório');
      } else if (this.formulario.get('email')?.hasError('emailInvalido')) {
        errors.push('E-mail inválido');
      }
      
      if (this.formulario.get('telefone')?.hasError('telefoneInvalido')) {
        errors.push('Telefone inválido (mínimo 10 dígitos)');
      }
      
      if (this.formulario.get('chavePix')?.hasError('required')) {
        errors.push('Chave PIX é obrigatória quando o tipo é informado');
      }
      
      const detail = errors.length > 0 ? errors.join(', ') : 'Preencha todos os campos obrigatórios corretamente';
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: detail
      });
      return;
    }

    this.carregando = true;

    const formValue = this.formulario.value;
    const corretor: CorretorDTO = {
      nome: formValue.nome,
      cpf: formValue.cpf.replace(/\D/g, ''),
      email: Array.isArray(formValue.email) ? formValue.email.join(';') : formValue.email, // Converte array em string
      cargo: formValue.cargo,
      ativo: formValue.ativo
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (formValue.nomeGuerra) corretor.nomeGuerra = formValue.nomeGuerra;
    if (formValue.telefone) corretor.telefone = formValue.telefone.replace(/\D/g, '');
    if (formValue.numeroCreci) corretor.numeroCreci = formValue.numeroCreci;
    if (formValue.numeroBanco) {
      // Extrai o código do banco (pode ser string ou objeto do autocomplete)
      corretor.numeroBanco = typeof formValue.numeroBanco === 'string' 
        ? formValue.numeroBanco 
        : formValue.numeroBanco.value;
    }
    if (formValue.numeroAgencia) corretor.numeroAgencia = formValue.numeroAgencia;
    if (formValue.numeroContaCorrente) corretor.numeroContaCorrente = formValue.numeroContaCorrente;
    if (formValue.tipoConta) corretor.tipoConta = formValue.tipoConta;
    if (formValue.tipoChavePix) corretor.tipoChavePix = formValue.tipoChavePix;
    if (formValue.chavePix) corretor.chavePix = formValue.chavePix.replace(/\D/g, '');

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
