import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/**
 * Interceptor de erro
 * Trata erros HTTP globalmente, incluindo 401 (Unauthorized) e 403 (Forbidden)
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Erro do lado do cliente
          errorMessage = `Erro: ${error.error.message}`;
        } else {
          // Erro do lado do servidor
          
          // 401 - Não autenticado: redireciona para login
          if (error.status === 401) {
            console.warn('Usuário não autenticado. Redirecionando para login...');
            this.router.navigate(['/login']);
            return throwError(() => error);
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
}
