/**
 * Models para o novo fluxo de Proposta Multi-Step
 * Baseado no Mapa de Integração v1.0 - 10/03/2026
 */

// Re-exporta tipos compartilhados de reserva.model
import { TipoProfissional, TIPO_PROFISSIONAL_LABELS } from './reserva.model';
export { TipoProfissional, TIPO_PROFISSIONAL_LABELS };

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
  passaporteCliente?: string;
  contatoPrincipal: string;
  tipoContatoPrincipal: string;
  contatoSecundario?: string;
  tipoContatoSecundario?: string;
  formaPagamento: string;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal: string;
  imobiliariaSecundariaId?: number;
  nomeImobiliariaSecundaria?: string;
  tipoRelacionamentoSecundaria?: string;
  profissionaisPrincipal: any[];
  profissionaisSecundaria: any[];
  codigoStatus: number;
  descricaoStatus: string;
  dataReserva: string;
  dataVenda?: string;
  dataCriacao: string;
  dataAlteracao: string;
  usuarioCriacao: string;
  usuarioAlteracao: string;
  observacoes?: string;
  propostaId?: number;
}

// ========================
// CABEÇALHO (HEADER) - Dados da Unidade
// ========================

export interface DadosUnidadeHeaderDTO {
  reservaId?: number;      // ID da reserva (opcional, para navegação)
  codEmpreendimento: number;
  codColigada: number;
  nomeEmpreendimento: string;
  nomeUnidade: string;     // Nome/número da unidade para exibição
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  sigla?: string;
  valor: number;
  valorTotal: number;      // Alias para valor (compatibilidade)
  fracaoIdeal: number;
  localizacao: string;
  posicaoSolar: string;
  fachada: string;
  garagem: string;
}

// ========================
// STEP 1 - Dados Iniciais
// ========================

export interface ImobiliariaSimplesDTO {
  id: number;
  nomeFantasia: string;
  cnpj?: string;
  responsavel?: string;
  telefone?: string;
  email?: string;
  tipoRelacionamento?: 'PARCEIRO' | 'AUTONOMO' | 'INDICADO';
}

export interface ProfissionalPropostaDTO {
  id?: number;
  tipoProfissional: TipoProfissional;
  corretorId?: number;
  cpfCorretor?: string;
  nomeCorretor?: string;
  nomeTexto?: string;
}

// TipoProfissional e TIPO_PROFISSIONAL_LABELS importados de reserva.model.ts

/**
 * DTO retornado pelo backend - estrutura REAL do endpoint
 * GET /api/v1/propostas/{reservaId}/dados-iniciais
 */
export interface DadosIniciaisReservaResponse {
  // Identificadores
  id: number;
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  codigoStatus: number;
  descricaoStatus: string;
  
  // Dados da Unidade
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  
  // Dados do Cliente
  nomeCliente: string;
  cpfCnpjCliente: string;
  clienteEstrangeiro: boolean;
  passaporteCliente?: string;
  contatoPrincipal: string;
  tipoContatoPrincipal: string;
  contatoSecundario?: string;
  tipoContatoSecundario?: string;
  
  // Dados Comerciais
  formaPagamento: string;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal: string;
  imobiliariaSecundariaId?: number;
  nomeImobiliariaSecundaria?: string;
  tipoRelacionamentoSecundaria?: string;
  
  // Profissionais
  profissionaisPrincipal: ProfissionalPropostaDTO[];
  profissionaisSecundaria: ProfissionalPropostaDTO[];
  
  // Observações e Datas
  observacoes?: string;
  dataReserva: string;
  dataVenda?: string;
  dataCriacao: string;
  dataAlteracao: string;
  usuarioCriacao: string;
  usuarioAlteracao: string;
}

/**
 * DEPRECATED - Manter para compatibilidade, mas usar DadosIniciaisReservaResponse
 */
export interface DadosIniciaisPropostaDTO {
  reservaId: number;
  dadosUnidade: DadosUnidadeHeaderDTO;
  imobiliariaPrincipal?: ImobiliariaSimplesDTO;
  profissionaisPrincipal?: ProfissionalPropostaDTO[];
  imobiliariaSecundaria?: ImobiliariaSimplesDTO;
  profissionaisSecundaria?: ProfissionalPropostaDTO[];
  midiaConhecimento?: string;
  motivoCompra?: string;
  observacoes?: string;
}

export interface SalvarDadosIniciaisRequest {
  imobiliariaPrincipalId: number;
  profissionaisPrincipal: ProfissionalPropostaDTO[];
  imobiliariaSecundariaId?: number;
  tipoRelacionamentoSecundaria?: 'PARCEIRO' | 'AUTONOMO' | 'INDICADO';
  profissionaisSecundaria?: ProfissionalPropostaDTO[];
  midiaConhecimento?: string;
  motivoCompra?: string;
  observacoes?: string;
}

export interface SalvarDadosIniciaisResponse {
  message: string;
  propostaId: number;
  stepAtual: number;
  proximoStep: number;
}

// ========================
// STEP 2 - Dados do Cliente
// ========================

export interface EnderecoDTO {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ClientePropostaDTO {
  nome: string;
  cpfCnpj?: string;
  estrangeiro: boolean;
  passaporte?: string;
  dataNascimento?: string;
  estadoCivil?: EstadoCivil;
  profissao?: string;
  renda?: number;
  telefone: string;
  email: string;
  endereco?: EnderecoDTO;
}

export interface ConjugeDTO {
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  profissao?: string;
  renda?: number;
  telefone?: string;
  email?: string;
}

export enum EstadoCivil {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUVO = 'VIUVO'
}

export const ESTADO_CIVIL_LABELS: Record<EstadoCivil, string> = {
  [EstadoCivil.SOLTEIRO]: 'Solteiro(a)',
  [EstadoCivil.CASADO]: 'Casado(a)',
  [EstadoCivil.DIVORCIADO]: 'Divorciado(a)',
  [EstadoCivil.VIUVO]: 'Viúvo(a)'
};

export interface DadosClientePropostaDTO {
  propostaId: number;
  stepAtual: number;
  dadosUnidade: DadosUnidadeHeaderDTO;
  cliente: ClientePropostaDTO;
  conjuge?: ConjugeDTO;
}

export interface SalvarDadosClienteRequest {
  cliente: ClientePropostaDTO;
  conjuge?: ConjugeDTO;
}

export interface SalvarDadosClienteResponse {
  message: string;
  propostaId: number;
  stepAtual: number;
  proximoStep: number;
}

// ========================
// ENUMS DE MÍDIA E MOTIVO
// ========================

export enum MidiaConhecimento {
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

export const MIDIA_CONHECIMENTO_LABELS: Record<MidiaConhecimento, string> = {
  [MidiaConhecimento.NAO_INFORMADA]: 'Não Informada',
  [MidiaConhecimento.RADIO]: 'Rádio',
  [MidiaConhecimento.REVISTA]: 'Revista',
  [MidiaConhecimento.JORNAL]: 'Jornal',
  [MidiaConhecimento.TELEVISAO]: 'Televisão',
  [MidiaConhecimento.EMAIL]: 'E-mail',
  [MidiaConhecimento.PROPAGANDA]: 'Propaganda',
  [MidiaConhecimento.STAND]: 'Stand',
  [MidiaConhecimento.INDICACAO]: 'Indicação',
  [MidiaConhecimento.INTERNET]: 'Internet',
  [MidiaConhecimento.PLACAS]: 'Placas',
  [MidiaConhecimento.FOLHETO]: 'Folheto',
  [MidiaConhecimento.OUTDOOR]: 'Outdoor',
  [MidiaConhecimento.PANFLETO]: 'Panfleto',
  [MidiaConhecimento.ANUNCIO]: 'Anúncio',
  [MidiaConhecimento.AMIGO]: 'Amigo',
  [MidiaConhecimento.TV]: 'TV',
  [MidiaConhecimento.CLIENTE_CALPER]: 'Cliente Calper'
};

export enum MotivoCompra {
  NAO_INFORMADO = 'NAO_INFORMADO',
  MORADIA = 'MORADIA',
  INVESTIMENTO = 'INVESTIMENTO',
  AMBOS = 'AMBOS'
}

export const MOTIVO_COMPRA_LABELS: Record<MotivoCompra, string> = {
  [MotivoCompra.NAO_INFORMADO]: 'Não Informado',
  [MotivoCompra.MORADIA]: 'Moradia',
  [MotivoCompra.INVESTIMENTO]: 'Investimento',
  [MotivoCompra.AMBOS]: 'Ambos'
};
