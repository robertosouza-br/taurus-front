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
      email: ['', [Validators.required, Validators.email]],
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
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
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
   * Alterna a visibilidade da senha
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
