import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Banco, BancoFormDTO, BancoFiltroDTO, TipoRelatorioBanco } from '../models/banco.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de bancos
 */
@Injectable({
  providedIn: 'root'
})
export class BancoService {
  private readonly baseUrl = `${environment.apiUrl}/bancos`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos os bancos cadastrados (sem paginação)
   * Retorna lista ordenada por nome
   * Utilizado para autocomplete
   */
  listarTodos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${this.baseUrl}/todos`);
  }

  /**
   * Lista bancos com paginação e busca
   * @param filtro Filtros de busca
   */
  listar(filtro: BancoFiltroDTO): Observable<Page<Banco>> {
    let params = new HttpParams();
    
    if (filtro.page !== undefined) {
      params = params.set('page', filtro.page.toString());
    }
    if (filtro.size !== undefined) {
      params = params.set('size', filtro.size.toString());
    }
    if (filtro.search) {
      params = params.set('search', filtro.search);
    }

    return this.http.get<Page<Banco>>(this.baseUrl, { params });
  }

  /**
   * Busca banco por ID
   * @param id ID do banco
   */
  buscarPorId(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cria um novo banco
   * @param banco Dados do banco
   */
  criar(banco: BancoFormDTO): Observable<Banco> {
    return this.http.post<Banco>(this.baseUrl, banco);
  }

  /**
   * Atualiza um banco existente
   * @param id ID do banco
   * @param banco Dados atualizados
   */
  atualizar(id: number, banco: BancoFormDTO): Observable<Banco> {
    return this.http.put<Banco>(`${this.baseUrl}/${id}`, banco);
  }

  /**
   * Remove um banco
   * @param id ID do banco
   */
  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Exporta relatório de bancos
   * @param filtro Filtros para o relatório
   * @param tipoRelatorio Tipo do relatório (PDF, XLSX, CSV, TXT)
   */
  exportarRelatorio(filtro: BancoFiltroDTO, tipoRelatorio: TipoRelatorioBanco): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('tipoRelatorio', tipoRelatorio);
    
    if (filtro.search) {
      params = params.set('search', filtro.search);
    }

    return this.http.get(`${this.baseUrl}/relatorio`, {
      params,
      responseType: 'blob'
    });
  }
}
