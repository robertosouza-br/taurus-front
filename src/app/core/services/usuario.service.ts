import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  UsuarioEntradaDTO, 
  UsuarioSaidaDTO, 
  UsuarioAtualizacaoDTO,
  UsuarioPerfisDTO,
  AlteracaoSenhaDTO
} from '../models/usuario.model';

/**
 * Interface para resposta paginada do Spring
 */
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Serviço para gerenciamento de usuários
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Lista usuários com paginação e busca
   * @param page Número da página (0-based)
   * @param size Quantidade de registros por página
   * @param search Termo de busca (opcional)
   */
  listarUsuarios(page: number = 0, size: number = 50, search: string = ''): Observable<Page<UsuarioSaidaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Page<UsuarioSaidaDTO>>(this.apiUrl, { params });
  }

  /**
   * Busca um usuário por ID
   * @param id ID do usuário
   */
  obterUsuario(id: number): Observable<UsuarioSaidaDTO> {
    return this.http.get<UsuarioSaidaDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria um novo usuário
   * Nota: senha é gerada automaticamente pelo backend
   * @param usuario Dados do usuário
   */
  criarUsuario(usuario: UsuarioEntradaDTO): Observable<UsuarioSaidaDTO> {
    return this.http.post<UsuarioSaidaDTO>(this.apiUrl, usuario);
  }

  /**
   * Atualiza dados gerais do usuário
   * @param id ID do usuário
   * @param usuario Dados a serem atualizados
   */
  atualizarUsuario(id: number, usuario: UsuarioAtualizacaoDTO): Observable<UsuarioSaidaDTO> {
    return this.http.put<UsuarioSaidaDTO>(`${this.apiUrl}/${id}`, usuario);
  }

  /**
   * Atualiza status do usuário (ativar/inativar)
   * @param id ID do usuário
   * @param ativo Status desejado
   */
  atualizarStatus(id: number, ativo: boolean): Observable<UsuarioSaidaDTO> {
    const params = new HttpParams().set('ativo', ativo.toString());
    return this.http.put<UsuarioSaidaDTO>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  /**
   * Atualiza senha do usuário
   * @param id ID do usuário
   * @param senhas Dados de alteração de senha
   */
  atualizarSenha(id: number, senhas: AlteracaoSenhaDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/senha`, senhas);
  }

  /**
   * Vincula perfis ao usuário (substitui os perfis existentes)
   * @param id ID do usuário
   * @param perfis Lista de IDs de perfis (front envia apenas 1)
   */
  vincularPerfis(id: number, perfis: UsuarioPerfisDTO): Observable<UsuarioSaidaDTO> {
    return this.http.put<UsuarioSaidaDTO>(`${this.apiUrl}/${id}/perfis`, perfis);
  }

  /**
   * Remove um usuário
   * @param id ID do usuário
   */
  removerUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
