/**
 * Enums
 */
export enum TipoImobiliaria {
  PRINCIPAL = 'PRINCIPAL',
  PARCEIRO = 'PARCEIRO'
}

export enum TipoConta {
  CONTA_CORRENTE = 1,
  CONTA_POUPANCA = 2
}

export enum TipoChavePixImobiliaria {
  CPF_CNPJ = 1,
  EMAIL = 2,
  TELEFONE = 3,
  CHAVE_ALEATORIA = 4
}

export enum UF {
  AC = 'AC',
  AL = 'AL',
  AP = 'AP',
  AM = 'AM',
  BA = 'BA',
  CE = 'CE',
  DF = 'DF',
  ES = 'ES',
  GO = 'GO',
  MA = 'MA',
  MT = 'MT',
  MS = 'MS',
  MG = 'MG',
  PA = 'PA',
  PB = 'PB',
  PR = 'PR',
  PE = 'PE',
  PI = 'PI',
  RJ = 'RJ',
  RN = 'RN',
  RS = 'RS',
  RO = 'RO',
  RR = 'RR',
  SC = 'SC',
  SP = 'SP',
  SE = 'SE',
  TO = 'TO'
}

/**
 * Interface de Documento da Imobiliária
 */
export interface DocumentoImobiliaria {
  path: string;
}

/**
 * Interface de Imagem da Imobiliária
 */
export interface ImagemImobiliaria {
  id: number | null;
  imobiliariaId: number;
  nomeArquivo: string;
  url: string;
  tipoImagem?: string;
  descricao?: string;
  ordem?: number;
  principal: boolean;
  ativo: boolean;
  dataCriacao?: string;
  usuarioCriacao?: string;
}

/**
 * Interface principal de Imobiliária
 */
export interface Imobiliaria {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  alias?: string;
  cnpj: string;
  tipoImobiliaria: TipoImobiliaria;
  percentualComissao?: number;
  cep: string;
  logradouro: string;
  numeroImovel?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: UF;
  telefone?: string;
  emailContato: string;
  responsavel?: string;
  website?: string;
  bancoId?: number;
  numeroAgencia?: string;
  numeroContaCorrente?: string;
  tipoConta?: TipoConta;
  tipoChavePix?: TipoChavePixImobiliaria;
  chavePix?: string;
  codigosEmpreendimentos?: number[];
  empreendimentos?: string[];
  documentos?: DocumentoImobiliaria[];
  ativo: boolean;
}

/**
 * DTO para criação e edição de imobiliária
 */
export interface ImobiliariaFormDTO {
  razaoSocial: string;
  nomeFantasia: string;
  alias?: string;
  cnpj: string;
  tipoImobiliaria: TipoImobiliaria;
  percentualComissao?: number;
  cep: string;
  logradouro: string;
  numeroImovel?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: UF;
  telefone?: string;
  emailContato: string;
  responsavel?: string;
  website?: string;
  bancoId?: number;
  numeroAgencia?: string;
  numeroContaCorrente?: string;
  tipoConta?: TipoConta;
  tipoChavePix?: TipoChavePixImobiliaria;
  chavePix?: string;
  codigosEmpreendimentos?: number[];
}

/**
 * DTO para filtros de busca
 */
export interface ImobiliariaFiltroDTO {
  page?: number;
  size?: number;
  search?: string;
}

/**
 * Labels para os tipos de imobiliária
 */
export const TIPO_IMOBILIARIA_LABELS: Record<TipoImobiliaria, string> = {
  [TipoImobiliaria.PRINCIPAL]: 'Principal',
  [TipoImobiliaria.PARCEIRO]: 'Parceiro'
};

/**
 * Labels para os tipos de conta
 */
export const TIPO_CONTA_LABELS: Record<TipoConta, string> = {
  [TipoConta.CONTA_CORRENTE]: 'Conta Corrente',
  [TipoConta.CONTA_POUPANCA]: 'Conta Poupança'
};

/**
 * Labels para os tipos de chave PIX
 */
export const TIPO_CHAVE_PIX_IMOBILIARIA_LABELS: Record<TipoChavePixImobiliaria, string> = {
  [TipoChavePixImobiliaria.CPF_CNPJ]: 'CPF/CNPJ',
  [TipoChavePixImobiliaria.EMAIL]: 'E-mail',
  [TipoChavePixImobiliaria.TELEFONE]: 'Telefone',
  [TipoChavePixImobiliaria.CHAVE_ALEATORIA]: 'Chave Aleatória'
};

/**
 * Array de UFs para dropdown
 */
export const UF_OPTIONS = Object.values(UF);
