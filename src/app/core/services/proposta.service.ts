import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  ReservaPropostaDTO,
  PropostaCompletaResponse,
  CriarPropostaRequest,
  CriarPropostaResponse
} from '../models/proposta-fluxo.model';

/**
 * Service para gerenciar o fluxo de Proposta Multi-Step
 * Baseado no Mapa de Integração v2.0 - 10/03/2026
 * 
 * ENDPOINT PRINCIPAL:
 * GET /api/v1/propostas/{reservaId}/completo
 */
@Injectable({
  providedIn: 'root'
})
export class PropostaService {
  private readonly baseUrl = `${environment.apiUrl}/propostas`;

  constructor(private http: HttpClient) {}

  // ========================
  // LISTAGEM DE RESERVAS
  // ========================

  /**
   * Lista todas as reservas elegíveis para criação de proposta
   * GET /api/v1/propostas/reservas
   * 
   * @param page Número da página (default: 0)
   * @param size Tamanho da página (default: 10)
   * @param nomeCliente Filtro por nome do cliente (opcional)
   * @param nomeEmpreendimento Filtro por nome do empreendimento (opcional)
   * @param status Filtro por status da reserva (opcional)
   */
  listarReservasParaProposta(
    page: number = 0,
    size: number = 10,
    nomeCliente?: string,
    nomeEmpreendimento?: string,
    status?: string
  ): Observable<Page<ReservaPropostaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (nomeCliente) {
      params = params.set('nomeCliente', nomeCliente);
    }

    if (nomeEmpreendimento) {
      params = params.set('nomeEmpreendimento', nomeEmpreendimento);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Page<ReservaPropostaDTO>>(`${this.baseUrl}/reservas`, { params });
  }

  // ========================
  // ENDPOINT PRINCIPAL (RECOMENDADO)
  // ========================

  /**
   * ⭐ ENDPOINT PRINCIPAL ⭐
   * Busca TODOS os dados necessários para criação/edição da proposta
   * em UMA ÚNICA requisição
   * 
   * GET /api/v1/propostas/{reservaId}/completo
   * 
   * Retorna:
   * - Cabeçalho (dados da unidade)
   * - Step 1 (dados iniciais pré-preenchidos da reserva)
   * - Step 2 (dados do cliente a serem preenchidos)
   * - Metadata (se proposta já existe)
   * 
   * @param reservaId ID da reserva
   */
  buscarDadosCompletos(reservaId: number): Observable<PropostaCompletaResponse> {
    return this.http.get<PropostaCompletaResponse>(`${this.baseUrl}/${reservaId}/completo`);
  }

  // ========================
  // CRIAR/ATUALIZAR PROPOSTA
  // ========================

  /**
   * Cria uma nova proposta
   * POST /api/v1/propostas
   * 
   * Salva TODOS os dados de uma vez (após preencher todos os steps)
   * 
   * @param dados Dados completos da proposta (Step 2)
   * @returns Observable<CriarPropostaResponse> - 201 Created
   */
  criarProposta(dados: CriarPropostaRequest): Observable<CriarPropostaResponse> {
    return this.http.post<CriarPropostaResponse>(this.baseUrl, dados);
  }

  /**
   * Atualiza uma proposta existente
   * PUT /api/v1/propostas/{id}
   * 
   * @param propostaId ID da proposta
   * @param dados Dados completos da proposta (Step 2)
   * @returns Observable<CriarPropostaResponse> - 200 OK
   */
  atualizarProposta(
    propostaId: number,
    dados: CriarPropostaRequest
  ): Observable<CriarPropostaResponse> {
    return this.http.put<CriarPropostaResponse>(`${this.baseUrl}/${propostaId}`, dados);
  }

  /**
   * Busca uma proposta por ID
   * GET /api/v1/propostas/{id}
   * 
   * @param propostaId ID da proposta
   */
  buscarPropostaPorId(propostaId: number): Observable<CriarPropostaResponse> {
    return this.http.get<CriarPropostaResponse>(`${this.baseUrl}/${propostaId}`);
  }

  /**
   * Busca a proposta vinculada a uma reserva
   * GET /api/v1/propostas/reserva/{reservaId}
   * 
   * @param reservaId ID da reserva
   */
  buscarPropostaPorReserva(reservaId: number): Observable<CriarPropostaResponse> {
    return this.http.get<CriarPropostaResponse>(`${this.baseUrl}/reserva/${reservaId}`);
  }

  /**
   * Lista todas as propostas com paginação
   * GET /api/v1/propostas
   * 
   * @param page Número da página (default: 0)
   * @param size Tamanho da página (default: 20)
   * @param filtro Filtro de busca (nome cliente, empreendimento)
   */
  listarPropostas(
    page: number = 0,
    size: number = 20,
    filtro?: string
  ): Observable<Page<CriarPropostaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filtro) {
      params = params.set('filtro', filtro);
    }

    return this.http.get<Page<CriarPropostaResponse>>(this.baseUrl, { params });
  }
}
