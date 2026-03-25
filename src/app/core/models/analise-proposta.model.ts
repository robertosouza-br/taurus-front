/**
 * Models para Análise de Proposta
 * Baseado no Mapa de Integração - 25/03/2026
 */

// ========================
// STATUS
// ========================

export type StatusAnalise = 'AGUARDANDO_ANALISE' | 'EM_ANALISE' | 'APROVADA' | 'REPROVADA';

export const STATUS_ANALISE_LABELS: Record<StatusAnalise, string> = {
  AGUARDANDO_ANALISE: 'Aguardando Análise',
  EM_ANALISE: 'Em Análise',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada'
};

export const STATUS_ANALISE_SEVERITY: Record<StatusAnalise, 'info' | 'warning' | 'success' | 'danger'> = {
  AGUARDANDO_ANALISE: 'info',
  EM_ANALISE: 'warning',
  APROVADA: 'success',
  REPROVADA: 'danger'
};

// ========================
// FILA DE ANÁLISE
// GET /api/v1/propostas/analises
// ========================

export interface PropostaAnaliseFilaDTO {
  id: number;
  reservaId: number;
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  nomeCliente: string;
  cpfCnpjCliente: string;
  status: StatusAnalise;
  dataCriacao: string;
  dataAlteracao: string;
  dataSolicitacaoAnalise: string | null;
  usuarioSolicitacaoAnalise: string | null;
}

// ========================
// DETALHE DA ANÁLISE
// GET /api/v1/propostas/{id}/analise
// ========================

export interface EmpreendimentoAnaliseDTO {
  codEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipologia: string;
  codTipo: number;
  valorUnidade: number;
}

export interface ClienteAnaliseDTO {
  nomeCliente: string;
  cpfCnpjCliente: string;
}

export interface ComponenteAnaliseDTO {
  codigoComponente?: string;
  nomeComponente?: string;
  tipoComponente?: string;
  quantidade?: number;
  vencimento?: string;
  valorParcela?: number;
  percentual?: number;
  valorTotal?: number;
}

export interface ResumoFinanceiroDTO {
  valorAto: number;
  valorMinimoAto: number;
  valorTotal: number;
}

export interface TabelaPadraoAnaliseDTO {
  codigoModalidade: string;
  descricaoModalidade: string;
  valorTotal: number;
  componentes: ComponenteAnaliseDTO[];
  resumo: ResumoFinanceiroDTO | null;
}

export interface SimulacaoPropostaAnaliseDTO {
  codigoModalidade: string;
  descricaoModalidade: string;
  valorTabela: number;
  valorProposta: number;
  diferenca: number;
  componentes: ComponenteAnaliseDTO[];
  resumo: ResumoFinanceiroDTO | null;
}

export interface ComparacaoAnaliseDTO {
  valorTabelaPadrao: number;
  valorSimulacao: number;
  percentualDiferenca: number;
  possuiAlteracoes: boolean;
}

export interface ValidacaoAnaliseDTO {
  campo?: string;
  mensagem?: string;
  nivel?: 'ERRO' | 'ALERTA' | 'INFO';
}

export interface PropostaAnaliseDetalheDTO {
  id: number;
  reservaId: number;
  numeroProposta: string;
  dataProposta: string;
  status: StatusAnalise;
  observacoes: string | null;
  empreendimento: EmpreendimentoAnaliseDTO;
  cliente: ClienteAnaliseDTO;
  tabelaPadrao: TabelaPadraoAnaliseDTO | null;
  simulacaoProposta: SimulacaoPropostaAnaliseDTO | null;
  comparacao: ComparacaoAnaliseDTO | null;
  validacoes: ValidacaoAnaliseDTO[];
  dataSolicitacaoAnalise: string | null;
  usuarioSolicitacaoAnalise: string | null;
}

// ========================
// REQUESTS
// ========================

export interface AprovarPropostaRequest {
  observacoes?: string;
}

export interface ReprovarPropostaRequest {
  motivo: string;
}

// ========================
// RESPONSES DE AÇÃO
// POST enviar-analise / aprovar / reprovar
// ========================

export interface AnaliseAcaoResponse {
  id: number;
  reservaId: number;
  nomeEmpreendimento: string;
  bloco?: string;
  unidade: string;
  tipologia?: string;
  nomeCliente: string;
  cpfCnpjCliente?: string;
  status: StatusAnalise;
  dataSolicitacaoAnalise?: string | null;
  usuarioSolicitacaoAnalise?: string | null;
  dataAlteracao: string;
}
