import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ContatoService } from '../../../core/services/contato.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { ContatoDTO, StatusContato, STATUS_CONTATO_LABELS, STATUS_CONTATO_SEVERITIES } from '../../../core/models/contato.model';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ConfirmationAction } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-contato-detalhes',
  templateUrl: './contato-detalhes.component.html',
  styleUrls: ['./contato-detalhes.component.scss']
})
export class ContatoDetalhesComponent extends BaseFormComponent implements OnInit {
  contato: ContatoDTO | null = null;
  resposta = '';
  carregando = false;
  override salvando = false;
  marcandoLida = false;
  override tentouSalvar = false;
  modoResposta = false;
  podeAlterar = false;

  breadcrumbItems: BreadcrumbItem[] = [];

  readonly StatusContato = StatusContato;
  readonly STATUS_LABELS = STATUS_CONTATO_LABELS;
  readonly STATUS_SEVERITIES = STATUS_CONTATO_SEVERITIES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contatoService: ContatoService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.verificarPermissoes();
    this.carregarContato();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Mensagens de Contato', url: '/cadastros/contatos/lista' },
      { label: 'Detalhes da Mensagem' }
    ];
  }

  private verificarPermissoes(): void {
    this.podeAlterar = this.permissaoService.temPermissao(
      Funcionalidade.CONTATO,
      Permissao.ALTERAR
    );
  }

  private carregarContato(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.voltarParaLista();
      return;
    }

    this.carregando = true;

    this.contatoService.buscarPorId(+id).subscribe({
      next: (contato) => {
        this.contato = contato;
        this.carregando = false;

        // Se contato está pendente e usuário pode alterar, marcar como lido automaticamente
        if (contato.status === StatusContato.PENDENTE && this.podeAlterar) {
          this.marcarComoLida();
        }
      },
      error: (error) => {
        console.error('Erro ao carregar contato:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar mensagem de contato'
        });
        this.carregando = false;
        this.voltarParaLista();
      }
    });
  }

  marcarComoLida(): void {
    if (!this.contato?.id || !this.podeAlterar) return;

    this.marcandoLida = true;

    this.contatoService.marcarLida(this.contato.id).subscribe({
      next: (contatoAtualizado) => {
        this.contato = contatoAtualizado;
        this.marcandoLida = false;
      },
      error: (error) => {
        console.error('Erro ao marcar como lida:', error);
        this.marcandoLida = false;
      }
    });
  }

  ativarModoResposta(): void {
    this.modoResposta = true;
    this.tentouSalvar = false;
  }

  cancelarResposta(): void {
    this.modoResposta = false;
    this.resposta = '';
    this.tentouSalvar = false;
  }

  enviarResposta(): void {
    if (!this.contato?.id || !this.podeAlterar) return;

    this.tentouSalvar = true;

    if (!this.validarFormulario()) {
      return;
    }

    this.confirmationService.confirm({
      action: ConfirmationAction.CUSTOM,
      title: 'Confirmar Envio',
      message: 'Deseja enviar esta resposta? Um email será enviado automaticamente para o remetente.',
      confirmLabel: 'Sim, Enviar',
      cancelLabel: 'Cancelar',
      icon: 'pi pi-send',
      severity: 'success'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.enviarRespostaConfirmada();
      }
    });
  }

  private enviarRespostaConfirmada(): void {
    if (!this.contato?.id) return;

    this.salvando = true;

    this.contatoService.responder(this.contato.id, { resposta: this.resposta.trim() })
      .pipe(finalize(() => this.salvando = false))
      .subscribe({
        next: (contatoAtualizado) => {
          this.contato = contatoAtualizado;
          this.modoResposta = false;
          this.resposta = '';
          this.tentouSalvar = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Resposta enviada com sucesso! Um email foi enviado para o remetente.',
            life: 5000
          });
        },
        error: (error) => {
          console.error('Erro ao enviar resposta:', error);
          
          let mensagemErro = 'Erro ao enviar resposta. Tente novamente.';
          
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

  voltarParaLista(): void {
    this.router.navigate(['/cadastros/contatos/lista']);
  }

  formatarData(data: string | undefined): string {
    if (!data) return '-';
    
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected override getCamposObrigatorios() {
    if (!this.modoResposta) return [];
    
    return [
      { id: 'resposta', valor: this.resposta, label: 'Resposta' }
    ];
  }

  protected override exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha o campo de resposta'
    });
  }

  getStatusLabel(status: StatusContato): string {
    return STATUS_CONTATO_LABELS[status];
  }

  getStatusSeverity(status: StatusContato): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    return STATUS_CONTATO_SEVERITIES[status] as 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  }
}
