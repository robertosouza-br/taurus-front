import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services';

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
  returnUrl = '/';
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Se já estiver autenticado, redireciona
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    // Inicializa o formulário
    this.loginForm = this.formBuilder.group({
      cpf: ['', [Validators.required]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Obtém a URL de retorno dos parâmetros da query
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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

    // Para se o formulário for inválido
    if (this.loginForm.invalid) {
      console.log('Formulário inválido:', this.loginForm.errors);
      console.log('CPF errors:', this.f['cpf'].errors);
      console.log('Senha errors:', this.f['senha'].errors);
      return;
    }

    const cpfSemMascara = this.loginForm.value.cpf.replace(/\D/g, '');
    
    // Valida se tem 11 dígitos
    if (cpfSemMascara.length !== 11) {
      this.errorMessage = 'CPF deve ter 11 dígitos';
      return;
    }

    this.loading = true;

    // Remove máscara do CPF antes de enviar
    const credentials = {
      cpf: cpfSemMascara,
      senha: this.loginForm.value.senha
    };

    console.log('Enviando login:', credentials);

    this.authService.login(credentials).subscribe({
      next: () => {
        // Login bem-sucedido, redireciona
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        // Trata erro de login
        this.loading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Usuário ou senha inválidos';
        } else if (error.status === 0) {
          this.errorMessage = 'Erro ao conectar com o servidor. Verifique sua conexão.';
        } else {
          this.errorMessage = error.error?.message || 'Erro ao realizar login. Tente novamente.';
        }
      }
    });
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
   * Alterna a visibilidade da senha
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
