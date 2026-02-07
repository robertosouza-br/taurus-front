import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ContatoService } from '../../../core/services/contato.service';
import { ContatoDTO } from '../../../core/models/contato.model';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ConfirmationAction } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-contato-publico',
  templateUrl: './contato-publico.component.html',
  styleUrls: ['./contato-publico.component.scss']
})
export class ContatoPublicoComponent extends BaseFormComponent {
  nome = '';
  email = '';
  telefone = '';
  assunto = '';
  mensagem = '';
  override salvando = false;
  override tentouSalvar = false;

  constructor(
    private contatoService: ContatoService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  enviar(): void {
    this.tentouSalvar = true;

    if (!this.validarFormulario()) {
      return;
    }

    this.confirmationService.confirm({
      action: ConfirmationAction.CUSTOM,
      title: 'Confirmar Envio',
      message: 'Deseja enviar esta mensagem?',
      confirmLabel: 'Sim, Enviar',
      cancelLabel: 'Cancelar',
      icon: 'pi pi-send',
      severity: 'success'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.enviarMensagem();
      }
    });
  }

  private enviarMensagem(): void {
    this.salvando = true;

    const contato: ContatoDTO = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      telefone: this.telefone.trim() || undefined,
      assunto: this.assunto.trim(),
      mensagem: this.mensagem.trim()
    };

    this.contatoService.enviarPublico(contato)
      .pipe(finalize(() => this.salvando = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
            life: 5000
          });
          
          // Aguarda 3 segundos para o usuário ver o toast e redireciona para o login
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        },
        error: (error) => {
          console.error('Erro ao enviar mensagem:', error);
          
          let mensagemErro = 'Erro ao enviar mensagem. Tente novamente.';
          
          if (error.status === 400 && error.error?.message) {
            mensagemErro = error.error.message;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagemErro,
            life: 5000
          });
        }
      });
  }

  limparFormulario(): void {
    this.nome = '';
    this.email = '';
    this.telefone = '';
    this.assunto = '';
    this.mensagem = '';
    this.tentouSalvar = false;
  }

  protected override getCamposObrigatorios() {
    return [
      { id: 'nome', valor: this.nome, label: 'Nome' },
      { id: 'email', valor: this.email, label: 'E-mail' },
      { id: 'assunto', valor: this.assunto, label: 'Assunto' },
      { id: 'mensagem', valor: this.mensagem, label: 'Mensagem' }
    ];
  }

  protected override exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios'
    });
  }
}
