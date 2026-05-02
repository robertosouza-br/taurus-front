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
  codColigadaEmpreendimento?: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade?: string;
  tipologia: string;
  codTipo: number;
  valorUnidade: number;
  area?: number | null;
  vagas?: number | null;
  localizacao?: string | null;
  posicaoSol?: string | null;
  fachada?: string | null;
  garagem?: string | null;
  dataEntrega?: string | null;
}

export interface ClienteAnaliseDTO {
  nome?: string;
  nomeCliente?: string;
  cpfCnpj?: string;
  cpfCnpjCliente?: string;
  passaporte?: string | null;
  clienteEstrangeiro?: boolean;
  email?: string | null;
  telefone?: string | null;
  profissao?: string | null;
  empresaTrabalho?: string | null;
  rendaMensal?: number | null;
}

export interface CorretorAnaliseDTO {
  id: number;
  nome: string;
  cpf?: string | null;
  cargo?: string | null;
}

export interface ImobiliariaAnaliseDTO {
  id: number;
  nome: string;
  cnpj?: string | null;
  tipoRelacionamento?: string | null;
}

export interface ProfissionalAnaliseDTO {
  id: number;
  nome: string;
  cargo?: string | null;
  percentualComissao?: number | null;
}

export interface ComponenteAnaliseDTO {
  codigoComponente?: string;
  nomeComponente?: string;
  tipoComponente?: string;
  grupoComponente?: number;
  quantidade?: number;
  vencimento?: string;
  vencimentoInicial?: string;
  dataVencimento?: string;
  periodicidade?: number;
  valorParcela?: number;
  percentual?: number;
  valorTotal?: number;
  valor?: number;
  ordem?: number;
  ativo?: boolean;
  listaVencimentos?: VencimentoAnaliseDTO[];
  erroValidacao?: string | null;
  mensagensErro?: string[];
}

export interface VencimentoAnaliseDTO {
  numeroParcela: number;
  dataVencimento: Date | string;
  valor: number;
}

export interface ResumoFinanceiroDTO {
  valorSinal?: number | null;
  percentualSinal?: number | null;
  valorPrimeiros13Meses?: number | null;
  percentualPrimeiros13Meses?: number | null;
  valorUltimos13Meses?: number | null;
  percentualUltimos13Meses?: number | null;
  valorUltimaParcela?: number | null;
  percentualUltimaParcela?: number | null;
  valorAto?: number | null;
  valorMinimoAto?: number | null;
  valorCotaMensal?: number | null;
  valorMinimoCotaMensal?: number | null;
  valorTotal?: number | null;
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
  percentualDiferenca?: number;
  possuiDesconto?: boolean;
  possuiAcrescimo?: boolean;
  componentes: ComponenteAnaliseDTO[];
  resumo: ResumoFinanceiroDTO | null;
}

export interface ComparacaoAnaliseDTO {
  valorTabelaPadrao?: number;
  valorSimulacao?: number;
  percentualDiferenca?: number;
  possuiAlteracoes?: boolean;
  diferencaValorTotal?: number | null;
  diferencaPercentualTotal?: number | null;
  diferencaSinal?: number | null;
  diferencaPercentualSinal?: number | null;
  diferencaPrimeiros13Meses?: number | null;
  diferencaPercentualPrimeiros13Meses?: number | null;
  diferencaUltimos13Meses?: number | null;
  diferencaPercentualUltimos13Meses?: number | null;
  diferencaUltimaParcela?: number | null;
  diferencaPercentualUltimaParcela?: number | null;
  componentesAlterados?: string[];
  componentesRemovidos?: string[];
  componentesAdicionados?: string[];
}

export interface ValidacaoAnaliseDTO {
  campo?: string;
  tipo?: 'ERRO' | 'AVISO' | 'INFO';
  regra?: string;
  mensagem?: string;
  nivel?: 'ERRO' | 'ALERTA' | 'INFO';
  valorEsperado?: number | null;
  valorEncontrado?: number | null;
  bloqueante?: boolean;
}

export interface PropostaAnaliseDetalheDTO {
  id: number;
  reservaId: number;
  numeroProposta: string;
  numeroVenda?: string | null;
  nossoNumero?: string | null;
  dataProposta: string;
  status: StatusAnalise;
  observacoes: string | null;
  empreendimento: EmpreendimentoAnaliseDTO;
  cliente: ClienteAnaliseDTO;
  corretor?: CorretorAnaliseDTO | null;
  imobiliariaPrincipal?: ImobiliariaAnaliseDTO | null;
  imobiliariaSecundaria?: ImobiliariaAnaliseDTO | null;
  profissionaisPrincipal?: ProfissionalAnaliseDTO[] | null;
  profissionaisSecundaria?: ProfissionalAnaliseDTO[] | null;
  tabelaPadrao: TabelaPadraoAnaliseDTO | null;
  simulacaoProposta: SimulacaoPropostaAnaliseDTO | null;
  comparacao: ComparacaoAnaliseDTO | null;
  validacoes: ValidacaoAnaliseDTO[];
  dataCriacao?: string;
  dataAlteracao?: string;
  usuarioCriacao?: string;
  usuarioAlteracao?: string;
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
  motivo?: string;
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
