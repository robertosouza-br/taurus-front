import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';

/**
 * Serviço de permissões granulares
 * Gerencia validação de acesso a funcionalidades e permissões específicas
 */
@Injectable({
  providedIn: 'root'
})
export class PermissaoService {

  constructor(private authService: AuthService) {}

  /**
   * Verifica se o usuário é administrador.
   */
  private isAdministrador(): boolean {
    const usuario = this.authService.getUsuarioLogado();
    if (!usuario || !usuario.perfis) return false;
    
    return usuario.perfis.some((perfil: any) => 
      perfil.nome === 'ADMINISTRADOR' || perfil.nome === 'Administrador'
    );
  }

  /**
   * Verifica se o usuário tem acesso a uma funcionalidade.
   * Administradores têm acesso a tudo.
   */
  temFuncionalidade(funcionalidade: Funcionalidade): boolean {
    if (this.isAdministrador()) return true;

    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) return false;

    return usuario.permissoes.has(funcionalidade);
  }

  /**
   * Verifica se o usuário tem uma permissão específica em uma funcionalidade.
   * Administradores têm todas as permissões.
   */
  temPermissao(funcionalidade: Funcionalidade, permissao: Permissao): boolean {
    if (this.isAdministrador()) return true;

    const usuario = this.authService.getUsuarioLogado();
    if (!usuario) return false;

    const permissoes = usuario.permissoes.get(funcionalidade);
    return permissoes ? permissoes.has(permissao) : false;
  }

  /**
   * Verifica se o usuário tem TODAS as permissões listadas (AND).
   */
  temTodasPermissoes(funcionalidade: Funcionalidade, permissoes: Permissao[]): boolean {
    return permissoes.every(p => this.temPermissao(funcionalidade, p));
  }

  /**
   * Verifica se o usuário tem QUALQUER uma das permissões listadas (OR).
   */
  temQualquerPermissao(funcionalidade: Funcionalidade, permissoes: Permissao[]): boolean {
    return permissoes.some(p => this.temPermissao(funcionalidade, p));
  }

  /**
   * Retorna todas as permissões do usuário para uma funcionalidade.
   */
  obterPermissoes(funcionalidade: Funcionalidade): Set<Permissao> {
    const usuario = this.authService.getUsuarioLogado();
    return usuario?.permissoes.get(funcionalidade) || new Set();
  }

  /**
   * Retorna todas as funcionalidades que o usuário tem acesso.
   */
  obterFuncionalidades(): Funcionalidade[] {
    const usuario = this.authService.getUsuarioLogado();
    return usuario ? Array.from(usuario.permissoes.keys()) : [];
  }
}
