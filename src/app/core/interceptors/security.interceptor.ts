import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interceptor de segurança
 * Remove dados sensíveis dos logs em produção
 */
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Em produção, previne log de dados sensíveis
    if (environment.production) {
      this.disableConsoleInProduction();
    }

    return next.handle(req).pipe(
      tap(event => {
        // Remove dados sensíveis da memória após a requisição
        if (event instanceof HttpResponse) {
          this.clearSensitiveData(req);
        }
      })
    );
  }

  /**
   * Desabilita console.log em produção
   */
  private disableConsoleInProduction(): void {
    if (!window.console) {
      return;
    }

    // Sobrescreve métodos do console
    const noop = () => {};
    
    // Mantém apenas error e warn para debug crítico
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.trace = noop;
  }

  /**
   * Limpa dados sensíveis da memória
   */
  private clearSensitiveData(req: HttpRequest<any>): void {
    if (req.url.includes('/auth/login') && req.body) {
      // Tenta limpar o objeto do corpo da requisição
      if (req.body.senha) {
        delete req.body.senha;
      }
      if (req.body.password) {
        delete req.body.password;
      }
    }
  }
}
