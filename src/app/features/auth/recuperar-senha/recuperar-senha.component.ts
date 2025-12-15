import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { RecuperarSenhaService } from '../../../core/services/recuperar-senha.service';

/**
 * Componente para recuperação de senha
 * Fluxo: Solicitar código -> Validar código -> Redefinir senha
 */
@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['./recuperar-senha.component.scss']
})
export class RecuperarSenhaComponent {
  etapaAtual: 'solicitar' | 'validar' | 'redefinir' = 'solicitar';
  
  solicitarForm: FormGroup;
  validarForm: FormGroup;
  
  loading = false;
  cpfSolicitado = '';
  codigoValidado = '';
  novaSenha = '';
  confirmacaoNovaSenha = '';

  constructor(
    private fb: FormBuilder,
    private recuperarSenhaService: RecuperarSenhaService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.solicitarForm = this.fb.group({
      cpf: ['', [Validators.required, Validators.minLength(11)]]
    });

    this.validarForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  /**
   * Retorna o subtítulo baseado na etapa atual
   */
  getSubtitulo(): string {
    switch (this.etapaAtual) {
      case 'solicitar':
        return 'Digite seu CPF para receber o código de recuperação';
      case 'validar':
        return 'Digite o código enviado para seu e-mail';
      case 'redefinir':
        return 'Crie uma nova senha segura';
      default:
        return '';
    }
  }

  /**
   * Etapa 1: Solicitar código de recuperação
   */
  solicitarCodigo(): void {
    if (this.solicitarForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, preencha o CPF corretamente'
      });
      return;
    }

    this.loading = true;
    const cpf = this.solicitarForm.value.cpf.replace(/\D/g, '');
    this.cpfSolicitado = cpf;

    this.recuperarSenhaService.solicitarRecuperacao(cpf).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: response.message || 'Código de recuperação enviado para seu e-mail!',
          life: 5000
        });
        this.etapaAtual = 'validar';
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao solicitar código:', error);
        
        let mensagem = 'Erro ao solicitar recuperação de senha';
        let summary = 'Erro';
        let severity: 'error' | 'warn' = 'error';
        
        // Trata mensagens do backend (sem acentuação)
        if (error.error?.message) {
          mensagem = error.error.message;
        }
        
        // Define severidade e título baseado no status HTTP
        switch (error.status) {
          case 404:
            severity = 'warn';
            summary = 'CPF não encontrado';
            mensagem = mensagem || 'CPF não encontrado no sistema';
            break;
          case 400:
            severity = 'warn';
            summary = 'Usuário inativo';
            mensagem = mensagem || 'Usuário inativo. Entre em contato com o administrador';
            break;
          case 429:
            severity = 'error';
            summary = 'Aguarde para tentar novamente';
            mensagem = mensagem || 'Aguarde 5 minutos antes de solicitar novo código';
            break;
          default:
            severity = 'error';
            summary = 'Erro';
        }
        
        this.messageService.add({
          severity: severity,
          summary: summary,
          detail: mensagem,
          life: 6000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Etapa 2: Validar código recebido
   */
  validarCodigo(): void {
    if (this.validarForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, informe o código de 6 dígitos'
      });
      return;
    }

    this.loading = true;
    const codigo = this.validarForm.value.codigo;

    this.recuperarSenhaService.validarCodigo(this.cpfSolicitado, codigo).subscribe({
      next: () => {
        this.codigoValidado = codigo;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Código validado! Agora defina sua nova senha.'
        });
        this.etapaAtual = 'redefinir';
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao validar código:', error);
        
        let mensagem = 'Código inválido ou expirado';
        let summary = 'Erro';
        let severity: 'error' | 'warn' = 'warn';
        
        // Captura mensagem do backend
        if (error.error?.message) {
          mensagem = error.error.message;
        }
        
        // Se houver tentativas restantes, adiciona na mensagem
        if (error.error?.tentativasRestantes !== undefined) {
          mensagem += ` (${error.error.tentativasRestantes} tentativa(s) restante(s))`;
        }
        
        // Define severidade e título baseado no status HTTP
        switch (error.status) {
          case 400:
            severity = 'warn';
            summary = 'Código Inválido';
            break;
          case 410:
            severity = 'error';
            summary = 'Código Expirado';
            mensagem = mensagem || 'Código expirado. Solicite um novo código';
            break;
          case 429:
            severity = 'error';
            summary = 'Tentativas Excedidas';
            mensagem = mensagem || 'Número máximo de tentativas excedido. Solicite um novo código';
            break;
          default:
            severity = 'warn';
            summary = 'Código Inválido';
        }
        
        this.messageService.add({
          severity: severity,
          summary: summary,
          detail: mensagem,
          life: 6000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Etapa 3: Redefinir senha
   */
  redefinirSenha(): void {
    if (!this.novaSenha || this.novaSenha.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A nova senha é obrigatória'
      });
      return;
    }

    if (!this.confirmacaoNovaSenha || this.confirmacaoNovaSenha.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A confirmação da senha é obrigatória'
      });
      return;
    }

    if (this.novaSenha !== this.confirmacaoNovaSenha) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'As senhas não coincidem'
      });
      return;
    }

    // Validação de complexidade
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!regexSenha.test(this.novaSenha)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha deve conter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial (@$!%*?&#)'
      });
      return;
    }

    this.loading = true;

    this.recuperarSenhaService.redefinirSenha(
      this.cpfSolicitado,
      this.codigoValidado,
      this.novaSenha,
      this.confirmacaoNovaSenha
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Senha alterada com sucesso! Faça login com sua nova senha.',
          life: 3000
        });
        this.loading = false;
        
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        const mensagem = error.error?.message || 'Erro ao redefinir senha';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem,
          life: 5000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Mascara CPF durante digitação
   */
  onCpfInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      
      this.solicitarForm.patchValue({ cpf: value }, { emitEvent: false });
      event.target.value = value;
    }
  }

  /**
   * Permite apenas números no código
   */
  onCodigoInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    this.validarForm.patchValue({ codigo: value }, { emitEvent: false });
    event.target.value = value;
  }

  /**
   * Volta para tela de login
   */
  voltarLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Reenviar código
   */
  reenviarCodigo(): void {
    this.loading = true;
    
    this.recuperarSenhaService.solicitarRecuperacao(this.cpfSolicitado).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: response.message || 'Código reenviado para seu e-mail!',
          life: 5000
        });
        this.validarForm.reset();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao reenviar código:', error);
        
        let mensagem = 'Erro ao reenviar código';
        let summary = 'Erro';
        let severity: 'error' | 'warn' = 'warn';
        
        // Captura mensagem do backend
        if (error.error?.message) {
          mensagem = error.error.message;
        }
        
        // Define severidade e título baseado no status HTTP
        switch (error.status) {
          case 429:
            severity = 'error';
            summary = 'Aguarde para reenviar';
            mensagem = mensagem || 'Aguarde 5 minutos antes de solicitar novo código';
            break;
          case 404:
            severity = 'warn';
            summary = 'CPF não encontrado';
            break;
          case 400:
            severity = 'warn';
            summary = 'Usuário inativo';
            break;
          default:
            severity = 'warn';
            summary = 'Erro ao reenviar';
        }
        
        this.messageService.add({
          severity: severity,
          summary: summary,
          detail: mensagem,
          life: 6000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Voltar para etapa anterior
   */
  voltarEtapa(): void {
    if (this.etapaAtual === 'validar') {
      this.etapaAtual = 'solicitar';
      this.validarForm.reset();
    } else if (this.etapaAtual === 'redefinir') {
      this.etapaAtual = 'validar';
      this.novaSenha = '';
      this.confirmacaoNovaSenha = '';
    }
  }
}
