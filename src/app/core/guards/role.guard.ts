import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../services';

/**
 * Guard de autorização por role
 * Protege rotas que requerem roles específicas
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Obtém as roles permitidas da configuração da rota
    const allowedRoles = route.data['roles'] as string[];
    
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // Verifica se o usuário possui alguma das roles permitidas
    if (this.authorizationService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // Não autorizado, redireciona para página de acesso negado
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
