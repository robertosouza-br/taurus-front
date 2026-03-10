/**
 * Models para o fluxo de Proposta Multi-Step
 * Baseado no Mapa de Integração v2.0 - 10/03/2026
 * 
 * ENDPOINT PRINCIPAL:
 * GET /api/v1/propostas/{reservaId}/completo
 * 
 * Retorna TUDO em uma única requisição:
 * - Cabeçalho (dados da unidade)
 * - Step 1 (dados iniciais pré-preenchidos da reserva)
 * - Step 2 (dados do cliente a serem preenchidos)
 * - Metadata (se proposta já existe)
 */

// Re-exporta tipos compartilhados de reserva.model
import { TipoProfissional, TIPO_PROFISSIONAL_LABELS, TipoContato } from './reserva.model';
export { TipoProfissional, TIPO_PROFISSIONAL_LABELS, TipoContato };

// ========================
// LISTAGEM DE RESERVAS
// ========================

export interface ReservaPropostaDTO {
  id: number;
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  nomeCliente: string;
  cpfCnpjCliente: string;
  clienteEstrangeiro: boolean;
  status: string;
  dataReserva: string;
  dataVenda?: string;
  formaPagamento: string;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal: string;
  imobiliariaSecundariaId?: number;
  nomeImobiliariaSecundaria?: string;
  tipoRelacionamentoSecundaria?: string;
  contatoPrincipal: string;
  tipoContatoPrincipal: string;
  observacoes?: string;
  dataCriacao: string;
  dataAlteracao: string;
  usuarioCriacao: string;
  usuarioAlteracao: string;
  profissionaisPrincipal: ProfissionalPropostaDTO[];
  profissionaisSecundaria: ProfissionalPropostaDTO[];
  propostaId?: number; // ID da proposta se já existir
}

// ========================
// RESPOSTA COMPLETA (/completo)
// ========================

/**
 * Response do endpoint GET /api/v1/propostas/{reservaId}/completo
 * TUDO em uma única requisição
 */
export interface PropostaCompletaResponse {
  cabecalho: CabecalhoPropostaDTO;
  dadosIniciais: DadosIniciaisPropostaDTO;
  dadosCliente: DadosClientePropostaDTO;
  metadata: MetadataPropostaDTO;
}

// ========================
// CABEÇALHO (Dados da Unidade)
// ========================

export interface CabecalhoPropostaDTO {
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  valorUnidade: number;
  fracaoIdeal: number;
  sigla: string;
  localizacao: string;
  posicaoSol: string;
  fachada: string;
  garagem: string;
  nomeCliente: string;
  cpfCnpjCliente: string;
}

// ========================
// STEP 1 - Dados Iniciais
// ========================

/**
 * Dados Iniciais vêm PRÉ-PREENCHIDOS da reserva
 * Usuário NÃO edita nada no Step 1 (apenas visualiza)
 */
export interface DadosIniciaisPropostaDTO {
  reservaId: number;
  formaPagamento: string;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal: string;
  imobiliariaSecundariaId?: number;
  nomeImobiliariaSecundaria?: string;
  tipoRelacionamentoSecundaria?: string;
  profissionaisPrincipal: ProfissionalPropostaDTO[];
  profissionaisSecundaria: ProfissionalPropostaDTO[];
  observacoes?: string;
  status: string;
  dataReserva: string;
  dataVenda?: string;
}

export interface ProfissionalPropostaDTO {
  id?: number;
  tipoProfissional: TipoProfissional;
  corretorId?: number;
  cpfCorretor?: string;
  nomeCorretor?: string;
  imobiliariaId?: number;
  nomeImobiliaria?: string;
  nomeTexto?: string; // Para DIRETOR, GERENTE, PARCEIRO (texto livre)
}

// ========================
// STEP 2 - Dados do Cliente
// ========================

/**
 * Dados do Cliente - CAMPOS A SEREM PREENCHIDOS NO STEP 2
 * Campos básicos vêm pré-preenchidos da reserva
 */
export interface DadosClientePropostaDTO {
  // SEÇÃO 1: Dados Básicos (pré-preenchidos da reserva)
  nomeCompleto: string;
  cpfCnpj: string;
  clienteEstrangeiro: boolean;
  passaporte?: string | null;
  dataNascimento?: string | null; // LocalDate ISO - A PREENCHER
  estadoCivil?: EstadoCivil | null; // A PREENCHER
  contatoPrincipal: string;
  tipoContatoPrincipal: TipoContato;
  contatoSecundario?: string | null;
  tipoContatoSecundario?: TipoContato | null;
  
  // SEÇÃO 2: Informações Profissionais (A PREENCHER)
  profissao?: string | null;
  empresaTrabalho?: string | null;
  tempoEmpresaMeses?: number | null;
  cnpjEmpresa?: string | null;
  
  // SEÇÃO 3: Informações Financeiras (A PREENCHER)
  rendaMensal?: number | null;
  rendaComprovada?: number | null;
  outrasRendas?: number | null;
  bancoPrincipal?: string | null;
  agencia?: string | null;
  
  // SEÇÃO 4: Endereço Residencial (A PREENCHER)
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  
  // SEÇÃO 5: Origem da Venda (A PREENCHER)
  midiaOrigem?: MidiaOrigem | null;
  motivoCompra?: MotivoCompra | null;
}

// ========================
// METADATA
// ========================

export interface MetadataPropostaDTO {
  propostaId?: number | null;
  numeroProposta?: string | null;
  dataCriacao: string;
  dataAlteracao: string;
  usuarioCriacao: string;
  usuarioAlteracao: string;
  existeProposta: boolean;
}

// ========================
// REQUEST PARA CRIAR/ATUALIZAR PROPOSTA
// ========================

/**
 * Dados do Cliente para enviar no POST
 * Apenas campos complementares do Step 2
 */
export interface DadosClienteRequest {
  dataNascimento: string; // LocalDate ISO (YYYY-MM-DD)
  estadoCivil: string; // EstadoCivil name
  profissao: string;
  empresaTrabalho?: string;
  tempoEmpresaMeses?: number;
  cnpjEmpresa?: string;
  rendaMensal: number;
  rendaComprovada?: number;
  outrasRendas?: number;
  bancoPrincipal?: string;
  agencia?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  midiaOrigem?: string; // MidiaOrigem name
  motivoCompra?: string; // MotivoCompra name
}

/**
 * Request para POST /api/v1/propostas
 * Estrutura ANINHADA conforme API v2.0
 */
export interface CriarPropostaRequest {
  reservaId: number;
  dadosCliente: DadosClienteRequest;
}

/**
 * Response do POST /api/v1/propostas (201 Created)
 * Retorna apenas campos essenciais
 */
export interface CriarPropostaResponse {
  id: number;
  reservaId: number;
  status: string;
  dataCriacao: string;
  usuarioCriacao: string;
}

// ========================
// ENUMERAÇÕES
// ========================

export enum EstadoCivil {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUVO = 'VIUVO',
  UNIAO_ESTAVEL = 'UNIAO_ESTAVEL'
}

export const ESTADO_CIVIL_LABELS: Record<EstadoCivil, string> = {
  [EstadoCivil.SOLTEIRO]: 'Solteiro(a)',
  [EstadoCivil.CASADO]: 'Casado(a)',
  [EstadoCivil.DIVORCIADO]: 'Divorciado(a)',
  [EstadoCivil.VIUVO]: 'Viúvo(a)',
  [EstadoCivil.UNIAO_ESTAVEL]: 'União Estável'
};

export enum MidiaOrigem {
  NAO_INFORMADA = 'NAO_INFORMADA',
  RADIO = 'RADIO',
  REVISTA = 'REVISTA',
  JORNAL = 'JORNAL',
  TELEVISAO = 'TELEVISAO',
  EMAIL = 'EMAIL',
  PROPAGANDA = 'PROPAGANDA',
  STAND = 'STAND',
  INDICACAO = 'INDICACAO',
  INTERNET = 'INTERNET',
  PLACAS = 'PLACAS',
  FOLHETO = 'FOLHETO',
  OUTDOOR = 'OUTDOOR',
  PANFLETO = 'PANFLETO',
  ANUNCIO = 'ANUNCIO',
  AMIGO = 'AMIGO',
  TV = 'TV',
  CLIENTE_CALPER = 'CLIENTE_CALPER'
}

export const MIDIA_CONHECIMENTO_LABELS: Record<MidiaOrigem, string> = {
  [MidiaOrigem.NAO_INFORMADA]: 'Não Informada',
  [MidiaOrigem.RADIO]: 'Rádio',
  [MidiaOrigem.REVISTA]: 'Revista',
  [MidiaOrigem.JORNAL]: 'Jornal',
  [MidiaOrigem.TELEVISAO]: 'Televisão',
  [MidiaOrigem.EMAIL]: 'E-mail',
  [MidiaOrigem.PROPAGANDA]: 'Propaganda',
  [MidiaOrigem.STAND]: 'Stand',
  [MidiaOrigem.INDICACAO]: 'Indicação',
  [MidiaOrigem.INTERNET]: 'Internet',
  [MidiaOrigem.PLACAS]: 'Placas',
  [MidiaOrigem.FOLHETO]: 'Folheto',
  [MidiaOrigem.OUTDOOR]: 'Outdoor',
  [MidiaOrigem.PANFLETO]: 'Panfleto',
  [MidiaOrigem.ANUNCIO]: 'Anúncio',
  [MidiaOrigem.AMIGO]: 'Amigo',
  [MidiaOrigem.TV]: 'TV',
  [MidiaOrigem.CLIENTE_CALPER]: 'Cliente Calper'
};

// Alias para compatibilidade
export type MidiaConhecimento = MidiaOrigem;
export const MIDIA_ORIGEM_LABELS = MIDIA_CONHECIMENTO_LABELS;

export enum MotivoCompra {
  NAO_INFORMADO = 'NAO_INFORMADO',
  MORADIA = 'MORADIA',
  AMBOS = 'AMBOS',
  INVESTIMENTO = 'INVESTIMENTO'
}

export const MOTIVO_COMPRA_LABELS: Record<MotivoCompra, string> = {
  [MotivoCompra.NAO_INFORMADO]: 'Não Informado',
  [MotivoCompra.MORADIA]: 'Moradia',
  [MotivoCompra.AMBOS]: 'Ambos (Moradia e Investimento)',
  [MotivoCompra.INVESTIMENTO]: 'Investimento'
};

// ========================
// COMPATIBILIDADE (para não quebrar código existente)
// ========================

/**
 * @deprecated - Usar CabecalhoPropostaDTO
 * Mantido para compatibilidade temporária
 */
export interface DadosUnidadeHeaderDTO {
  reservaId?: number;
  codEmpreendimento: number;
  codColigada?: number;
  codColigadaEmpreendimento?: number;
  nomeEmpreendimento: string;
  nomeUnidade?: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  sigla?: string;
  valor?: number;
  valorTotal?: number;
  valorUnidade?: number;
  fracaoIdeal: number;
  localizacao?: string;
  posicaoSolar?: string;
  posicaoSol?: string;
  fachada?: string;
  garagem?: string;
}
