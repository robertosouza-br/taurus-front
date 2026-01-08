import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { AuthService, SidebarService, MeusDadosService } from '../../../core/services';
import { User } from '../../../core/models';

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
  
  currentUser: User | null = null;
  isSidebarVisible = true;
  userMenuItems: MenuItem[] = [];
  menuWidth = 220;
  fotoUsuario: string | null = null;
  private refreshTimer: any = null;

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
    private meusDadosService: MeusDadosService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.carregarFotoUsuario();

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
   * Navega para o perfil do usuário
   */
  navigateToProfile(): void {
    this.router.navigate(['/meu-perfil']);
  }

  /**
   * Carrega a foto do usuário logado
   */
  private carregarFotoUsuario(): void {
    this.meusDadosService.obterFotoUrl().subscribe({
      next: (response) => {
        this.fotoUsuario = response.url;
        
        // Agenda refresh automático antes da URL expirar
        this.agendarRefreshFoto(response.expiracaoSegundos);
      },
      error: () => {
        this.fotoUsuario = null;
      }
    });
  }

  /**
   * Agenda o refresh automático da foto
   */
  private agendarRefreshFoto(expiracaoSegundos: number): void {
    // Limpa timer anterior se existir
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Renova 30 segundos antes de expirar
    const tempoParaRenovar = Math.max(1000, (expiracaoSegundos - 30) * 1000);
    
    this.refreshTimer = setTimeout(() => {
      this.carregarFotoUsuario();
    }, tempoParaRenovar);
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
   * Limpa recursos ao destruir o componente
   */
  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}
