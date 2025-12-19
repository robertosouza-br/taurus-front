import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmpreendimentoDTO, PageResponse } from '../models/empreendimento.model';
import { Unidade } from '../models/unidade.model';

@Injectable({
  providedIn: 'root'
})
export class EmpreendimentoService {
  private readonly apiUrl = `${environment.apiUrl}/empreendimentos`;

  constructor(private http: HttpClient) {}

  /**
   * Lista empreendimentos com paginação e busca
   */
  listarEmpreendimentos(
    page: number = 0,
    size: number = 50,
    search?: string
  ): Observable<PageResponse<EmpreendimentoDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<EmpreendimentoDTO>>(this.apiUrl, { params });
  }

  /**
   * Lista unidades de um empreendimento específico
   */
  listarUnidades(empreendimentoId?: string): Observable<Unidade[]> {
    let params = new HttpParams();
    if (empreendimentoId) {
      params = params.set('empreendimentoId', empreendimentoId);
    }
    
    return this.http.get<Unidade[]>(`${this.apiUrl}/unidades`, { params });
  }

  /**
   * Busca unidade específica
   */
  buscarUnidade(codigoUnidade: string, empreendimentoId?: string): Observable<Unidade> {
    let params = new HttpParams();
    if (empreendimentoId) {
      params = params.set('empreendimentoId', empreendimentoId);
    }
    
    return this.http.get<Unidade>(`${this.apiUrl}/unidades/${codigoUnidade}`, { params });
  }

  /**
   * Filtra unidades por status
   */
  filtrarPorStatus(status: string, empreendimentoId?: string): Observable<Unidade[]> {
    let params = new HttpParams().set('status', status);
    if (empreendimentoId) {
      params = params.set('empreendimentoId', empreendimentoId);
    }
    
    return this.http.get<Unidade[]>(`${this.apiUrl}/unidades/filtrar/status`, { params });
  }

  /**
   * Filtra unidades por tipo
   */
  filtrarPorTipo(tipo: string, empreendimentoId?: string): Observable<Unidade[]> {
    let params = new HttpParams().set('tipo', tipo);
    if (empreendimentoId) {
      params = params.set('empreendimentoId', empreendimentoId);
    }
    
    return this.http.get<Unidade[]>(`${this.apiUrl}/unidades/filtrar/tipo`, { params });
  }
}
