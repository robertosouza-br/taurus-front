import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditoriaDTO, FiltroAuditoriaDTO } from '../models/auditoria.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gerenciar auditorias do sistema
 */
@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private apiUrl = `${environment.apiUrl}/auditorias`;

  constructor(private http: HttpClient) {}

  /**
   * Lista auditorias com filtros e paginação
   */
  listar(filtro: FiltroAuditoriaDTO = {}): Observable<Page<AuditoriaDTO>> {
    let params = new HttpParams();
    
    if (filtro.page !== undefined) {
      params = params.set('page', filtro.page.toString());
    }
    if (filtro.size !== undefined) {
      params = params.set('size', filtro.size.toString());
    }
    if (filtro.sort) {
      params = params.set('sort', filtro.sort);
    }
    if (filtro.tipoEntidade) {
      params = params.set('tipoEntidade', filtro.tipoEntidade);
    }
    if (filtro.nomeUsuario) {
      params = params.set('nomeUsuario', filtro.nomeUsuario);
    }
    if (filtro.cpfUsuario) {
      params = params.set('cpfUsuario', filtro.cpfUsuario);
    }
    if (filtro.dataInicio) {
      params = params.set('dataInicio', filtro.dataInicio);
    }
    if (filtro.dataFim) {
      params = params.set('dataFim', filtro.dataFim);
    }

    return this.http.get<Page<AuditoriaDTO>>(this.apiUrl, { params });
  }

  /**
   * Busca histórico completo de uma entidade específica
   * @param tipoEntidade Tipo da entidade (USUARIO, PERFIL, BANCO)
   * @param entidadeId ID da entidade
   */
  buscarHistoricoEntidade(tipoEntidade: string, entidadeId: number): Observable<AuditoriaDTO[]> {
    return this.http.get<AuditoriaDTO[]>(`${this.apiUrl}/${tipoEntidade}/${entidadeId}`);
  }
}
