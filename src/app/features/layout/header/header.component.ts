import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService, SidebarService } from '../../../core/services';
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
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isSidebarVisible = true;
  userMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.userMenuItems = [
      {
        label: 'Perfil',
        icon: 'pi pi-user',
        command: () => this.navigateToProfile()
      },
      {
        label: 'Configurações',
        icon: 'pi pi-cog'
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
    this.router.navigate(['/users/profile']);
  }
}
