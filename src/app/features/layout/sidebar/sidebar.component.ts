import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthorizationService, SidebarService, PermissaoService, AuthService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';

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
export class SidebarComponent implements OnInit {
  isExpanded = false;
  menuItems: MenuItem[] = [];

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private sidebarService: SidebarService,
    private permissaoService: PermissaoService,
    private elementRef: ElementRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeMenu();
    
    // Sincroniza com o serviço
    this.sidebarService.isExpanded$.subscribe(
      isExpanded => this.isExpanded = isExpanded
    );
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
            label: 'Usuários',
            icon: 'pi pi-user',
            routerLink: '/admin/usuarios',
            funcionalidade: Funcionalidade.USUARIO
          },
          {
            label: 'Perfis',
            icon: 'pi pi-shield',
            routerLink: '/admin/perfis',
            funcionalidade: Funcionalidade.PERFIL
          }
        ]
      },
      {
        label: 'Ajuda',
        icon: 'pi pi-question-circle',
        routerLink: '/help'
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

        // Filtra subitens recursivamente
        if (item.items && item.items.length > 0) {
          item.items = this.filterMenuItems(item.items);
          // Remove item pai se todos os filhos foram filtrados
          if (item.items.length === 0) {
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
   * Fecha menu ao clicar em item (mobile)
   */
  onMenuItemClick(): void {
    if (this.isMobile()) {
      this.sidebarService.setExpanded(false);
    }
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
   * Realiza logout do sistema
   */
  logout(): void {
    this.authService.logout();
  }
}
