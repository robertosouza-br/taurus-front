import { Injectable } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, Subject } from 'rxjs';
import { 
  ConfirmationDialogComponent, 
  ConfirmationAction, 
  ConfirmationConfig 
} from '../components/confirmation-dialog/confirmation-dialog.component';
import { MessageService } from 'primeng/api';

/**
 * Serviço para gerenciar diálogos de confirmação
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(
    private dialogService: DialogService,
    private messageService: MessageService
  ) {}

  /**
   * Abre diálogo de confirmação e retorna Observable com resultado
   */
  confirm(config: ConfirmationConfig): Observable<boolean> {
    const subject = new Subject<boolean>();
    
    // Alertas sem botão cancelar não devem ser dismissables (forçar interação)
    const dismissable = config.showCancel !== false;

    const ref: DynamicDialogRef | null = this.dialogService.open(ConfirmationDialogComponent, {
      data: config,
      header: '',
      width: '500px',
      modal: true,
      dismissableMask: dismissable,
      closable: false,
      closeOnEscape: dismissable,
      styleClass: 'confirmation-dialog-wrapper'
    });

    if (!ref) {
      console.error('[ConfirmationService] Falha ao abrir diálogo de confirmação');
      subject.next(false);
      subject.complete();
      return subject.asObservable();
    }

    ref.onClose.subscribe((confirmed: boolean) => {
      subject.next(!!confirmed);
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Confirmação para salvar (apenas confirma, não exibe toast)
   * O toast deve ser exibido pelo componente após a operação ter sucesso
   */
  confirmSave(customMessage?: string): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.SALVAR,
      message: customMessage
    });
  }

  /**
   * Confirmação para excluir
   */
  confirmDelete(itemName?: string): Observable<boolean> {
    const message = itemName 
      ? `Deseja realmente excluir "${itemName}"? Esta ação não poderá ser desfeita.`
      : 'Esta ação não poderá ser desfeita. Deseja realmente excluir?';
    
    return this.confirm({
      action: ConfirmationAction.EXCLUIR,
      message
    });
  }

  /**
   * Confirmação para incluir
   */
  confirmCreate(customMessage?: string): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.INCLUIR,
      message: customMessage
    });
  }

  /**
   * Confirmação para cancelar (quando há alterações não salvas)
   */
  confirmCancel(customMessage?: string): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.CANCELAR,
      message: customMessage
    });
  }

  /**
   * Confirmação para descartar alterações
   */
  confirmDiscard(customMessage?: string): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.DESCARTAR,
      message: customMessage
    });
  }

  /**
   * Confirmação para limpar formulário
   */
  confirmClear(customMessage?: string): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.LIMPAR,
      message: customMessage
    });
  }

  /**
   * Confirmação customizada
   */
  confirmCustom(title: string, message: string, config?: Partial<ConfirmationConfig>): Observable<boolean> {
    return this.confirm({
      action: ConfirmationAction.CUSTOM,
      title,
      message,
      ...config
    });
  }

  /**
   * Exibe alerta informativo (sem botão cancelar)
   * Útil para situações que não necessitam confirmação, apenas notificação
   */
  alert(title: string, message: string, severity: 'success' | 'info' | 'warning' | 'danger' = 'info', icon?: string): Observable<boolean> {
    const iconMap = {
      success: 'pi pi-check-circle',
      info: 'pi pi-info-circle',
      warning: 'pi pi-exclamation-triangle',
      danger: 'pi pi-times-circle'
    };

    return this.confirm({
      action: ConfirmationAction.CUSTOM,
      title,
      message,
      severity,
      icon: icon || iconMap[severity],
      confirmLabel: 'Entendi',
      showCancel: false
    });
  }
}
