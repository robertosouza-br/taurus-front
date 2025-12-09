import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  FuncionalidadeDTO, 
  PermissaoDTO, 
  ConfiguracaoPermissaoDTO, 
  PerfilSaidaDTO,
  PerfilDTO,
  PerfilEntradaDTO
} from '../models/funcionalidade.model';

/**
 * Serviço para gerenciamento de Funcionalidades e Permissões
 */
@Injectable({
  providedIn: 'root'
})
export class FuncionalidadeService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as funcionalidades disponíveis no sistema
   */
  listarFuncionalidades(): Observable<FuncionalidadeDTO[]> {
    return this.http.get<FuncionalidadeDTO[]>(
      `${this.API_URL}/funcionalidades`
    );
  }

  /**
   * Obtém detalhes de uma funcionalidade específica
   */
  obterFuncionalidade(codigo: string): Observable<FuncionalidadeDTO> {
    return this.http.get<FuncionalidadeDTO>(
      `${this.API_URL}/funcionalidades/${codigo}`
    );
  }

  /**
   * Obtém permissões aplicáveis a uma funcionalidade
   */
  obterPermissoesFuncionalidade(codigo: string): Observable<PermissaoDTO[]> {
    return this.http.get<PermissaoDTO[]>(
      `${this.API_URL}/funcionalidades/${codigo}/permissoes`
    );
  }

  /**
   * Obtém o mapa completo de funcionalidades e suas permissões
   */
  obterMapaCompleto(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(
      `${this.API_URL}/funcionalidades/mapa`
    );
  }

  /**
   * Lista todas as permissões disponíveis no sistema
   */
  listarPermissoes(): Observable<PermissaoDTO[]> {
    return this.http.get<PermissaoDTO[]>(
      `${this.API_URL}/permissoes`
    );
  }

  /**
   * Obtém as permissões configuradas para um perfil
   */
  obterPermissoesPerfil(perfilId: number): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(
      `${this.API_URL}/perfis/${perfilId}/permissoes`
    );
  }

  /**
   * Configura/atualiza permissões de uma funcionalidade para um perfil
   */
  configurarPermissoes(
    perfilId: number, 
    config: ConfiguracaoPermissaoDTO
  ): Observable<PerfilSaidaDTO> {
    return this.http.put<PerfilSaidaDTO>(
      `${this.API_URL}/perfis/${perfilId}/permissoes`,
      config
    );
  }

  /**
   * Substitui todas as permissões de um perfil de uma vez (lote)
   * Limpa o mapa atual e aplica exatamente o que foi enviado
   */
  substituirPermissoesLote(
    perfilId: number,
    permissoes: Record<string, string[]>
  ): Observable<PerfilSaidaDTO> {
    return this.http.put<PerfilSaidaDTO>(
      `${this.API_URL}/perfis/${perfilId}/permissoes-lote`,
      { permissoes }
    );
  }

  /**
   * Remove uma funcionalidade completa de um perfil
   */
  removerFuncionalidade(
    perfilId: number, 
    funcionalidade: string
  ): Observable<PerfilSaidaDTO> {
    return this.http.delete<PerfilSaidaDTO>(
      `${this.API_URL}/perfis/${perfilId}/permissoes/${funcionalidade}`
    );
  }

  /**
   * Lista todos os perfis
   */
  listarPerfis(): Observable<PerfilDTO[]> {
    return this.http.get<PerfilDTO[]>(
      `${this.API_URL}/perfis`
    );
  }

  /**
   * Obtém detalhes de um perfil específico
   */
  obterPerfil(id: number): Observable<PerfilDTO> {
    return this.http.get<PerfilDTO>(
      `${this.API_URL}/perfis/${id}`
    );
  }

  /**
   * Cria um novo perfil
   */
  criarPerfil(perfil: PerfilEntradaDTO): Observable<PerfilDTO> {
    return this.http.post<PerfilDTO>(
      `${this.API_URL}/perfis`,
      perfil
    );
  }

  /**
   * Atualiza um perfil existente
   */
  atualizarPerfil(id: number, perfil: PerfilEntradaDTO): Observable<PerfilDTO> {
    return this.http.put<PerfilDTO>(
      `${this.API_URL}/perfis/${id}`,
      perfil
    );
  }

  /**
   * Exclui um perfil
   */
  excluirPerfil(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/perfis/${id}`
    );
  }
}
