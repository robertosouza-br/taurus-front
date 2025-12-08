import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthorizationService, SidebarService } from '../../../core/services';

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
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.initializeMenu();
    
    // Sincroniza com o serviço
    this.sidebarService.isExpanded$.subscribe(
      isExpanded => this.isExpanded = isExpanded
    );
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
        label: 'Usuários',
        icon: 'pi pi-users',
        routerLink: '/users',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        label: 'Relatórios',
        icon: 'pi pi-chart-bar',
        items: [
          {
            label: 'Vendas',
            icon: 'pi pi-dollar',
            routerLink: '/reports/sales',
            permissions: ['VIEW_SALES_REPORTS']
          },
          {
            label: 'Financeiro',
            icon: 'pi pi-money-bill',
            routerLink: '/reports/financial',
            permissions: ['VIEW_FINANCIAL_REPORTS']
          },
          {
            label: 'Auditoria',
            icon: 'pi pi-history',
            routerLink: '/reports/audit',
            roles: ['ADMIN']
          }
        ]
      },
      {
        label: 'Configurações',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Geral',
            icon: 'pi pi-sliders-h',
            routerLink: '/settings/general'
          },
          {
            label: 'Segurança',
            icon: 'pi pi-shield',
            routerLink: '/settings/security',
            roles: ['ADMIN']
          },
          {
            label: 'Notificações',
            icon: 'pi pi-bell',
            routerLink: '/settings/notifications'
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
        // Verifica roles
        if (item.roles && item.roles.length > 0) {
          if (!this.authorizationService.hasAnyRole(item.roles)) {
            return false;
          }
        }

        // Verifica permissões
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
}
