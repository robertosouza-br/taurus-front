import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CorretorDTO, CorretorSaidaDTO } from '../models/corretor.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de corretores
 * API pública - não requer autenticação
 * 
 * IMPORTANTE: A API RMS não suporta paginação tradicional com offset.
 * O backend busca TODOS os registros (~3496) e faz paginação em memória.
 * A primeira requisição pode ter latência de 2-3 segundos.
 */
@Injectable({
  providedIn: 'root'
})
export class CorretorService {
  private readonly baseUrl = `${environment.apiUrl}/corretores`;

  constructor(private http: HttpClient) {}

  /**
   * Lista corretores com paginação e busca
   * 
   * ATENÇÃO: A primeira requisição busca TODOS os ~3496 corretores da API RMS
   * e pode demorar 2-3 segundos. Implemente loading/spinner na UI.
   * 
   * @param page Número da página (base 0)
   * @param size Tamanho da página (padrão: 50)
   * @param search Termo de busca (nome ou CPF) - ainda não implementado
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
   * Busca corretor por CPF (usado na edição)
   * O CPF pode ser enviado com ou sem formatação
   * @param cpf CPF do corretor (ex: "029.377.527-30" ou "02937752730")
   */
  buscarPorCpf(cpf: string): Observable<CorretorDTO> {
    return this.http.get<CorretorDTO>(`${this.baseUrl}/cpf/${cpf}`);
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
}
