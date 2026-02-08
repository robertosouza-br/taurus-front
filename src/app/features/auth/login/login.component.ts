import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services';
import { UserActivityService } from '../../../core/services/user-activity.service';
import { SidebarService } from '../../../core/services/sidebar.service';

/**
 * Componente de Login
 * Tela de autenticação do usuário
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  tipoErro: 'credenciais' | 'bloqueado' | 'generico' | 'inatividade' | null = null;
  mostrarBotaoSuporte = true; // TESTE: sempre true para ver a animação
  returnUrl = '/dashboard';
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userActivityService: UserActivityService,
    private sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Se já estiver autenticado, redireciona
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }

    // Inicializa o formulário
    this.loginForm = this.formBuilder.group({
      cpf: ['', [Validators.required, this.cpfMinLengthValidator]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Obtém a URL de retorno dos parâmetros da query
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Verifica se há mensagem de logout (ex: inatividade)
    const mensagem = this.route.snapshot.queryParams['mensagem'];
    if (mensagem) {
      this.errorMessage = mensagem;
      // Define tipo especial para mensagem de inatividade ou sessão expirada
      if (mensagem.toLowerCase().includes('inatividade') || 
          mensagem.toLowerCase().includes('desconectado') ||
          mensagem.toLowerCase().includes('sessão expirou') ||
          mensagem.toLowerCase().includes('expirou')) {
        this.tipoErro = 'inatividade';
      }
    }
  }

  ngAfterViewInit(): void {
    // Detecta autofill do navegador
    setTimeout(() => {
      const inputs = this.elementRef.nativeElement.querySelectorAll('input');
      inputs.forEach((input: HTMLInputElement) => {
        if (input.matches(':-webkit-autofill')) {
          const label = input.parentElement?.querySelector('label');
          if (label) {
            label.classList.add('p-label-active');
          }
        }
      });
    }, 100);
  }

  /**
   * Getter para facilitar acesso aos campos do formulário no template
   */
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Submete o formulário de login
   */
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.loginForm.markAllAsTouched();

    // Remove apenas erros manuais de credenciais inválidas e preserva validações obrigatórias
    this.removeManualInvalidErrors('cpf');
    this.removeManualInvalidErrors('senha');
    this.loginForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    // Para se o formulário for inválido
    if (this.loginForm.invalid) {
      console.log('Formulário inválido:', this.loginForm.errors);
      console.log('CPF errors:', this.f['cpf'].errors);
      console.log('Senha errors:', this.f['senha'].errors);
      return;
    }

    const cpfSemMascara = this.loginForm.value.cpf.replace(/\D/g, '');

    this.loading = true;

    // Remove máscara do CPF antes de enviar
    const credentials = {
      cpf: cpfSemMascara,
      senha: this.loginForm.value.senha
    };
    this.authService.login(credentials).subscribe({
      next: () => {
        // Login bem-sucedido, inicia monitoramento de atividade e fecha sidebar
        this.userActivityService.iniciarMonitoramento();
        this.sidebarService.setExpanded(false);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.tratarErro(error);
      }
    });
  }

  /**
   * Limpa erro manual "invalido" sem afetar required/minLength
   */
  private removeManualInvalidErrors(controlName: 'cpf' | 'senha') {
    const control = this.loginForm.get(controlName);
    if (!control || !control.errors) return;
    if (!control.errors['invalido']) return;

    // Mantém demais erros (required/minlength)
    const { invalido, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  /**
   * Formata CPF com máscara enquanto digita
   */
  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    // Aplica a formatação
    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }
    
    input.value = valor;
    this.loginForm.patchValue({ cpf: valor }, { emitEvent: false });
  }

  /**
   * Valida CPF com 11 dígitos, mas só quando há valor (permite que o obrigatório seja exibido primeiro)
   */
  cpfMinLengthValidator = (control: AbstractControl) => {
    const raw = (control.value || '') as string;
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    return digits.length === 11 ? null : { minlengthCpf: true };
  };

  /**
   * Alterna a visibilidade da senha
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Trata os erros de autenticação
   */
  private tratarErro(error: any): void {
    console.log('Erro completo:', error);
    console.log('Status:', error.status);
    console.log('Error.error:', error.error);
    
    this.errorMessage = '';
    this.tipoErro = null;
    this.mostrarBotaoSuporte = false;

    // HttpErrorResponse do Angular encapsula assim:
    // error.status = código HTTP
    // error.error = corpo da resposta do backend
    const status = error?.status;
    const backendError = error?.error;
    const mensagem = backendError?.message || error?.message || '';

    if (status === 401) {
      // CPF ou senha incorretos
      this.tipoErro = 'credenciais';
      // Usa a mensagem do backend
      this.errorMessage = mensagem;
      this.loginForm.get('cpf')?.setErrors({ invalido: true });
      this.loginForm.get('senha')?.setErrors({ invalido: true });

    } else if (status === 403) {
      // Acesso bloqueado
      this.tipoErro = 'bloqueado';
      this.mostrarBotaoSuporte = true;

      if (mensagem.includes('Usuario inativo')) {
        this.errorMessage = mensagem;
      } else if (mensagem.includes('Perfil de acesso inativo')) {
        this.errorMessage = mensagem;
      } else if (mensagem.includes('sem perfis ativos')) {
        this.errorMessage = mensagem;
      } else {
        this.errorMessage = mensagem || 'Acesso negado. Entre em contato com o administrador.';
      }

      // Desabilitar formulário
      this.loginForm.disable();

    } else if (status === 0) {
      // Erro de conexão (status 0 significa que não conseguiu conectar)
      this.tipoErro = 'generico';
      this.errorMessage = 'Erro ao conectar com o servidor. Verifique sua conexão.';

    } else {
      // Erro genérico (500, timeout, etc)
      this.tipoErro = 'generico';
      this.errorMessage = mensagem || 'Erro ao realizar login. Tente novamente mais tarde.';
    }
  }

  /**
   * Abre contato com suporte
   */
  falarComSuporte(): void {
    // Implementar lógica para contato com suporte
    window.location.href = 'mailto:suporte@taurus.com.br?subject=Problema de Acesso - Sistema Taurus';
  }

  /**
   * Limpa erros e reabilita formulário
   */
  limparErros(): void {
    this.errorMessage = '';
    this.tipoErro = null;
    this.mostrarBotaoSuporte = false;
    this.loginForm.enable();
    this.loginForm.get('cpf')?.setErrors(null);
    this.loginForm.get('senha')?.setErrors(null);
  }
}
