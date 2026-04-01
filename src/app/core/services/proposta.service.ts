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
import {
  PropostaSimplificadaDTO,
  SalvarPropostaSimplificadaRequest,
  SalvarPropostaResponse,
  CalcularComponentesResponse,
  ComponenteDisponivelDTO,
  PropostaPorReservaDTO,
  CriarPropostaStatusRequest,
  CriarPropostaStatusResponse,
  FinalizarPropostaStatusResponse,
  EnviarPropostaTotvsResponse,
  GerarPixPropostaResponse
} from '../models/proposta-simplificada.model';

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

  // ========================
  // PROPOSTA SIMPLIFICADA
  // ========================

  /**
   * Busca proposta simplificada por reserva
   * GET /api/v1/propostas/reserva/{reservaId}/simplificada
   * 
   * Se não existir proposta, retorna estrutura vazia com dados da reserva
   * e modalidade/tabela padrão do empreendimento
   * 
   * @param reservaId ID da reserva
   */
  buscarPropostaSimplificada(reservaId: number): Observable<PropostaSimplificadaDTO> {
    return this.http.get<PropostaSimplificadaDTO>(
      `${this.baseUrl}/reserva/${reservaId}/simplificada`
    );
  }

  /**
   * Salva proposta simplificada (criar ou atualizar)
   * POST /api/v1/propostas
   * 
   * @param dados Dados da proposta com componentes de simulação
   */
  salvarPropostaSimplificada(dados: SalvarPropostaSimplificadaRequest): Observable<SalvarPropostaResponse> {
    return this.http.post<SalvarPropostaResponse>(this.baseUrl, dados);
  }

  /**
   * Atualiza proposta simplificada existente
   * PUT /api/v1/propostas/{id}
   * 
   * @param propostaId ID da proposta
   * @param dados Dados da proposta com componentes de simulação
   */
  atualizarPropostaSimplificada(
    propostaId: number,
    dados: SalvarPropostaSimplificadaRequest
  ): Observable<SalvarPropostaResponse> {
    return this.http.put<SalvarPropostaResponse>(`${this.baseUrl}/${propostaId}`, dados);
  }

  /**
   * Exclui proposta simplificada existente
   * DELETE /api/v1/propostas/{id}
   *
   * @param propostaId ID da proposta
   */
  excluirProposta(propostaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${propostaId}`);
  }

  // ========================
  // COMPONENTES DISPONÍVEIS (NOVO v2.4 - 17/03/2026)
  // ========================

  /**
   * 🆕 Lista todos os componentes disponíveis para adicionar em simulações
   * GET /api/v1/modalidades-tabela-padrao/componentes-disponiveis
   * 
   * Retorna lista completa de componentes que podem ser adicionados além dos padrões
   */
  listarComponentesDisponiveis(): Observable<ComponenteDisponivelDTO[]> {
    return this.http.get<ComponenteDisponivelDTO[]>(
      `${environment.apiUrl}/modalidades-tabela-padrao/componentes-disponiveis`
    );
  }

  /**
   * 🆕 Lista componentes disponíveis filtrados por empreendimento
   * GET /api/v1/modalidades-tabela-padrao/empreendimento/{codigoEmpreendimento}/componentes-disponiveis
   * 
   * Retorna componentes globais + componentes específicos do empreendimento
   * 
   * @param codigoEmpreendimento Código do empreendimento para filtrar componentes
   */
  listarComponentesDisponiveisPorEmpreendimento(
    codigoEmpreendimento: string
  ): Observable<ComponenteDisponivelDTO[]> {
    return this.http.get<ComponenteDisponivelDTO[]>(
      `${environment.apiUrl}/modalidades-tabela-padrao/empreendimento/${codigoEmpreendimento}/componentes-disponiveis`
    );
  }

  // ========================
  // CÁLCULO DE COMPONENTES (NOVO v2.0)
  // ========================

  /**
   * Calcula valores dos componentes baseado na modalidade e valor da unidade
   * GET /api/v1/propostas/modalidade/{modalidadeId}/calcular-componentes
   * 
   * Retorna componentes com valorTotal e valorParcela calculados pelo backend
   * 
   * @param modalidadeId Código da modalidade
   * @param codigoEmpreendimento Código do empreendimento
   * @param valorUnidade Valor da unidade
   */
  calcularComponentes(
    modalidadeId: string,
    codigoEmpreendimento: string,
    valorUnidade: number
  ): Observable<CalcularComponentesResponse> {
    const params = new HttpParams()
      .set('codigoEmpreendimento', codigoEmpreendimento)
      .set('valorUnidade', valorUnidade.toString());

    return this.http.get<CalcularComponentesResponse>(
      `${this.baseUrl}/modalidade/${modalidadeId}/calcular-componentes`,
      { params }
    );
  }

  // ========================
  // GESTÃO DE STATUS (ESCOPO INICIAL)
  // Mapa de Integração - Status da Proposta
  // ========================

  /**
   * Consulta proposta por reserva (para definir status na tela)
   * GET /api/v1/propostas/reserva/{reservaId}
   * 
   * REGRA DE TELA:
   * - 200: usar `status` retornado pelo backend
   * - 404: exibir "Não iniciada"
   * 
   * @param reservaId ID da reserva
   */
  consultarPropostaPorReserva(reservaId: number): Observable<PropostaPorReservaDTO> {
    return this.http.get<PropostaPorReservaDTO>(`${this.baseUrl}/reserva/${reservaId}`);
  }

  /**
   * Cria uma nova proposta (decisão automática de status pelo backend)
   * POST /api/v1/propostas
   * 
   * REGRA DE TELA:
   * - Se requerAprovacao = false: Exibir "Aprovada Automaticamente" (status = APROVADA_AUTOMATICAMENTE)
   * - Se requerAprovacao = true: Exibir confirmação antes de salvar
   *   → "Esta proposta não atende aos critérios de aprovação automática. 
   *      Ao gravar, ela será encaminhada para a área de aprovação. Deseja continuar?"
   *   → Se confirmar: Salvar com status = AGUARDANDO_ANALISE
   *   → Se cancelar: Não salvar
   * 
   * DECISÃO DO BACKEND:
   * - requerAprovacao = false → status = APROVADA_AUTOMATICAMENTE (simulação conforme tabela)
   * - requerAprovacao = true → status = AGUARDANDO_ANALISE (simulação difere da tabela)
   * 
   * @param dados Dados da proposta
   */
  criarPropostaStatus(dados: CriarPropostaStatusRequest): Observable<CriarPropostaStatusResponse> {
    return this.http.post<CriarPropostaStatusResponse>(this.baseUrl, dados);
  }

  /**
   * Finaliza proposta (decisão automática de status pelo backend)
   * POST /api/v1/propostas/{id}/finalizar
   * 
   * REGRA DE TELA:
   * - Se status = AGUARDANDO_ANALISE, exibir "Aguardando Análise"
   * - Se status = APROVADA_AUTOMATICAMENTE, exibir "Aprovada Automaticamente"
   * 
   * DECISÃO DO BACKEND:
   * - AGUARDANDO_ANALISE: quando simulação NÃO segue tabela padrão
   * - APROVADA_AUTOMATICAMENTE: quando simulação segue tabela padrão
   * 
   * @param propostaId ID da proposta
   */
  finalizarProposta(propostaId: number): Observable<FinalizarPropostaStatusResponse> {
    return this.http.post<FinalizarPropostaStatusResponse>(
      `${this.baseUrl}/${propostaId}/finalizar`,
      {}
    );
  }

  /**
   * Envia uma proposta aprovada para integração com o TOTVS
   * POST /api/v1/propostas/{id}/enviar-totvs
   *
   * @param propostaId ID da proposta
   */
  enviarParaTotvs(propostaId: number): Observable<EnviarPropostaTotvsResponse> {
    return this.http.post<EnviarPropostaTotvsResponse>(
      `${this.baseUrl}/${propostaId}/enviar-totvs`,
      {}
    );
  }

  gerarPix(propostaId: number): Observable<GerarPixPropostaResponse> {
    return this.http.post<GerarPixPropostaResponse>(
      `${this.baseUrl}/${propostaId}/pix`,
      {}
    );
  }
}
