import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  ReservaPropostaDTO,
  DadosIniciaisPropostaDTO,
  DadosIniciaisReservaResponse,
  SalvarDadosIniciaisRequest,
  SalvarDadosIniciaisResponse,
  DadosClientePropostaDTO,
  SalvarDadosClienteRequest,
  SalvarDadosClienteResponse
} from '../models/proposta-fluxo.model';

/**
 * Service para gerenciar o fluxo de Proposta Multi-Step
 * Baseado no Mapa de Integração v1.0 - 10/03/2026
 */
@Injectable({
  providedIn: 'root'
})
export class PropostaService {
  private readonly baseUrl = `${environment.apiUrl}/propostas`;

  constructor(private http: HttpClient) {}

  // ========================
  // CENÁRIO 1: Listagem de Reservas para Proposta
  // ========================

  /**
   * Lista todas as reservas elegíveis para criação de proposta
   * (status diferente de DISPONIVEL_PARA_VENDA)
   * 
   * @param page Número da página (default: 0)
   * @param size Tamanho da página (default: 10)
   * @param nomeCliente Filtro por nome do cliente (opcional)
   * @param nomeEmpreendimento Filtro por nome do empreendimento (opcional)
   * @param status Filtro por status da reserva (opcional)
   * @returns Observable<Page<ReservaPropostaDTO>>
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
  // STEP 1: Dados Iniciais (Imobiliária e Profissionais)
  // ========================

  /**
   * Busca os dados iniciais da proposta (Step 1)
   * 
   * @param reservaId ID da reserva
   * @returns Observable<DadosIniciaisReservaResponse>
   */
  buscarDadosIniciais(reservaId: number): Observable<DadosIniciaisReservaResponse> {
    return this.http.get<DadosIniciaisReservaResponse>(`${this.baseUrl}/${reservaId}/dados-iniciais`);
  }

  /**
   * Salva/Atualiza os dados iniciais da proposta (Step 1)
   * 
   * @param reservaId ID da reserva
   * @param dados Dados iniciais a serem salvos
   * @returns Observable<SalvarDadosIniciaisResponse>
   */
  salvarDadosIniciais(
    reservaId: number,
    dados: SalvarDadosIniciaisRequest
  ): Observable<SalvarDadosIniciaisResponse> {
    return this.http.put<SalvarDadosIniciaisResponse>(
      `${this.baseUrl}/${reservaId}/dados-iniciais`,
      dados
    );
  }

  // ========================
  // STEP 2: Dados do Cliente
  // ========================

  /**
   * Busca os dados do cliente (Step 2)
   * 
   * @param propostaId ID da proposta
   * @returns Observable<DadosClientePropostaDTO>
   */
  buscarDadosCliente(propostaId: number): Observable<DadosClientePropostaDTO> {
    return this.http.get<DadosClientePropostaDTO>(`${this.baseUrl}/${propostaId}/cliente`);
  }

  /**
   * Salva/Atualiza os dados do cliente (Step 2)
   * 
   * @param propostaId ID da proposta
   * @param dados Dados do cliente a serem salvos
   * @returns Observable<SalvarDadosClienteResponse>
   */
  salvarDadosCliente(
    propostaId: number,
    dados: SalvarDadosClienteRequest
  ): Observable<SalvarDadosClienteResponse> {
    return this.http.put<SalvarDadosClienteResponse>(
      `${this.baseUrl}/${propostaId}/cliente`,
      dados
    );
  }
}
