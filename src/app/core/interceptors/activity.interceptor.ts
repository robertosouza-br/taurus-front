import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services';
import { SILENT_REQUEST } from '../services/meus-dados.service';

/**
 * Interceptor que registra atividade do usuário em requisições HTTP
 * Requisições marcadas com SILENT_REQUEST não contam como atividade
 */
@Injectable()
export class ActivityInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap(() => {
        // Verifica se a requisição NÃO é silenciosa
        const isSilent = request.context.get(SILENT_REQUEST);
        
        if (!isSilent && this.authService.isAuthenticated && !this.isAuthEndpoint(request.url)) {
          // Registra atividade apenas se não for uma requisição silenciosa
          this.authService.registrarAtividade();
        }
      })
    );
  }

  /**
   * Verifica se é um endpoint de autenticação
   */
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') || 
           url.includes('/auth/refresh') || 
           url.includes('/auth/recuperar-senha');
  }
}
