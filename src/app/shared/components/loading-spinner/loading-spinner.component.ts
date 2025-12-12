import { Component, Input } from '@angular/core';

/**
 * Componente de Loading Spinner centralizado
 * Utiliza a logo do sistema com animação de pulsação
 */
@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  /**
   * Tamanho do spinner
   * small: 40px, medium: 60px, large: 80px
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  /**
   * Se deve exibir overlay de fundo
   */
  @Input() overlay = false;
  
  /**
   * Mensagem opcional para exibir abaixo do spinner
   */
  @Input() message?: string;
}
