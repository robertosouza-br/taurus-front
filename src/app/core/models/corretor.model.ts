import { TipoContaBancariaProfissional } from './profissional.model';

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
 * DTO de entrada/saída para corretor
 * Usado tanto para criação/atualização quanto para busca por CPF
 */
export interface CorretorDTO {
  id?: string | null; // Legado: mantido por compatibilidade de contrato
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
  digitoConta?: string;
  tipoConta?: TipoContaBancariaProfissional;
  tipoChavePix?: TipoChavePix;
  chavePix?: string;
  ativo: boolean; // Obrigatório
}

/**
 * DTO de saída do corretor (retorno da API)
 */
export interface CorretorSaidaDTO extends CorretorDTO {
  codcfo?: string | null;
  idExterno?: string | null; // Legado: mantido para compatibilidade com fluxos antigos
  profissionalId?: number;
  usuarioId?: number;
  profissionalCriado?: boolean;
  usuarioCriado?: boolean;
  acessoHabilitado?: boolean;
}

export interface CorretorComboDTO {
  codigo: string;
  nome: string;
  cpf: string;
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
  codcfo?: string;
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
