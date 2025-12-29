/**
 * Enums
 */
export enum CorretorCargo {
  CORRETOR = 'CORRETOR',
  DIRETOR = 'DIRETOR',
  GERENTE = 'GERENTE',
  PARCEIRO = 'PARCEIRO'
}

export enum TipoChavePix {
  CPF = 'CPF',
  CELULAR = 'CELULAR',
  EMAIL = 'EMAIL',
  CHAVE_ALEATORIA = 'CHAVE_ALEATORIA'
}

/**
 * Interface para Banco
 */
export interface Banco {
  id: number;
  codigo: string;
  nome: string;
}

/**
 * DTO de entrada/saída para corretor
 * Usado tanto para criação/atualização quanto para busca por CPF
 */
export interface CorretorDTO {
  id?: string; // ID do sistema RMS (retornado pela API ao buscar por CPF)
  nome: string;
  cpf: string; // CPF formatado: 000.000.000-00
  email?: string;
  nomeGuerra?: string;
  telefone?: string;
  numeroCreci?: string;
  cargo: CorretorCargo;
  numeroBanco?: string;
  numeroAgencia?: string;
  numeroContaCorrente?: string;
  tipoConta?: string;
  tipoChavePix?: TipoChavePix;
  chavePix?: string;
  ativo: boolean; // Obrigatório
}

/**
 * DTO de saída do corretor (retorno da API)
 */
export interface CorretorSaidaDTO extends CorretorDTO {
  idExterno: string; // ID do sistema externo RMS
}

/**
 * Interface para exibição de corretor na tabela
 */
export interface CorretorListaDTO {
  idExterno: string;
  cpf: string;
  nome: string;
  telefone?: string;
  cargo: CorretorCargo;
  ativo: boolean;
  email?: string;
}

/**
 * Labels para os cargos
 */
export const CARGO_LABELS: Record<CorretorCargo, string> = {
  [CorretorCargo.CORRETOR]: 'Corretor',
  [CorretorCargo.DIRETOR]: 'Diretor',
  [CorretorCargo.GERENTE]: 'Gerente',
  [CorretorCargo.PARCEIRO]: 'Parceiro'
};

/**
 * Labels para os tipos de chave PIX
 */
export const TIPO_CHAVE_PIX_LABELS: Record<TipoChavePix, string> = {
  [TipoChavePix.CPF]: 'CPF',
  [TipoChavePix.CELULAR]: 'Celular',
  [TipoChavePix.EMAIL]: 'E-mail',
  [TipoChavePix.CHAVE_ALEATORIA]: 'Chave Aleatória'
};
