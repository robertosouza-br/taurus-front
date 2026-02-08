import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardDTO, NotificacaoDTO, EstatisticasDTO, PRIORIDADE_SEVERITY_MAP } from '../../../core/models/dashboard.model';

/**
 * Componente Dashboard
 * Página inicial após login com estatísticas e notificações
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard: DashboardDTO | null = null;
  notificacoes: NotificacaoDTO[] = [];
  estatisticas: EstatisticasDTO | null = null;
  notificacoesCount = 0;
  carregando = false;
  erro = false;

  // Controle de visibilidade das seções
  mostrarNotificacoes = true;
  mostrarEstatisticas = true;
  mostrarInfo = true;
  mostrarWelcomeCard = true;

  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 30000; // 30 segundos
  private readonly WELCOME_CARD_SESSION_KEY = 'dashboard_welcome_card_hidden';

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarWelcomeCardVisibility();
    this.carregarDashboard();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  /**
   * Carrega os dados completos do dashboard
   */
  carregarDashboard(): void {
    this.carregando = true;
    this.erro = false;

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.notificacoes = data.notificacoes;
        this.estatisticas = data.estatisticas;
        this.notificacoesCount = data.notificacoes.length;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dashboard:', error);
        this.erro = true;
        this.carregando = false;
        this.usarValoresPadrao();
      }
    });
  }

  /**
   * Inicia o polling para atualizar o contador de notificações
   */
  private iniciarPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => this.dashboardService.getNotificacoesCount()),
        catchError(error => {
          console.error('Erro ao atualizar contador de notificações:', error);
          return of(0);
        })
      )
      .subscribe(count => {
        this.notificacoesCount = count;
      });
  }

  /**
   * Para o polling quando o componente é destruído
   */
  private pararPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Usa valores padrão em caso de erro
   */
  private usarValoresPadrao(): void {
    this.estatisticas = {
      contatosPendentes: 0,
      contatosNaoLidos: 0,
      usuariosAtivos: 0,
      corretoresCadastrados: 0,
      empreendimentosDisponiveis: 0,
      acessosHoje: 0
    };
    this.notificacoes = [];
    this.notificacoesCount = 0;
  }

  /**
   * Retorna a severidade PrimeNG baseada na prioridade da notificação
   */
  getSeverity(notificacao: NotificacaoDTO): 'success' | 'info' | 'warning' | 'danger' {
    return PRIORIDADE_SEVERITY_MAP[notificacao.prioridade];
  }

  /**
   * Navega para o link da notificação
   */
  navegarParaNotificacao(notificacao: NotificacaoDTO): void {
    if (notificacao.link) {
      this.router.navigate([notificacao.link]);
    }
  }

  /**
   * Recarrega os dados do dashboard
   */
  recarregar(): void {
    this.carregarDashboard();
  }

  /**
   * Alterna a visibilidade da seção de notificações
   */
  toggleNotificacoes(): void {
    this.mostrarNotificacoes = !this.mostrarNotificacoes;
  }

  /**
   * Alterna a visibilidade da seção de estatísticas
   */
  toggleEstatisticas(): void {
    this.mostrarEstatisticas = !this.mostrarEstatisticas;
  }

  /**
   * Alterna a visibilidade da seção de informações
   */
  toggleInfo(): void {
    this.mostrarInfo = !this.mostrarInfo;
  }

  /**
   * Verifica no sessionStorage se o card de boas-vindas deve ser exibido
   * sessionStorage é limpo ao fechar a aba/janela
   */
  private verificarWelcomeCardVisibility(): void {
    const hidden = sessionStorage.getItem(this.WELCOME_CARD_SESSION_KEY);
    this.mostrarWelcomeCard = hidden !== 'true';
  }

  /**
   * Fecha o card de boas-vindas e salva a preferência apenas para esta sessão
   * O card reaparecerá ao abrir nova aba/janela
   */
  fecharWelcomeCard(): void {
    this.mostrarWelcomeCard = false;
    sessionStorage.setItem(this.WELCOME_CARD_SESSION_KEY, 'true');
  }
}
