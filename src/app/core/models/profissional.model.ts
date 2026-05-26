import { TipoProfissional } from './reserva.model';

export type CargoProfissional = TipoProfissional;

export enum TipoContaBancariaProfissional {
  CORRENTE = 'CORRENTE',
  POUPANCA = 'POUPANCA',
  SALARIO = 'SALARIO'
}

export enum TipoChavePixProfissional {
  CPF = 'CPF',
  CELULAR = 'CELULAR',
  EMAIL = 'EMAIL',
  CHAVE_ALEATORIA = 'CHAVE_ALEATORIA'
}

export const TIPO_CONTA_BANCARIA_PROFISSIONAL_LABELS: Record<TipoContaBancariaProfissional, string> = {
  [TipoContaBancariaProfissional.CORRENTE]: 'Corrente',
  [TipoContaBancariaProfissional.POUPANCA]: 'Poupança',
  [TipoContaBancariaProfissional.SALARIO]: 'Salário'
};

export const TIPO_CHAVE_PIX_PROFISSIONAL_LABELS: Record<TipoChavePixProfissional, string> = {
  [TipoChavePixProfissional.CPF]: 'CPF',
  [TipoChavePixProfissional.CELULAR]: 'Celular',
  [TipoChavePixProfissional.EMAIL]: 'E-mail',
  [TipoChavePixProfissional.CHAVE_ALEATORIA]: 'Chave Aleatória'
};

export interface ProfissionalImobiliariaDTO {
  id: number;
  imobiliariaId: number;
  nomeImobiliaria: string;
  tipoProfissional?: TipoProfissional | null;
  ativo: boolean;
  principal: boolean;
}

export interface ProfissionalImobiliariaInputDTO {
  imobiliariaId: number;
  tipoProfissional?: TipoProfissional | null;
  principal?: boolean;
  ativo?: boolean;
}

export enum StatusJornadaProfissional {
  RASCUNHO = 'RASCUNHO',
  COMPLETO_SEM_ACESSO = 'COMPLETO_SEM_ACESSO',
  COMPLETO_COM_ACESSO = 'COMPLETO_COM_ACESSO'
}

export interface ProfissionalAcessoDTO {
  usuarioId?: number | null;
  possuiAcessoSistema: boolean;
  usuarioAtivo: boolean;
  possuiPerfilCorretor: boolean;
}

export interface ProfissionalJornadaDTO {
  status: StatusJornadaProfissional;
  cadastroCompleto: boolean;
  permiteHabilitarAcesso: boolean;
  permiteLogin: boolean;
  pendenciasCadastro: string[];
}

export interface ProfissionalHabilitarAcessoDTO {
  email: string;
  dataExpiracao?: string | null;
  enviarEmailBoasVindas: boolean;
}

export interface ProfissionalDTO {
  id: number;
  cpf?: string | null;
  nome: string;
  nomeGuerra?: string | null;
  telefone: string;
  email?: string | null;
  usuarioId?: number | null;
  cargo?: CargoProfissional | null;
  tipoProfissional?: TipoProfissional | null;
  numeroCreci?: string | null;
  orgaoCreci?: string | null;
  estadoIdentidade?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
  pais?: string | null;
  numeroBanco?: string | null;
  numeroAgencia?: string | null;
  numeroContaCorrente?: string | null;
  digitoConta?: string | null;
  tipoConta?: TipoContaBancariaProfissional | null;
  tipoChavePix?: TipoChavePixProfissional | null;
  chavePix?: string | null;
  ativo: boolean;
  acesso?: ProfissionalAcessoDTO | null;
  jornada?: ProfissionalJornadaDTO | null;
  imobiliariaPrincipalId?: number | null;
  imobiliarias?: ProfissionalImobiliariaDTO[];
}

export interface ProfissionalCreateDTO {
  cpf?: string | null;
  nome: string;
  nomeGuerra?: string | null;
  telefone: string;
  email?: string | null;
  usuarioId?: number | null;
  cargo?: CargoProfissional | null;
  tipoProfissional?: TipoProfissional | null;
  numeroCreci?: string | null;
  orgaoCreci?: string | null;
  estadoIdentidade?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  estado?: string | null;
  cidade?: string | null;
  pais?: string | null;
  numeroBanco?: string | null;
  numeroAgencia?: string | null;
  numeroContaCorrente?: string | null;
  digitoConta?: string | null;
  tipoConta?: TipoContaBancariaProfissional | null;
  tipoChavePix?: TipoChavePixProfissional | null;
  chavePix?: string | null;
  ativo?: boolean;
  imobiliariaPrincipalId?: number | null;
  imobiliariaIds?: number[];
  imobiliarias?: ProfissionalImobiliariaInputDTO[];
}

export type ProfissionalEntradaDTO = ProfissionalCreateDTO;

export interface ProfissionalCadastroRapidoDTO {
  nome: string;
  telefone: string;
  tipoProfissional?: TipoProfissional;
}