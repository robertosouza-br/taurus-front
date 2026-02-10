import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Unidade } from '../../../core/models/unidade.model';

/**
 * Componente de dialog para exibir detalhes da unidade
 * 
 * USO:
 * <app-unidade-detalhes-dialog
 *   [(visible)]="displayDetalhes"
 *   [unidade]="unidadeSelecionada">
 * </app-unidade-detalhes-dialog>
 */
@Component({
  selector: 'app-unidade-detalhes-dialog',
  templateUrl: './unidade-detalhes-dialog.component.html',
  styleUrls: ['./unidade-detalhes-dialog.component.scss']
})
export class UnidadeDetalhesDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  
  @Input() unidade: Unidade | null = null;

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  /**
   * Formata valor como moeda BRL
   */
  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  }

  /**
   * Formata fração ideal com 6 casas decimais
   */
  formatarFracaoIdeal(fracaoIdeal: number): string {
    return fracaoIdeal.toFixed(6);
  }

  /**
   * Retorna a severidade do status para o componente p-tag
   */
  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('disponível') || statusLower.includes('disponivel')) {
      return 'success';
    }
    
    if (statusLower.includes('vendida') || statusLower.includes('finaliza')) {
      return 'info';
    }
    
    if (statusLower.includes('reservada') || statusLower.includes('creditado')) {
      return 'warning';
    }
    
    if (statusLower.includes('indisponível') || statusLower.includes('indisponivel')) {
      return 'danger';
    }
    
    return 'secondary';
  }
}
