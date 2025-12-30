import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConfirmationService } from '../../services/confirmation.service';
import { ConfirmationAction } from '../confirmation-dialog/confirmation-dialog.component';

/**
 * Tipos de ação que acionam confirmação automática
 */
export type ButtonActionType = 'save' | 'delete' | 'cancel' | 'clear' | 'none';

@Component({
  selector: 'app-custom-button',
  templateUrl: './custom-button.component.html',
  styleUrl: './custom-button.component.scss'
})
export class CustomButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() severity: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() outlined: boolean = false;
  @Input() rounded: boolean = false;
  @Input() text: boolean = false;
  @Input() raised: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() tooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() iconPos: 'left' | 'right' = 'left';
  
  /**
   * Tipo de ação do botão - aciona confirmação automática
   * 
   * - 'save': Confirma antes de salvar
   * - 'delete': Confirma antes de excluir
   * - 'cancel': Confirma antes de cancelar (se requireConfirmation = true)
   * - 'clear': Confirma antes de limpar
   * - 'none': Não exibe confirmação (padrão)
   */
  @Input() actionType: ButtonActionType = 'none';
  
  /**
   * Força a exibição de confirmação mesmo para ações que normalmente não pedem
   * Útil para botão de cancelar quando há alterações não salvas
   */
  @Input() requireConfirmation: boolean = false;
  
  /**
   * Mensagem customizada para o diálogo de confirmação
   * Se não fornecida, usa a mensagem padrão da ação
   */
  @Input() confirmationMessage?: string;
  
  /**
   * Nome do item (para ação de excluir)
   * Ex: "João Silva" -> "Deseja excluir João Silva?"
   */
  @Input() itemName?: string;
  
  @Output() onClick = new EventEmitter<Event>();

  constructor(private confirmationService: ConfirmationService) {}

  handleClick(event: Event): void {
    if (this.disabled || this.loading) {
      return;
    }

    // Verifica se precisa de confirmação
    if (this.needsConfirmation()) {
      this.showConfirmation(event);
    } else {
      // Emite evento diretamente
      this.onClick.emit(event);
    }
  }

  /**
   * Verifica se a ação precisa de confirmação
   */
  private needsConfirmation(): boolean {
    // Se requireConfirmation foi explicitamente setado como true
    if (this.requireConfirmation) {
      return true;
    }

    // Ações que sempre pedem confirmação
    const alwaysConfirm: ButtonActionType[] = ['save', 'delete', 'clear'];
    return alwaysConfirm.includes(this.actionType);
  }

  /**
   * Exibe o diálogo de confirmação apropriado
   */
  private showConfirmation(event: Event): void {
    switch (this.actionType) {
      case 'save':
        this.confirmationService.confirmSave(this.confirmationMessage).subscribe(confirmed => {
          if (confirmed) this.onClick.emit(event);
        });
        break;

      case 'delete':
        this.confirmationService.confirmDelete(this.itemName || this.confirmationMessage).subscribe(confirmed => {
          if (confirmed) this.onClick.emit(event);
        });
        break;

      case 'cancel':
        this.confirmationService.confirmCancel(this.confirmationMessage).subscribe(confirmed => {
          if (confirmed) this.onClick.emit(event);
        });
        break;

      case 'clear':
        this.confirmationService.confirmClear(this.confirmationMessage).subscribe(confirmed => {
          if (confirmed) this.onClick.emit(event);
        });
        break;

      default:
        // Para 'none' ou qualquer outro caso
        this.onClick.emit(event);
        break;
    }
  }

  getButtonClass(): string {
    const classes = ['custom-btn'];
    
    if (this.outlined) classes.push('p-button-outlined');
    if (this.text) classes.push('p-button-text');
    if (this.raised) classes.push('p-button-raised');
    if (this.rounded) classes.push('p-button-rounded');
    
    classes.push(`btn-${this.size}`);
    classes.push(`p-button-${this.severity}`);
    
    return classes.join(' ');
  }
}
