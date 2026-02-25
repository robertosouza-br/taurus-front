import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

/**
 * Componente de countdown timer circular flutuante
 * Exibe uma contagem regressiva com visual de relógio
 * 
 * @example
 * ```html
 * <app-countdown-timer
 *   [duracao]="300"
 *   [autoStart]="true"
 *   mensagem="Tempo restante para finalizar"
 *   (onTimeout)="handleTimeout()">
 * </app-countdown-timer>
 * ```
 */
@Component({
  selector: 'app-countdown-timer',
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.scss']
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  /** Duração total do countdown em segundos (padrão: 5 minutos = 300s) */
  @Input() duracao: number = 300;

  /** Inicia automaticamente ao carregar o componente */
  @Input() autoStart: boolean = true;

  /** Mensagem exibida acima do timer */
  @Input() mensagem: string = 'Tempo restante';

  /** Posição do timer na tela */
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'bottom-right';

  /** Evento emitido quando o tempo acaba */
  @Output() onTimeout = new EventEmitter<void>();

  /** Evento emitido a cada segundo */
  @Output() onTick = new EventEmitter<number>();

  /** Tempo restante em segundos */
  tempoRestante: number = 0;

  /** Percentual de progresso (0-100) */
  percentualProgresso: number = 100;

  /** Tamanho do stroke-dasharray para o círculo SVG */
  dashArray: number = 283; // Circunferência do círculo (2 * π * r), onde r = 45

  /** Offset do stroke-dasharray para criar o efeito de progresso */
  dashOffset: number = 0;

  /** Timer ativo */
  private intervalo?: any;

  /** Flag indicando se o timer está pausado */
  pausado: boolean = false;

  /** Flag indicando se o timer foi iniciado */
  iniciado: boolean = false;

  ngOnInit(): void {
    this.tempoRestante = this.duracao;
    
    if (this.autoStart) {
      this.iniciar();
    }
  }

  ngOnDestroy(): void {
    this.limparIntervalo();
  }

  /**
   * Inicia o countdown
   */
  iniciar(): void {
    if (this.iniciado && !this.pausado) {
      return;
    }

    this.iniciado = true;
    this.pausado = false;
    
    this.limparIntervalo();
    
    this.intervalo = setInterval(() => {
      if (!this.pausado) {
        this.tempoRestante--;
        this.atualizarProgresso();
        this.onTick.emit(this.tempoRestante);

        if (this.tempoRestante <= 0) {
          this.tempoEsgotado();
        }
      }
    }, 1000);
  }

  /**
   * Pausa o countdown
   */
  pausar(): void {
    this.pausado = true;
  }

  /**
   * Resume o countdown
   */
  retomar(): void {
    if (this.pausado) {
      this.pausado = false;
    }
  }

  /**
   * Reseta o countdown para o valor inicial
   */
  resetar(): void {
    this.limparIntervalo();
    this.tempoRestante = this.duracao;
    this.pausado = false;
    this.iniciado = false;
    this.atualizarProgresso();
  }

  /**
   * Adiciona tempo ao countdown (em segundos)
   */
  adicionarTempo(segundos: number): void {
    this.tempoRestante += segundos;
    this.atualizarProgresso();
  }

  /**
   * Atualiza o progresso visual do círculo
   */
  private atualizarProgresso(): void {
    this.percentualProgresso = (this.tempoRestante / this.duracao) * 100;
    this.dashOffset = this.dashArray * (1 - this.percentualProgresso / 100);
  }

  /**
   * Chamado quando o tempo se esgota
   */
  private tempoEsgotado(): void {
    this.limparIntervalo();
    this.onTimeout.emit();
  }

  /**
   * Limpa o intervalo do timer
   */
  private limparIntervalo(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = undefined;
    }
  }

  /**
   * Retorna os minutos formatados (00-99)
   */
  get minutos(): string {
    return Math.floor(this.tempoRestante / 60).toString().padStart(2, '0');
  }

  /**
   * Retorna os segundos formatados (00-59)
   */
  get segundos(): string {
    return (this.tempoRestante % 60).toString().padStart(2, '0');
  }

  /**
   * Retorna a cor do timer baseada no tempo restante
   * Transição gradual: Verde → Amarelo → Vermelho
   */
  get corTimer(): string {
    const percentual = this.percentualProgresso;
    
    // Transição gradual com mais etapas para suavizar a mudança
    if (percentual > 70) {
      return '#10b981'; // Verde escuro (success) - Tempo confortável
    } else if (percentual > 50) {
      return '#34d399'; // Verde claro - Começando a diminuir
    } else if (percentual > 40) {
      return '#84cc16'; // Verde-amarelo - Transição
    } else if (percentual > 30) {
      return '#fbbf24'; // Amarelo suave - Atenção
    } else if (percentual > 20) {
      return '#f59e0b'; // Amarelo forte - Urgente
    } else if (percentual > 10) {
      return '#fb923c'; // Laranja - Crítico
    } else {
      return '#ef4444'; // Vermelho - Emergência!
    }
  }

  /**
   * Retorna a severidade para o badge
   */
  get severidade(): 'success' | 'warning' | 'danger' {
    const percentual = this.percentualProgresso;
    
    if (percentual > 50) {
      return 'success';
    } else if (percentual > 20) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  /**
   * Retorna classes CSS baseadas na posição
   */
  get positionClass(): string {
    return `countdown-timer-${this.position}`;
  }

  /**
   * Toggle pausa/retoma
   */
  togglePausa(): void {
    if (this.pausado) {
      this.retomar();
    } else {
      this.pausar();
    }
  }
}
