import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * Tipos de ação de confirmação
 */
export enum ConfirmationAction {
  SALVAR = 'salvar',
  EXCLUIR = 'excluir',
  INCLUIR = 'incluir',
  CANCELAR = 'cancelar',
  DESCARTAR = 'descartar',
  CUSTOM = 'custom'
}

/**
 * Configuração de confirmação
 */
export interface ConfirmationConfig {
  action: ConfirmationAction;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  severity?: 'success' | 'info' | 'warning' | 'danger';
  showCancel?: boolean;
}

/**
 * Componente de diálogo de confirmação reutilizável
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  config: ConfirmationConfig;
  title!: string;
  message!: string;
  confirmLabel!: string;
  cancelLabel!: string;
  icon!: string;
  severity!: 'success' | 'info' | 'warning' | 'danger';
  showCancel!: boolean;

  constructor(
    public ref: DynamicDialogRef,
    public dialogConfig: DynamicDialogConfig
  ) {
    this.config = this.dialogConfig.data || {};
    this.initializeDialog();
  }

  private initializeDialog(): void {
    const defaults = this.getDefaultsByAction(this.config.action);
    
    this.title = this.config.title || defaults.title || '';
    this.message = this.config.message || defaults.message || '';
    this.confirmLabel = this.config.confirmLabel || defaults.confirmLabel || 'Confirmar';
    this.cancelLabel = this.config.cancelLabel || defaults.cancelLabel || 'Cancelar';
    this.icon = this.config.icon || defaults.icon || 'pi pi-question-circle';
    this.severity = this.config.severity || defaults.severity || 'info';
    this.showCancel = this.config.showCancel !== undefined ? this.config.showCancel : true;
  }

  private getDefaultsByAction(action: ConfirmationAction): ConfirmationConfig {
    const defaults: Record<ConfirmationAction, ConfirmationConfig> = {
      [ConfirmationAction.SALVAR]: {
        action: ConfirmationAction.SALVAR,
        title: 'Confirmar alterações!',
        message: 'Deseja salvar as alterações realizadas?',
        confirmLabel: 'Salvar',
        cancelLabel: 'Cancelar',
        icon: 'pi pi-save',
        severity: 'success',
        showCancel: true
      },
      [ConfirmationAction.EXCLUIR]: {
        action: ConfirmationAction.EXCLUIR,
        title: 'Confirmar exclusão!',
        message: 'Esta ação não poderá ser desfeita. Deseja realmente excluir?',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        icon: 'pi pi-trash',
        severity: 'danger',
        showCancel: true
      },
      [ConfirmationAction.INCLUIR]: {
        action: ConfirmationAction.INCLUIR,
        title: 'Confirmar inclusão!',
        message: 'Deseja incluir este novo registro?',
        confirmLabel: 'Incluir',
        cancelLabel: 'Cancelar',
        icon: 'pi pi-plus-circle',
        severity: 'success',
        showCancel: true
      },
      [ConfirmationAction.CANCELAR]: {
        action: ConfirmationAction.CANCELAR,
        title: 'Cancelar operação!',
        message: 'Existem alterações não salvas. Deseja realmente cancelar?',
        confirmLabel: 'Sim, cancelar',
        cancelLabel: 'Não',
        icon: 'pi pi-exclamation-triangle',
        severity: 'warning',
        showCancel: true
      },
      [ConfirmationAction.DESCARTAR]: {
        action: ConfirmationAction.DESCARTAR,
        title: 'Descartar alterações!',
        message: 'As alterações realizadas serão perdidas. Deseja continuar?',
        confirmLabel: 'Descartar',
        cancelLabel: 'Manter',
        icon: 'pi pi-exclamation-triangle',
        severity: 'warning',
        showCancel: true
      },
      [ConfirmationAction.CUSTOM]: {
        action: ConfirmationAction.CUSTOM,
        title: 'Confirmação',
        message: 'Deseja confirmar esta ação?',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        icon: 'pi pi-question-circle',
        severity: 'info',
        showCancel: true
      }
    };

    return defaults[action] || defaults[ConfirmationAction.CUSTOM];
  }

  confirm(): void {
    this.ref.close(true);
  }

  cancel(): void {
    this.ref.close(false);
  }

  getIconClass(): string {
    const baseClass = 'confirmation-icon';
    return `${baseClass} ${baseClass}--${this.severity}`;
  }
}
