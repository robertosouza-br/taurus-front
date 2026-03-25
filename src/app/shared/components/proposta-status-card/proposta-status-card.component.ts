import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  StatusTelaProposta,
  PropostaStatus,
  PROPOSTA_STATUS_LABELS,
  PROPOSTA_STATUS_SEVERITY,
  STATUS_NAO_INICIADA
} from '../../../core/models/proposta-simplificada.model';

/**
 * Componente reutilizável para exibir status e ações de proposta
 * Baseado no Mapa de Integração - Status da Proposta (Escopo Inicial)
 * 
 * COMPORTAMENTO POR STATUS:
 * - Não iniciada: Exibe CTA "Iniciar proposta"
 * - Rascunho: Exibe CTAs "Continuar edição" e "Finalizar proposta"
 * - Aguardando Análise: Exibe badge de aguardando (sem ações)
 * - Aprovada Automaticamente: Exibe badge de aprovada (sem ações)
 * 
 * @example
 * <app-proposta-status-card
 *   [status]="statusAtual"
 *   [carregando]="carregando"
 *   [processando]="processando"
 *   (onIniciar)="iniciarProposta()"
 *   (onContinuar)="continuarEdicao()"
 *   (onFinalizar)="finalizarProposta()">
 * </app-proposta-status-card>
 */
@Component({
  selector: 'app-proposta-status-card',
  templateUrl: './proposta-status-card.component.html',
  styleUrls: ['./proposta-status-card.component.scss']
})
export class PropostaStatusCardComponent {
  /** Status atual da proposta (ou "NAO_INICIADA") */
  @Input() status: StatusTelaProposta = STATUS_NAO_INICIADA;
  
  /** Indica se está carregando dados */
  @Input() carregando = false;
  
  /** Indica se está processando alguma ação */
  @Input() processando = false;
  
  /** Título customizado do card (opcional) */
  @Input() titulo = 'Status da Proposta';
  
  /** Emitido ao clicar em "Iniciar proposta" */
  @Output() onIniciar = new EventEmitter<void>();
  
  /** Emitido ao clicar em "Continuar edição" */
  @Output() onContinuar = new EventEmitter<void>();
  
  /** Emitido ao clicar em "Finalizar proposta" */
  @Output() onFinalizar = new EventEmitter<void>();
  
  /** Emitido ao clicar em "Excluir proposta" */
  @Output() onExcluir = new EventEmitter<void>();

  // Exposição das constantes para o template
  readonly STATUS_NAO_INICIADA = STATUS_NAO_INICIADA;
  readonly PropostaStatus = PropostaStatus;

  /**
   * Retorna o label do status atual
   */
  getStatusLabel(): string {
    return PROPOSTA_STATUS_LABELS[this.status];
  }

  /**
   * Retorna a severity do status atual para o p-tag
   */
  getStatusSeverity(): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    return PROPOSTA_STATUS_SEVERITY[this.status];
  }

  /**
   * Verifica se deve exibir o botão "Iniciar proposta"
   */
  exibirBotaoIniciar(): boolean {
    return this.status === STATUS_NAO_INICIADA && !this.carregando;
  }

  /**
   * Verifica se deve exibir os botões de rascunho
   */
  exibirBotoesRascunho(): boolean {
    return this.status === PropostaStatus.RASCUNHO && !this.carregando;
  }

  /**
   * Verifica se deve exibir o botão "Excluir proposta"
     * Regra temporária: exclusão disponível para qualquer status já criado
   */
  exibirBotaoExcluir(): boolean {
      return !this.carregando && this.status !== STATUS_NAO_INICIADA;
  }

  /**
   * Verifica se deve exibir apenas o badge (sem ações)
   */
  exibirApenasBadge(): boolean {
      return !this.carregando
        && this.status !== STATUS_NAO_INICIADA
        && !this.exibirBotaoExcluir();
  }

  /**
   * Handler do botão "Iniciar proposta"
   */
  iniciar(): void {
    if (!this.processando) {
      this.onIniciar.emit();
    }
  }

  /**
   * Handler do botão "Continuar edição"
   */
  continuar(): void {
    if (!this.processando) {
      this.onContinuar.emit();
    }
  }

  /**
   * Handler do botão "Finalizar proposta"
   */
  finalizar(): void {
    if (!this.processando) {
      this.onFinalizar.emit();
    }
  }

  /**
   * Handler do botão "Excluir proposta"
   */
  excluir(): void {
    if (!this.processando) {
      this.onExcluir.emit();
    }
  }

  /**
   * Retorna ícone apropriado para o status
   */
  getStatusIcon(): string {
    switch (this.status) {
      case STATUS_NAO_INICIADA:
        return 'pi pi-file-plus';
      case PropostaStatus.RASCUNHO:
        return 'pi pi-file-edit';
      case PropostaStatus.AGUARDANDO_ANALISE:
        return 'pi pi-clock';
      case PropostaStatus.APROVADA_AUTOMATICAMENTE:
        return 'pi pi-check-circle';
      case PropostaStatus.APROVADA:
        return 'pi pi-check-circle';
      case PropostaStatus.REPROVADA:
        return 'pi pi-times-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  /**
   * Retorna descrição auxiliar para cada status
   */
  getStatusDescricao(): string {
    switch (this.status) {
      case STATUS_NAO_INICIADA:
        return 'Nenhuma proposta foi criada para esta reserva. Clique em "Iniciar Proposta" para começar.';
      case PropostaStatus.RASCUNHO:
        return 'A proposta está em elaboração e pode ser editada.';
      case PropostaStatus.AGUARDANDO_ANALISE:
        return 'A proposta foi criada e enviada para análise manual, pois difere da tabela padrão.';
      case PropostaStatus.APROVADA_AUTOMATICAMENTE:
        return 'A proposta foi criada e aprovada automaticamente por seguir a tabela padrão.';
      case PropostaStatus.EM_ANALISE:
        return 'A proposta está em processo de análise.';
      case PropostaStatus.APROVADA:
        return 'A proposta foi aprovada.';
      case PropostaStatus.REPROVADA:
        return 'A proposta foi reprovada.';
      default:
        return '';
    }
  }
}
