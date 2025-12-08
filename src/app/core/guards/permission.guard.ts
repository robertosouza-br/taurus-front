import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../services';

/**
 * Guard de autorização por permissão
 * Protege rotas que requerem permissões específicas
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Obtém as permissões necessárias da configuração da rota
    const requiredPermissions = route.data['permissions'] as string[];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Verifica se o usuário possui alguma das permissões necessárias
    if (this.authorizationService.hasAnyPermission(requiredPermissions)) {
      return true;
    }

    // Não autorizado, redireciona para página de acesso negado
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
