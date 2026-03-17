import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DadosUnidadeHeaderDTO } from '../../../core/models/proposta-fluxo.model';

/**
 * Componente de cabeçalho com dados da unidade
 * Exibido no fluxo de proposta (com ou sem steps)
 */
@Component({
  selector: 'app-proposta-header',
  templateUrl: './proposta-header.component.html',
  styleUrls: ['./proposta-header.component.scss']
})
export class PropostaHeaderComponent {
  @Input() dadosUnidade?: DadosUnidadeHeaderDTO;
  @Input() stepAtual: number = 1;
  @Input() totalSteps: number = 2; // Por enquanto 2 steps (futuramente 4)
  @Input() stepsPreenchidos: number = 1; // Quantos steps já foram preenchidos
  @Input() exibirSteps: boolean = true; // Controla se exibe ou não os steps
  @Output() stepChange = new EventEmitter<number>();

  onStepChange(index: number): void {
    const novoStep = index + 1; // p-steps usa index 0-based
    
    // Só permite navegar para steps já preenchidos ou o atual
    if (novoStep <= this.stepsPreenchidos) {
      this.stepChange.emit(novoStep);
    }
  }
}
