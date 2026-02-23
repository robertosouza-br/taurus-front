import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Unidade, getStatusLabel, getStatusSeverity } from '../../../core/models/unidade.model';

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
   * Retorna o label do status (código -> descrição)
   */
  getStatusLabel(codigoStatus: number): string {
    return getStatusLabel(codigoStatus);
  }

  /**
   * Retorna a severidade do status para o componente p-tag
   * Atualizado: 23/02/2026 - Usando função helper do modelo
   */
  getStatusSeverity(codigoStatus: number): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return getStatusSeverity(codigoStatus);
  }
}
