import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReservaDTO, ReservaCreateDTO } from '../models/reserva.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de reservas de unidades
 *
 * ENDPOINTS:
 * - GET    /api/v1/reservas?page={page}                                              → Listar todas (paginado)
 * - GET    /api/v1/reservas/{id}                                                     → Buscar por ID
 * - GET    /api/v1/reservas/empreendimento/{cod}/bloco/{bloco}/unidade/{unidade}     → Buscar por unidade
 * - GET    /api/v1/reservas/empreendimento/{cod}?page={page}                         → Listar por empreendimento
 * - POST   /api/v1/reservas                                                          → Criar reserva
 * - PUT    /api/v1/reservas/{id}                                                     → Atualizar
 * - DELETE /api/v1/reservas/{id}                                                     → Excluir
 */
@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly baseUrl = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as reservas com paginação
   * @param page Número da página (base 0)
   */
  listar(page: number = 0, size: number = 50, sort?: string): Observable<Page<ReservaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<Page<ReservaDTO>>(this.baseUrl, { params });
  }

  /**
   * Busca reserva por ID
   * @param id ID da reserva
   */
  buscarPorId(id: number): Observable<ReservaDTO> {
    return this.http.get<ReservaDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Busca reserva por unidade específica
   * @param codEmpreendimento Código do empreendimento
   * @param bloco Código do bloco
   * @param unidade Código da unidade
   */
  buscarPorUnidade(codEmpreendimento: number | string, bloco: string, unidade: string): Observable<ReservaDTO> {
    return this.http.get<ReservaDTO>(
      `${this.baseUrl}/empreendimento/${codEmpreendimento}/bloco/${bloco}/unidade/${unidade}`
    );
  }

  /**
   * Lista reservas de um empreendimento específico
   * @param codEmpreendimento Código do empreendimento
   * @param page Número da página
   */
  listarPorEmpreendimento(codEmpreendimento: number | string, page: number = 0): Observable<Page<ReservaDTO>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<Page<ReservaDTO>>(
      `${this.baseUrl}/empreendimento/${codEmpreendimento}`,
      { params }
    );
  }

  /**
   * Cria nova reserva
   * @param payload Dados da reserva
   */
  criar(payload: ReservaCreateDTO): Observable<ReservaDTO> {
    return this.http.post<ReservaDTO>(this.baseUrl, payload);
  }

  /**
   * Atualiza reserva existente
   * @param id ID da reserva
   * @param payload Dados atualizados
   */
  atualizar(id: number, payload: ReservaCreateDTO): Observable<ReservaDTO> {
    return this.http.put<ReservaDTO>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Exclui reserva
   * @param id ID da reserva
   */
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
