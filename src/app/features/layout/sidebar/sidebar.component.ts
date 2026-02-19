import { Component, OnInit, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthorizationService, SidebarService, PermissaoService, AuthService, FotoUsuarioService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { MeusDadosDTO } from '../../../core/models/meus-dados.model';
import { MeusDadosService } from '../../../core/services/meus-dados.service';

/**
 * Item do menu
 */
interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string;
  items?: MenuItem[];
  roles?: string[];
  permissions?: string[];
  funcionalidade?: Funcionalidade; // Nova propriedade
  visible?: boolean;
  expanded?: boolean;
}

/**
 * Componente Sidebar
 * Menu lateral navegável com controle de permissões
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isExpanded = false;
  menuItems: MenuItem[] = [];
  filteredMenuItems: MenuItem[] = [];
  searchTerm: string = '';
  
  // Dados do usuário logado
  usuarioLogado: MeusDadosDTO | null = null;
  fotoUsuario: string | null = null;
  nomeAbreviado: string = '';
  
  private subscriptions = new Subscription();

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private sidebarService: SidebarService,
    private permissaoService: PermissaoService,
    private elementRef: ElementRef,
    private authService: AuthService,
    private fotoUsuarioService: FotoUsuarioService,
    private meusDadosService: MeusDadosService
  ) {}

  ngOnInit(): void {
    this.initializeMenu();
    this.carregarDadosUsuario();
    
    // Inscreve-se para receber atualizações da foto do usuário
    // (o carregamento inicial é feito automaticamente pelo serviço)
    this.subscriptions.add(
      this.fotoUsuarioService.getFotoUrl().subscribe(
        url => this.fotoUsuario = url
      )
    );
    
    // Sincroniza com o serviço
    this.subscriptions.add(
      this.sidebarService.isExpanded$.subscribe(
        isExpanded => {
          this.isExpanded = isExpanded;
          
          // Quando a sidebar abre, limpa o filtro e colapsa todos os itens
          if (isExpanded) {
            this.clearSearch();
            this.collapseAllItems();
          }
        }
      )
    );
    
    // Inicializa o menu filtrado
    this.filteredMenuItems = this.menuItems;
  }

  /**
   * Fecha sidebar ao clicar fora dela
   */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.isExpanded) return;

    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    const clickedToggleButton = (event.target as HTMLElement)?.closest('.menu-toggle');

    // Permite que o botão de toggle abra a sidebar sem fechá-la imediatamente
    if (!clickedInside && !clickedToggleButton) {
      this.sidebarService.setExpanded(false);
    }
  }

  /**
   * Inicializa o menu com controle de permissões
   */
  private initializeMenu(): void {
    const allMenuItems: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: '/dashboard'
      },
      {
        label: 'Administração',
        icon: 'pi pi-cog',
        funcionalidade: Funcionalidade.ADMINISTRACAO,
        items: [
          {
            label: 'Auditoria',
            icon: 'pi pi-history',
            routerLink: '/auditoria',
            funcionalidade: Funcionalidade.AUDITORIA
          },
          {
            label: 'Bancos',
            icon: 'pi pi-building',
            routerLink: '/bancos',
            funcionalidade: Funcionalidade.BANCO
          },
          {
            label: 'Contatos',
            icon: 'pi pi-envelope',
            routerLink: '/cadastros/contatos/lista',
            funcionalidade: Funcionalidade.CONTATO
          },
          {
            label: 'Perfis',
            icon: 'pi pi-shield',
            routerLink: '/admin/perfis',
            funcionalidade: Funcionalidade.PERFIL
          },
          {
            label: 'Usuários',
            icon: 'pi pi-user',
            routerLink: '/admin/usuarios',
            funcionalidade: Funcionalidade.USUARIO
          }
        ]
      },
      {
        label: 'Cadastros',
        icon: 'pi pi-database',
        items: [
          {
            label: 'Corretores',
            icon: 'pi pi-briefcase',
            routerLink: '/cadastros/corretores',
            funcionalidade: Funcionalidade.CORRETOR
          },
          {
            label: 'Imobiliárias',
            icon: 'pi pi-building',
            routerLink: '/imobiliarias',
            funcionalidade: Funcionalidade.IMOBILIARIA
          }
        ]
      },
      {
        label: 'Imóveis',
        icon: 'pi pi-building',
        funcionalidade: Funcionalidade.IMOVEL,
        items: [
          {
            label: 'Empreendimentos',
            icon: 'pi pi-building-columns',
            routerLink: '/empreendimentos',
            funcionalidade: Funcionalidade.EMPREENDIMENTO
          },
          {
            label: 'Reservas',
            icon: 'pi pi-bookmark',
            routerLink: '/reservas',
            funcionalidade: Funcionalidade.RESERVA
          }
        ]
      },
      {
        label: 'Meu Perfil',
        icon: 'pi pi-user',
        items: [
          {
            label: 'Meus Dados',
            icon: 'pi pi-id-card',
            routerLink: '/meu-perfil'
          }
        ]
      }
    ];

    // Filtra itens baseado em permissões e roles
    this.menuItems = this.filterMenuItems(allMenuItems);
  }

  /**
   * Filtra itens do menu baseado em permissões e roles
   */
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items
      .map(item => ({ ...item }))
      .filter(item => {
        // Para itens com subitens, filtra os subitens primeiro
        if (item.items && item.items.length > 0) {
          item.items = this.filterMenuItems(item.items);
          
          // Se tem subitens após filtrar, mostra o item pai (mesmo sem permissão direta)
          if (item.items.length > 0) {
            item.visible = true;
            return true;
          }
          
          // Se não sobrou nenhum subitem, remove o item pai
          return false;
        }

        // Para itens sem subitens, verifica permissões normalmente
        
        // Verifica funcionalidade (novo sistema de permissões)
        if (item.funcionalidade) {
          if (!this.permissaoService.temFuncionalidade(item.funcionalidade)) {
            return false;
          }
        }

        // Verifica roles (sistema legado - mantido para compatibilidade)
        if (item.roles && item.roles.length > 0) {
          if (!this.authorizationService.hasAnyRole(item.roles)) {
            return false;
          }
        }

        // Verifica permissões (sistema legado - mantido para compatibilidade)
        if (item.permissions && item.permissions.length > 0) {
          if (!this.authorizationService.hasAnyPermission(item.permissions)) {
            return false;
          }
        }

        item.visible = true;
        return true;
      });
  }

  /**
   * Alterna estado da sidebar (expandida/recolhida)
   */
  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  /**
   * Navega para uma rota
   */
  navigate(routerLink: string): void {
    this.router.navigate([routerLink]);
    
    // Fecha o menu em mobile após navegação
    if (window.innerWidth <= 768) {
      this.isExpanded = false;
    }
  }

  /**
   * Alterna expansão de um grupo de menu
   */
  toggleGroup(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  /**
   * Fecha menu ao clicar em item
   * Fecha sempre em todas as resoluções para melhor UX
   */
  onMenuItemClick(): void {
    this.sidebarService.setExpanded(false);
  }

  /**
   * Fecha sidebar (mobile)
   */
  closeSidebar(): void {
    if (this.isMobile()) {
      this.sidebarService.setExpanded(false);
    }
  }

  /**
   * Verifica se está em modo mobile
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Previne propagação de cliques no sidebar
   */
  onSidebarClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Remove acentuação de uma string
   */
  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Normaliza string para busca (remove acentos e converte para minúsculas)
   */
  private normalizeForSearch(str: string): string {
    return this.removeAccents(str.toLowerCase().trim());
  }

  /**
   * Filtra os itens do menu com base no termo de busca
   * Ignora acentuação e case sensitive
   */
  filterMenu(): void {
    const term = this.normalizeForSearch(this.searchTerm);
    
    if (!term) {
      this.filteredMenuItems = this.menuItems;
      return;
    }

    this.filteredMenuItems = this.menuItems
      .map(item => {
        const normalizedLabel = this.normalizeForSearch(item.label);
        
        // Se o item pai corresponde ao filtro
        if (normalizedLabel.includes(term)) {
          return { ...item, expanded: true }; // Expande automaticamente ao filtrar
        }

        // Se tem subitens, filtra os subitens
        if (item.items && item.items.length > 0) {
          const filteredSubItems = item.items.filter(subItem => {
            const normalizedSubLabel = this.normalizeForSearch(subItem.label);
            return normalizedSubLabel.includes(term);
          });

          if (filteredSubItems.length > 0) {
            return {
              ...item,
              items: filteredSubItems,
              expanded: true // Expande automaticamente ao filtrar
            };
          }
        }

        return null;
      })
      .filter(item => item !== null) as MenuItem[];
  }

  /**
   * Limpa o filtro de busca
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filterMenu();
  }

  /**
   * Colapsa todos os itens do menu
   */
  private collapseAllItems(): void {
    this.menuItems.forEach(item => {
      if (item.items && item.items.length > 0) {
        item.expanded = false;
      }
    });
    this.filteredMenuItems = this.menuItems;
  }

  /**
   * Carrega os dados do usuário logado
   */
  private carregarDadosUsuario(): void {
    this.meusDadosService.buscarMeusDados().subscribe({
      next: (dados: MeusDadosDTO) => {
        this.usuarioLogado = dados;
        this.nomeAbreviado = this.abreviarNome(dados.nome);
      },
      error: (error: any) => {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    });
  }

  /**
   * Retorna apenas o primeiro nome do usuário
   * Exemplo: João Silva Santos -> João
   */
  private abreviarNome(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    
    const partes = nomeCompleto.trim().split(' ').filter(p => p.length > 0);
    
    return partes[0] || '';
  }

  /**
   * Obtém o nome do primeiro perfil do usuário
   */
  get perfilPrincipal(): string {
    return this.usuarioLogado?.perfis?.[0]?.nome || 'Usuário';
  }

  /**
   * Navega para a página de Meu Perfil
   */
  irParaMeuPerfil(): void {
    this.router.navigate(['/meu-perfil']);
  }

  /**
   * Realiza logout do sistema
   */
  logout(): void {
    this.authService.logout();
  }
  
  /**
   * Limpa recursos ao destruir o componente
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
