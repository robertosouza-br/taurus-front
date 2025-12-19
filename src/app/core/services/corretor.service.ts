import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CorretorDTO, CorretorSaidaDTO, Banco } from '../models/corretor.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de corretores (autenticado)
 */
@Injectable({
  providedIn: 'root'
})
export class CorretorService {
  private readonly baseUrl = `${environment.apiUrl}/corretores`;

  constructor(private http: HttpClient) {}

  /**
   * Lista corretores com paginação e busca
   * @param page Número da página (base 0)
   * @param size Tamanho da página
   * @param search Termo de busca (nome ou CPF)
   */
  listar(page: number = 0, size: number = 50, search?: string): Observable<Page<CorretorSaidaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Page<CorretorSaidaDTO>>(this.baseUrl, { params });
  }

  /**
   * Busca corretor por ID
   * @param id ID do corretor
   */
  buscarPorId(id: string): Observable<CorretorSaidaDTO> {
    return this.http.get<CorretorSaidaDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cadastra novo corretor (uso interno administrativo)
   * @param corretor Dados do corretor
   */
  cadastrar(corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.post<CorretorSaidaDTO>(this.baseUrl, corretor);
  }

  /**
   * Atualiza corretor
   * @param id ID do corretor
   * @param corretor Dados do corretor
   */
  atualizar(id: string, corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.put<CorretorSaidaDTO>(`${this.baseUrl}/${id}`, corretor);
  }

  /**
   * Exclui corretor
   * @param id ID do corretor
   */
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Lista bancos disponíveis
   */
  listarBancos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${environment.apiUrl}/bancos`);
  }
}
