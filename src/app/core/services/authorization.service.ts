import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../models';

/**
 * Serviço de autorização
 * Gerencia permissões e roles do usuário
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  constructor(private authService: AuthService) {}

  /**
   * Verifica se o usuário é administrador.
   */
  private isAdministrador(): boolean {
    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) return false;
    
    return usuario.perfis?.some(perfil => 
      perfil.nome === 'ADMINISTRADOR' || perfil.nome === 'Administrador'
    ) || false;
  }

  /**
   * Verifica se o usuário possui uma role específica
   * Administradores têm acesso total.
   * @param role Role a ser verificada
   * @returns true se o usuário possui a role
   */
  hasRole(role: string): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Verifica se o usuário possui pelo menos uma das roles fornecidas
   * Administradores têm acesso total.
   * @param roles Array de roles
   * @returns true se o usuário possui ao menos uma role
   */
  hasAnyRole(roles: string[]): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return roles.some(role => user?.roles?.includes(role)) ?? false;
  }

  /**
   * Verifica se o usuário possui todas as roles fornecidas
   * Administradores têm acesso total.
   * @param roles Array de roles
   * @returns true se o usuário possui todas as roles
   */
  hasAllRoles(roles: string[]): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return roles.every(role => user?.roles?.includes(role)) ?? false;
  }

  /**
   * Verifica se o usuário possui uma permissão específica
   * Administradores têm todas as permissões.
   * @param permission Permissão a ser verificada
   * @returns true se o usuário possui a permissão
   */
  hasPermission(permission: string): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return user?.permissions?.includes(permission) ?? false;
  }

  /**
   * Verifica se o usuário possui pelo menos uma das permissões fornecidas
   * Administradores têm todas as permissões.
   * @param permissions Array de permissões
   * @returns true se o usuário possui ao menos uma permissão
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return permissions.some(permission => user?.permissions?.includes(permission)) ?? false;
  }

  /**
   * Verifica se o usuário possui todas as permissões fornecidas
   * Administradores têm todas as permissões.
   * @param permissions Array de permissões
   * @returns true se o usuário possui todas as permissões
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (this.isAdministrador()) return true;
    const user = this.authService.currentUserValue;
    return permissions.every(permission => user?.permissions?.includes(permission)) ?? false;
  }

  /**
   * Obtém todas as roles do usuário atual
   */
  getUserRoles(): string[] {
    return this.authService.currentUserValue?.roles ?? [];
  }

  /**
   * Obtém todas as permissões do usuário atual
   */
  getUserPermissions(): string[] {
    return this.authService.currentUserValue?.permissions ?? [];
  }
}
