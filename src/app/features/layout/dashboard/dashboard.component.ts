import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, EMPTY } from 'rxjs';
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
  private readonly POLLING_INTERVAL = 60000; // 60 segundos (otimizado para produção)
  private readonly WELCOME_CARD_SESSION_KEY = 'dashboard_welcome_card_hidden';
  private isPageVisible = true;
  private readonly NOTIFICACAO_LINK_MAP: Record<string, string> = {
    '/contatos': '/cadastros/contatos/lista',
    '/cadastros/contatos': '/cadastros/contatos/lista'
  };

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Dashboard inicializado');
    this.verificarWelcomeCardVisibility();
    this.carregarDashboard();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    console.log('Dashboard destruído - parando polling');
    this.pararPolling();
  }

  /**
   * Detecta quando a aba/janela perde ou ganha foco
   * Para economizar recursos quando usuário não está visualizando
   */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.isPageVisible = !document.hidden;
    
    if (this.isPageVisible) {
      console.log('Dashboard voltou a ficar visível - retomando polling');
      // Atualiza imediatamente ao voltar
      this.carregarDashboard();
      // Reinicia polling se estava parado
      if (!this.pollingSubscription || this.pollingSubscription.closed) {
        this.iniciarPolling();
      }
    } else {
      console.log('Dashboard ficou invisível - pausando polling');
      this.pararPolling();
    }
  }

  /**
   * Carrega os dados completos do dashboard
   */
  carregarDashboard(): void {
    this.carregando = true;
    this.erro = false;

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        console.log('Dashboard carregado:', data);
        this.dashboard = data;
        this.atualizarNotificacoes(data?.notificacoes || []);
        this.estatisticas = data?.estatisticas || null;
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
   * Inicia o polling para atualizar o dashboard completo (notificações e estatísticas)
   * Polling é pausado automaticamente quando a página não está visível
   */
  private iniciarPolling(): void {
    console.log(`Polling iniciado - intervalo: ${this.POLLING_INTERVAL / 1000}s`);
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          // Só faz requisição se página estiver visível
          if (!this.isPageVisible) {
            console.log('Página invisível - pulando atualização');
            return EMPTY;
          }
          
          console.log('Atualizando dashboard via polling...');
          return this.dashboardService.getDashboard().pipe(
            catchError(error => {
              console.error('Erro ao atualizar dashboard:', error);
              // Retorna EMPTY para não emitir nada e continuar o polling
              return EMPTY;
            })
          );
        })
      )
      .subscribe(data => {
        // Sempre atualiza quando recebe dados
        console.log('Dashboard atualizado via polling:', data);
        this.dashboard = data;
        this.atualizarNotificacoes(data?.notificacoes || []);
        this.estatisticas = data?.estatisticas || null;
      });
  }

  /**
   * Para o polling quando o componente é destruído
   */
  private pararPolling(): void {
    if (this.pollingSubscription) {
      console.log('Parando polling do dashboard');
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
    this.atualizarNotificacoes([]);
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
      const linkNormalizado = this.normalizarLinkNotificacao(notificacao.link);
      this.router.navigateByUrl(linkNormalizado);
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

  /**
   * Mantém lista e contador sincronizados com a mesma fonte de dados.
   */
  private atualizarNotificacoes(notificacoes: NotificacaoDTO[]): void {
    this.notificacoes = notificacoes ?? [];
    this.notificacoesCount = this.notificacoes.length;
    console.log(`Notificações atualizadas: ${this.notificacoesCount} notificação(ões)`);
  }

  /**
   * Converte links legados recebidos da API para rotas válidas do front-end.
   */
  private normalizarLinkNotificacao(link: string): string {
    const bruto = (link ?? '').trim();

    if (!bruto) {
      return '/dashboard';
    }

    const comBarra = bruto.startsWith('/') ? bruto : `/${bruto}`;
    const [pathComQuery, hashPart = ''] = comBarra.split('#', 2);
    const [pathPart, queryPart = ''] = pathComQuery.split('?', 2);
    const pathSemBarraFinal = pathPart.replace(/\/+$/, '') || '/';
    const pathMapeado = this.NOTIFICACAO_LINK_MAP[pathSemBarraFinal] ?? pathSemBarraFinal;

    const query = queryPart ? `?${queryPart}` : '';
    const hash = hashPart ? `#${hashPart}` : '';

    return `${pathMapeado}${query}${hash}`;
  }
}
