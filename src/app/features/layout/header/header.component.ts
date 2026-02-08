import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Subscription, timer, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService, SidebarService, FotoUsuarioService } from '../../../core/services';
import { User, NotificacaoDTO } from '../../../core/models';
import { DashboardService } from '../../../core/services/dashboard.service';

/**
 * Componente Header
 * Barra superior com informações do usuário e ações
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('userMenu') userMenu!: Menu;
  @ViewChild('notificationsMenu') notificationsMenu!: Menu;
  
  currentUser: User | null = null;
  isSidebarVisible = true;
  userMenuItems: MenuItem[] = [];
  notificacoesMenuItems: MenuItem[] = [];
  notificacoes: NotificacaoDTO[] = [];
  notificacoesCount = 0;
  menuWidth = 220;
  fotoUsuario: string | null = null;
  
  private subscriptions = new Subscription();
  private readonly NOTIFICATIONS_POLLING_INTERVAL = 30000; // 30 segundos
  private readonly NOTIFICACAO_LINK_MAP: Record<string, string> = {
    '/contatos': '/cadastros/contatos/lista',
    '/cadastros/contatos': '/cadastros/contatos/lista'
  };

  get badgeNotificacoes(): string | null {
    if (this.notificacoesCount <= 0) {
      return null;
    }

    return this.notificacoesCount > 99 ? '99+' : this.notificacoesCount.toString();
  }

  get firstName(): string {
    const name = this.currentUser?.name?.trim();
    if (!name) return 'Usuário';
    const parts = name.split(/\s+/);
    return parts[0] || 'Usuário';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    private fotoUsuarioService: FotoUsuarioService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Inscreve-se para receber atualizações da foto do usuário
    // (o carregamento inicial é feito automaticamente pelo serviço)
    this.subscriptions.add(
      this.fotoUsuarioService.getFotoUrl().subscribe(
        url => this.fotoUsuario = url
      )
    );

    this.userMenuItems = [
      {
        label: 'Meus Dados',
        icon: 'pi pi-user',
        command: () => this.navigateToProfile()
      },
      {
        separator: true
      },
      {
        label: 'Sair',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];

    this.atualizarNotificacoes([]);
    this.iniciarPollingNotificacoes();
  }


  /**
   * Realiza logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Alterna visibilidade da sidebar
   */
  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  /**
   * Abre/fecha menu de notificações
   */
  toggleNotificationsMenu(event: Event): void {
    if (this.notificationsMenu) {
      this.notificationsMenu.toggle(event);
    }
  }

  /**
   * Navega para o perfil do usuário
   */
  navigateToProfile(): void {
    this.router.navigate(['/meu-perfil']);
  }

  /**
   * Abre/fecha o menu do usuário
   */
  toggleUserMenu(event: Event): void {
    if (this.userMenu) {
      this.userMenu.toggle(event);
    }
  }

  /**
   * Inicia atualização periódica das notificações do header.
   */
  private iniciarPollingNotificacoes(): void {
    this.subscriptions.add(
      timer(0, this.NOTIFICATIONS_POLLING_INTERVAL)
        .pipe(
          switchMap(() => this.dashboardService.getNotificacoes()),
          catchError(error => {
            console.error('Erro ao carregar notificações do header:', error);
            return of(this.notificacoes);
          })
        )
        .subscribe(notificacoes => {
          this.atualizarNotificacoes(notificacoes);
        })
    );
  }

  /**
   * Atualiza estado e itens do menu com base nas notificações recebidas.
   */
  private atualizarNotificacoes(notificacoes: NotificacaoDTO[]): void {
    this.notificacoes = notificacoes ?? [];
    this.notificacoesCount = this.notificacoes.length;
    this.notificacoesMenuItems = this.criarItensMenuNotificacoes(this.notificacoes);
  }

  /**
   * Cria itens de menu clicáveis para cada notificação disponível.
   */
  private criarItensMenuNotificacoes(notificacoes: NotificacaoDTO[]): MenuItem[] {
    if (!notificacoes.length) {
      return [
        {
          label: 'Sem notificações',
          icon: 'pi pi-check-circle',
          disabled: true,
          styleClass: 'notification-empty-item'
        }
      ];
    }

    const itens = notificacoes.slice(0, 8).map((notificacao) => {
      const sufixoContador = notificacao.contador > 1 ? ` (${notificacao.contador})` : '';

      return {
        label: `${notificacao.titulo}${sufixoContador}`,
        icon: notificacao.icone || 'pi pi-bell',
        title: notificacao.mensagem,
        command: () => this.navegarParaNotificacao(notificacao),
        styleClass: 'notification-item'
      } as MenuItem;
    });

    itens.push(
      { separator: true },
      {
        label: 'Ver todas no Dashboard',
        icon: 'pi pi-external-link',
        command: () => this.router.navigate(['/dashboard']),
        styleClass: 'notification-see-all'
      }
    );

    return itens;
  }

  /**
   * Navega para o destino da notificação com normalização de rotas legadas.
   */
  private navegarParaNotificacao(notificacao: NotificacaoDTO): void {
    if (!notificacao.link) {
      return;
    }

    const link = this.normalizarLinkNotificacao(notificacao.link);
    this.router.navigateByUrl(link);
    this.notificationsMenu?.hide();
  }

  /**
   * Converte links legados da API para rotas válidas do frontend.
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
  
  /**
   * Limpa recursos ao destruir o componente
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
