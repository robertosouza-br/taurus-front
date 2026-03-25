import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  PropostaAnaliseFilaDTO,
  PropostaAnaliseDetalheDTO,
  AprovarPropostaRequest,
  ReprovarPropostaRequest,
  AnaliseAcaoResponse
} from '../models/analise-proposta.model';

/**
 * Service para gerenciar o fluxo de Análise de Propostas
 * Baseado no Mapa de Integração - 25/03/2026
 *
 * Endpoints:
 * GET    /api/v1/propostas/analises          - Listar fila de análise
 * GET    /api/v1/propostas/{id}/analise      - Buscar detalhe para análise
 * POST   /api/v1/propostas/{id}/enviar-analise - Assumir/iniciar análise
 * POST   /api/v1/propostas/{id}/aprovar      - Aprovar proposta
 * POST   /api/v1/propostas/{id}/reprovar     - Reprovar proposta
 */
@Injectable({
  providedIn: 'root'
})
export class AnalisePropostaService {
  private readonly baseUrl = `${environment.apiUrl}/propostas`;

  constructor(private http: HttpClient) {}

  /**
   * Lista a fila de análise de propostas
   * GET /api/v1/propostas/analises
   *
   * @param page Número da página (base 0)
   * @param size Tamanho da página
   * @param filtro Busca por cliente, empreendimento, CPF/CNPJ ou unidade
   * @param status Filtro por status (AGUARDANDO_ANALISE e/ou EM_ANALISE)
   */
  listarFilaAnalise(
    page: number = 0,
    size: number = 20,
    filtro?: string,
    status?: string[]
  ): Observable<Page<PropostaAnaliseFilaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filtro) {
      params = params.set('filtro', filtro);
    }

    if (status?.length) {
      status.forEach(s => { params = params.append('status', s); });
    }

    return this.http.get<Page<PropostaAnaliseFilaDTO>>(`${this.baseUrl}/analises`, { params });
  }

  /**
   * Busca o detalhamento completo da proposta para análise
   * GET /api/v1/propostas/{id}/analise
   *
   * @param id ID da proposta
   */
  buscarDetalheAnalise(id: number): Observable<PropostaAnaliseDetalheDTO> {
    return this.http.get<PropostaAnaliseDetalheDTO>(`${this.baseUrl}/${id}/analise`);
  }

  /**
   * Inicia a análise da proposta (transição AGUARDANDO_ANALISE -> EM_ANALISE)
   * POST /api/v1/propostas/{id}/enviar-analise
   *
   * @param id ID da proposta
   */
  enviarParaAnalise(id: number): Observable<AnaliseAcaoResponse> {
    return this.http.post<AnaliseAcaoResponse>(`${this.baseUrl}/${id}/enviar-analise`, {});
  }

  /**
   * Aprova a proposta (transição EM_ANALISE -> APROVADA)
   * POST /api/v1/propostas/{id}/aprovar
   *
   * @param id ID da proposta
   * @param request Observações opcionais
   */
  aprovar(id: number, request?: AprovarPropostaRequest): Observable<AnaliseAcaoResponse> {
    return this.http.post<AnaliseAcaoResponse>(`${this.baseUrl}/${id}/aprovar`, request || {});
  }

  /**
   * Reprova a proposta (transição EM_ANALISE -> REPROVADA)
   * POST /api/v1/propostas/{id}/reprovar
   *
   * @param id ID da proposta
   * @param request Motivo obrigatório da reprovação
   */
  reprovar(id: number, request: ReprovarPropostaRequest): Observable<AnaliseAcaoResponse> {
    return this.http.post<AnaliseAcaoResponse>(`${this.baseUrl}/${id}/reprovar`, request);
  }
}
