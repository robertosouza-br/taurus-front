import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  FuncionalidadeDTO, 
  PermissaoDTO, 
  ConfiguracaoPermissaoDTO, 
  PerfilSaidaDTO,
  PerfilDTO,
  PerfilEntradaDTO
} from '../models/funcionalidade.model';
import { Page } from '../models/page.model';

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
   * Lista todos os perfis com paginação e busca
   * @param page Número da página (inicia em 0)
   * @param size Quantidade de registros por página (padrão: 50)
   * @param search Termo de busca (opcional)
   * @param sortField Campo para ordenação (opcional)
   * @param sortOrder Direção da ordenação: 1 (ASC) ou -1 (DESC) (opcional)
   */
  listarPerfis(
    page: number = 0, 
    size: number = 50, 
    search: string = '',
    sortField?: string,
    sortOrder?: number
  ): Observable<Page<PerfilDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    if (sortField && sortOrder) {
      const direction = sortOrder === -1 ? 'DESC' : 'ASC';
      params = params.set('sort', `${sortField},${direction}`);
      params = params.set('sortField', sortField);
      params = params.set('sortDirection', direction);
    }

    return this.http.get<Page<PerfilDTO>>(
      `${this.API_URL}/perfis`,
      { params }
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
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          // Tentativa de excluir perfil de sistema
          return throwError(() => ({
            status: 403,
            error: {
              message: error.error?.message || 'Perfis de sistema não podem ser excluídos'
            }
          }));
        }
        
        if (error.status === 409) {
          // Perfil com usuários vinculados
          return throwError(() => ({
            status: 409,
            error: {
              message: error.error?.message || 'Perfil possui usuários vinculados',
              quantidadeVinculos: error.error?.quantidadeVinculos || 0
            }
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Atualiza perfil com tratamento de erro para perfis de sistema
   */
  atualizarPerfilComValidacao(id: number, perfil: PerfilEntradaDTO): Observable<PerfilDTO> {
    return this.http.put<PerfilDTO>(
      `${this.API_URL}/perfis/${id}`,
      perfil
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          // Tentativa de alterar campos restritos de perfil de sistema
          return throwError(() => ({
            status: 403,
            error: {
              message: error.error?.message || 'Operação não permitida em perfil de sistema'
            }
          }));
        }
        
        return throwError(() => error);
      })
    );
  }
}
