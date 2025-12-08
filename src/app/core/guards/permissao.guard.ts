import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PermissaoService } from '../services/permissao.service';
import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';

/**
 * Guard para proteção de rotas baseado em permissões granulares
 * 
 * Uso na rota:
 * {
 *   path: 'vendas',
 *   component: VendasComponent,
 *   canActivate: [PermissaoGuard],
 *   data: {
 *     funcionalidade: Funcionalidade.VENDA,
 *     permissoes: [Permissao.CONSULTAR],
 *     qualquerPermissao: false // true = OR, false = AND (padrão)
 *   }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PermissaoGuard  {

  constructor(
    private permissaoService: PermissaoService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const funcionalidade = route.data['funcionalidade'] as Funcionalidade;
    const permissoes = route.data['permissoes'] as Permissao[];
    const qualquerPermissao = route.data['qualquerPermissao'] as boolean;

    if (!funcionalidade) {
      console.warn('Guard de permissão configurado sem funcionalidade');
      return true;
    }

    // Verifica se tem a funcionalidade
    if (!this.permissaoService.temFuncionalidade(funcionalidade)) {
      return this.router.createUrlTree(['/acesso-negado']);
    }

    // Se não especificou permissões, apenas a funcionalidade é suficiente
    if (!permissoes || permissoes.length === 0) {
      return true;
    }

    // Verifica permissões
    const temPermissao = qualquerPermissao
      ? this.permissaoService.temQualquerPermissao(funcionalidade, permissoes)
      : this.permissaoService.temTodasPermissoes(funcionalidade, permissoes);

    if (!temPermissao) {
      return this.router.createUrlTree(['/acesso-negado']);
    }

    return true;
  }
}
