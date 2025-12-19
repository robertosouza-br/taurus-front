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
 * DTO de entrada para criação/atualização de corretor
 */
export interface CorretorDTO {
  nome: string;
  cpf: string; // 11 dígitos numéricos, sem máscara
  email: string;
  nomeGuerra?: string;
  telefone?: string;
  numeroCreci?: string;
  cargo: CorretorCargo;
  banco?: Banco;
  agencia?: string;
  conta?: string;
  digitoConta?: string;
  tipoChavePix?: TipoChavePix;
  chavePix?: string;
  ativo: boolean;
}

/**
 * DTO de saída do corretor (retorno da API)
 */
export interface CorretorSaidaDTO extends CorretorDTO {
  id: string; // ID do sistema externo
  idSistemaExterno?: string; // ID alternativo se houver
}

/**
 * Interface para exibição de corretor na tabela
 */
export interface CorretorListaDTO {
  id: string;
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
