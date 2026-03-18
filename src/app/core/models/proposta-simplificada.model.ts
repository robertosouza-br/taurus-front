/**
 * Models para Proposta Simplificada com Simulação de Venda
 * Baseado no Mapa de Integração v2.1 - 17/03/2026
 * 
 * ✨ NOVIDADE v2.1: Valores calculados automaticamente!
 * - Backend retorna campos `valor` e `valorParcela` já calculados
 * - Frontend NÃO precisa mais calcular - apenas exibir
 * 
 * ENDPOINT PRINCIPAL:
 * GET /api/v1/propostas/reserva/{reservaId}/simplificada
 * 
 * ENDPOINT DE CÁLCULO:
 * GET /api/v1/propostas/modalidade/{modalidadeId}/calcular-componentes
 */

// ========================
// RESPOSTA PRINCIPAL
// ========================

/**
 * Response do endpoint GET /api/v1/propostas/reserva/{reservaId}/simplificada
 * Retorna proposta simplificada com simulação de venda
 */
export interface PropostaSimplificadaDTO {
  id: number | null;
  reservaId: number;
  numeroProposta: string | null;
  dataProposta: string | null;
  status: PropostaStatus;
  
  empreendimento: EmpreendimentoPropostaDTO;
  cliente: ClientePropostaDTO;
  corretor: CorretorPropostaDTO;
  imobiliariaPrincipal: ImobiliariaPropostaDTO;
  imobiliariaSecundaria: ImobiliariaPropostaDTO | null;
  profissionaisPrincipal: ProfissionalSimplificadoDTO[];
  profissionaisSecundaria: ProfissionalSimplificadoDTO[] | null;
  
  modalidadeTabelaPadrao: ModalidadeTabelaPadraoDTO;
  simulacao: SimulacaoVendaDTO | null;
  
  dataCriacao: string;
  dataAlteracao: string;
  usuarioCriacao: string;
  usuarioAlteracao: string;
}

// ========================
// DADOS DO EMPREENDIMENTO
// ========================

export interface EmpreendimentoPropostaDTO {
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  valorUnidade: number;
  area: number;
  vagas: number;
  localizacao: string;
  posicaoSol: string;
  fachada: string;
  garagem: string;
  dataEntrega: string;
}

// ========================
// DADOS DO CLIENTE
// ========================

export interface ClientePropostaDTO {
  nome: string;
  cpfCnpj: string;
  passaporte: string | null;
  clienteEstrangeiro: boolean;
}

// ========================
// DADOS DO CORRETOR
// ========================

export interface CorretorPropostaDTO {
  id: number;
  nome: string;
  cargo: string;
}

// ========================
// DADOS DA IMOBILIÁRIA
// ========================

export interface ImobiliariaPropostaDTO {
  id: number;
  nome: string;
  tipoRelacionamento: string;
}

// ========================
// PROFISSIONAL
// ========================

export interface ProfissionalSimplificadoDTO {
  id: number;
  nome: string;
  cargo: string;
  percentualComissao: number | null;
}

// ========================
// MODALIDADE / TABELA PADRÃO (v2.0 - camelCase)
// ========================

export interface ModalidadeTabelaPadraoDTO {
  codigo: string;
  modalidade: string;
  descricao: string;
  codigoEmpreendimento: string;
  empreendimento: string;
  tabelaPadrao: string;
  componentes: ComponenteTabelaPadraoDTO[];
}

export interface ComponenteTabelaPadraoDTO {
  codigoComponente: string;
  nomeComponente: string;
  tipoComponente: TipoComponente;
  grupoComponente: GrupoComponente;      // NOVO v2.0
  quantidade: number;                     // NOVO v2.0
  periodicidade: Periodicidade;           // NOVO v2.0
  percentual: number;          // NOVO v2.0 - Percentual usado nas validações
  valorMinimo: number | null;
  valorMaximo: number | null;
  prazoMeses: number;
  ordem: number;
  ativo: boolean;
  tabelaPadrao?: string;                  // 🆕 v2.2: "SIM" ou "NÃO" - indica se faz parte da tabela base
  
  // ✨ NOVO v2.1: Valores calculados automaticamente pelo backend
  valor: number | null;                   // Valor total calculado em R$
  valorParcela: number | null;            // Valor de cada parcela em R$ (se parcelado)
  
  // 📅 NOVO v2.3: Datas de vencimento calculadas automaticamente
  dataVencimento?: Date | string | null;  // Data do primeiro vencimento
  listaVencimentos?: VencimentoDTO[];     // Lista completa de vencimentos (se parcelado)
}

/**
 * DTO de Vencimento Individual
 * Representa cada parcela com sua data e valor específico
 */
export interface VencimentoDTO {
  numeroParcela: number;    // Número da parcela (1, 2, 3...)
  dataVencimento: Date | string;     // Data de vencimento desta parcela
  valor: number;            // Valor da parcela
}

export type TipoComponente = 'ENTRADA' | 'PARCELA' | 'COTA_UNICA';

// NOVO v2.0: Grupo do componente
export type GrupoComponente = 1 | 2 | 3 | 6 | 7;
export const GRUPO_COMPONENTE_LABELS: Record<GrupoComponente, string> = {
  1: 'Entrada',
  2: 'Mensal',
  3: 'Intermediária',
  6: 'Única',
  7: 'Opcional'
};

// NOVO v2.0: Periodicidade
export type Periodicidade = 0 | 1 | 2 | 3 | 6 | 12;
export const PERIODICIDADE_LABELS: Record<Periodicidade, string> = {
  0: 'À vista',
  1: 'Mensal',
  2: 'Bimestral',
  3: 'Trimestral',
  6: 'Semestral',
  12: 'Anual'
};

// ========================
// SIMULAÇÃO DE VENDA
// ========================

export interface SimulacaoVendaDTO {
  valorTabela: number;
  valorProposta: number;
  diferenca: number;
  percentualDiferenca: number;
  possuiDesconto: boolean;
  possuiAcrescimo: boolean;
  componentes: ComponenteSimulacaoDTO[];
  totalSimulado: number;
}

export interface ComponenteSimulacaoDTO {
  codigoComponente: string;
  nomeComponente: string;
  tipoComponente: TipoComponente;
  quantidade: number;
  vencimento: string;
  valorParcela: number;
  percentual: number;
  valorTotal: number;
}

// ========================
// REQUEST PARA SALVAR
// ========================

export interface SalvarPropostaSimplificadaRequest {
  reservaId: number;
  dataProposta: string;
  valorTabela: number;
  valorProposta: number;
  desconto: number;
  acrescimo: number;
  area: number;
  vagas: number;
  dataEntrega: string;
  componentes: ComponentePropostaRequest[];
}

export interface ComponentePropostaRequest {
  codigoComponente: string;
  quantidade: number;
  vencimento: string;
  valorParcela: number;
}

// ========================
// RESPONSE SALVAR
// ========================

export interface SalvarPropostaResponse {
  id: number;
  numeroProposta: string;
  status: PropostaStatus;
  mensagem: string;
}

// ========================
// ENUMERAÇÕES
// ========================

export enum PropostaStatus {
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA'
}

export const PROPOSTA_STATUS_LABELS: Record<PropostaStatus, string> = {
  [PropostaStatus.EM_ANALISE]: 'Em Análise',
  [PropostaStatus.APROVADA]: 'Aprovada',
  [PropostaStatus.REPROVADA]: 'Reprovada'
};

export const PROPOSTA_STATUS_SEVERITY: Record<PropostaStatus, 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast'> = {
  [PropostaStatus.EM_ANALISE]: 'warning',
  [PropostaStatus.APROVADA]: 'success',
  [PropostaStatus.REPROVADA]: 'danger'
};

// ========================
// COMPARAÇÃO TABELA VS PROPOSTA
// ========================

export interface ComparacaoMetricaDTO {
  metrica: string;
  limite: string;
  proposta: string | null;
  status: 'OK' | 'VIOLACAO' | 'ALERTA';
}

// ========================
// CÁLCULO DE COMPONENTES (NOVO v2.0)
// GET /api/v1/propostas/modalidade/{modalidadeId}/calcular-componentes
// ========================

export interface CalcularComponentesRequest {
  modalidadeId: string;
  codigoEmpreendimento: string;
  valorUnidade: number;
}

export interface CalcularComponentesResponse {
  modalidade: ModalidadeTabelaPadraoDTO;
  componentes: ComponenteCalculadoDTO[];
  valorTotal: number;
  valorUnidade: number;
}

export interface ComponenteCalculadoDTO {
  codigoComponente: string;
  nomeComponente: string;
  tipoComponente: TipoComponente;
  grupoComponente: GrupoComponente;
  quantidade: number;
  periodicidade: Periodicidade;
  percentual: number;
  valorTotal: number;      // Calculado pelo backend
  valorParcela: number;    // Calculado pelo backend
}

// ========================
// COMPONENTE DE FORMULÁRIO (uso interno)
// ========================

export interface ComponenteFormulario {
  codigoComponente: string;
  nomeComponente: string;
  tipoComponente: TipoComponente;
  grupoComponente?: GrupoComponente;   // NOVO v2.0
  periodicidade?: Periodicidade;        // NOVO v2.0
  quantidade: number;
  vencimento: Date | null;
  valorParcela: number;
  percentual: number;
  valorTotal: number;
  selecionado: boolean;
  regra: ComponenteTabelaPadraoDTO;
  erroValidacao: string | null;
  mensagensErro?: string[];  // Array de mensagens de erro de validação
  
  // 📅 NOVO v2.3: Lista de vencimentos calculados
  listaVencimentos?: VencimentoDTO[];     // Lista completa de vencimentos (se parcelado)
}

// ========================
// REGRAS DE VALIDAÇÃO AUTOMÁTICA
// ========================

/**
 * Status de validação das regras de aprovação automática
 */
export enum StatusRegraValidacao {
  CONFORME = 'CONFORME',        // Atende a regra
  VIOLACAO = 'VIOLACAO',        // Viola a regra (reprovação automática)
  NAO_APLICAVEL = 'NAO_APLICAVEL' // Regra não se aplica
}

/**
 * Tipo de regra de validação
 */
export enum TipoRegraValidacao {
  SINAL_MINIMO = 'SINAL_MINIMO',                          // ATO + SINAL >= 5%
  ARRECADACAO_13_PRIMEIROS_MESES = 'ARRECADACAO_13_PRIMEIROS_MESES', // >= 29%
  ARRECADACAO_13_ULTIMOS_MESES = 'ARRECADACAO_13_ULTIMOS_MESES',   // <= 26%
  ULTIMA_PARCELA_MAXIMA = 'ULTIMA_PARCELA_MAXIMA',        // COTA ÚNICA <= 6%
  DESCONTO_APLICADO = 'DESCONTO_APLICADO',                // Valor < Tabela
  ACRESCIMO_APLICADO = 'ACRESCIMO_APLICADO',              // Valor > Tabela
  ATO_MINIMO_TIPOLOGIA = 'ATO_MINIMO_TIPOLOGIA',          // ATO >= valor mínimo
  MENSAL_MINIMA = 'MENSAL_MINIMA'                         // COTA MENSAL >= R$ 1.000
}

/**
 * Resultado de validação de uma regra
 */
export interface RegraValidacaoDTO {
  tipo: TipoRegraValidacao;
  status: StatusRegraValidacao;
  percentualCalculado?: number;      // Para regras de percentual
  valorCalculado?: number;           // Para regras de valor
  percentualLimite?: number;         // Limite da regra
  valorLimite?: number;              // Valor limite da regra
  mensagem: string;                  // Mensagem descritiva da validação
  bloqueiaAprovacao: boolean;        // Se true, impede aprovação automática
}

/**
 * Configurações de limites para aprovação automática
 * Valores que podem ser alterados pelos administradores
 */
export interface ConfiguracoesAprovacaoDTO {
  percentualSinalMinimo: number;           // Default: 5%
  percentual13PrimeirosMesesMinimo: number; // Default: 29%
  percentual13UltimosMesesMaximo: number;   // Default: 26%
  percentualUltimaParcelaMaximo: number;    // Default: 6%
  valorMensalMinimo: number;               // Default: R$ 1.000,00
  valoresAtoMinimosPorTipologia: {
    [tipologia: string]: number;           // Ex: {"02 QUARTOS": 15000, "03 QUARTOS": 20000}
  };
}

// ========================
// COMPONENTES DISPONÍVEIS (v2.4 - 17/03/2026)
// ========================

/**
 * DTO de Componente Disponível para Adição em Simulações
 * Endpoint: GET /api/v1/modalidades-tabela-padrao/componentes-disponiveis
 * Endpoint: GET /api/v1/modalidades-tabela-padrao/empreendimento/{codigoEmpreendimento}/componentes-disponiveis
 */
export interface ComponenteDisponivelDTO {
  codigoComponente: string;          // Código único do componente
  nomeComponente: string;            // Nome descritivo (ex: "ATO", "COTA SINAL")
  tipoComponente: string;            // ENTRADA, PARCELA, TAXA, CHAVES, DESCONTO
  grupoComponente: number | null;    // Número do grupo para agrupamento
  percentualPadrao: number | null;   // Percentual padrão sobre valor do imóvel
  valorMinimo: number | null;        // Valor mínimo permitido em BRL
  valorMaximo: number | null;        // Valor máximo permitido em BRL
  quantidadePadrao: number | null;   // Quantidade padrão de parcelas
  periodicidadePadrao: number | null; // Periodicidade em meses (1=mensal, 6=semestral)
  prazoMesesPadrao: number | null;   // Prazo total em meses
  ativo: boolean;                    // Disponível para uso
  ordem: number | null;              // Ordem de apresentação
}
