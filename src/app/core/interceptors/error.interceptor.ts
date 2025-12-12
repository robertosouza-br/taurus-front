import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services';

/**
 * Interceptor de erro
 * Trata erros HTTP globalmente, incluindo 401 (Unauthorized) e 403 (Forbidden)
 * Implementa renovação automática de token em caso de 401
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Erro do lado do cliente
          errorMessage = `Erro: ${error.error.message}`;
        } else {
          // Erro do lado do servidor
          
          // 401 - Não autenticado: tenta renovar token
          if (error.status === 401 && !request.url.includes('/auth/login') && !request.url.includes('/auth/refresh')) {
            return this.handle401Error(request, next);
          }
          
          // 403 - Sem permissão: redireciona para página de acesso negado
          if (error.status === 403) {
            console.warn('Acesso negado. Usuário sem permissão para realizar esta ação.');
            this.router.navigate(['/acesso-negado']);
            errorMessage = error.error?.detail || error.error?.message || 'Você não tem permissão para realizar esta ação';
            console.error('Erro 403:', errorMessage);
            return throwError(() => error);
          }
          
          errorMessage = `Código: ${error.status}\nMensagem: ${error.message}`;
          
          // Extrai mensagem de erro da API se disponível
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.error?.detail) {
            errorMessage = error.error.detail;
          }
        }

        console.error('Erro HTTP:', errorMessage);
        return throwError(() => error);
      })
    );
  }

  /**
   * Trata erro 401 tentando renovar o token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.renovarToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token);
          
          // Reexecuta a requisição original com o novo token
          return next.handle(this.addToken(request, response.token));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          console.warn('Não foi possível renovar token. Redirecionando para login...');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
    } else {
      // Se já está renovando, aguarda o novo token
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }

  /**
   * Adiciona token ao header da requisição
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
