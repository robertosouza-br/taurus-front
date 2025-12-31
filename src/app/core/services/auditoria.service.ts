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
    if (filtro.entidade) {
      params = params.set('entidade', filtro.entidade);
    }
    if (filtro.usuario) {
      params = params.set('usuario', filtro.usuario);
    }
    if (filtro.dataInicio) {
      params = params.set('dataInicio', filtro.dataInicio);
    }
    if (filtro.dataFim) {
      params = params.set('dataFim', filtro.dataFim);
    }
    if (filtro.tipoOperacao) {
      params = params.set('tipoOperacao', filtro.tipoOperacao);
    }

    return this.http.get<Page<AuditoriaDTO>>(this.apiUrl, { params });
  }

  /**
   * Busca auditoria por ID
   */
  buscarPorId(id: number): Observable<AuditoriaDTO> {
    return this.http.get<AuditoriaDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca histórico completo de uma entidade
   */
  buscarHistoricoEntidade(nomeEntidade: string, idEntidade: number): Observable<AuditoriaDTO[]> {
    return this.http.get<AuditoriaDTO[]>(`${this.apiUrl}/entidade/${nomeEntidade}/${idEntidade}`);
  }
}
