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
    
    const ref: DynamicDialogRef = this.dialogService.open(ConfirmationDialogComponent, {
      data: config,
      header: '',
      width: '500px',
      modal: true,
      dismissableMask: true,
      closable: false,
      closeOnEscape: true,
      styleClass: 'confirmation-dialog-wrapper'
    });

    ref.onClose.subscribe((confirmed: boolean) => {
      subject.next(!!confirmed);
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Confirmação para salvar com toast automático
   */
  confirmSave(customMessage?: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.confirm({
        action: ConfirmationAction.SALVAR,
        message: customMessage
      }).subscribe(confirmed => {
        if (confirmed) {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Alteração realizada com sucesso!'
          });
        }
        observer.next(confirmed);
        observer.complete();
      });
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
}
