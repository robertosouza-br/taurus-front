import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, catchError, map } from 'rxjs';
import { AuthService } from '../services';
import { UserActivityService } from '../services/user-activity.service';

/**
 * Guard de autenticação
 * Protege rotas que requerem autenticação
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private userActivityService: UserActivityService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!this.authService.isAuthenticated) {
      // Não autenticado, redireciona para login com a URL de retorno
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    const usuario = this.authService.usuarioLogadoValue;
    
    if (!usuario) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Verifica se o refresh token expirou
    const agora = new Date();
    if (usuario.refreshExpiracao <= agora) {
      console.warn('Refresh token expirado, redirecionando para login');
      this.authService.logout();
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Verifica se o access token está próximo de expirar (menos de 1 minuto)
    const umMinuto = 60 * 1000;
    const tempoRestante = usuario.expiracao.getTime() - agora.getTime();
    
    if (tempoRestante < umMinuto) {
      // Tenta renovar o token antes de permitir acesso
      return this.authService.renovarToken().pipe(
        map(() => {
          this.userActivityService.iniciarMonitoramento();
          return true;
        }),
        catchError(() => {
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return of(false);
        })
      );
    }

    // Token válido, inicia monitoramento de atividade
    this.userActivityService.iniciarMonitoramento();
    return true;
  }
}
