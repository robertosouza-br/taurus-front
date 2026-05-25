import { TipoProfissional } from './reserva.model';

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

export interface ProfissionalDTO {
  id: number;
  cpf?: string | null;
  nome: string;
  nomeGuerra?: string | null;
  telefone: string;
  email?: string | null;
  tipoProfissional?: TipoProfissional | null;
  numeroCreci?: string | null;
  ativo: boolean;
  imobiliariaPrincipalId?: number | null;
  imobiliarias?: ProfissionalImobiliariaDTO[];
}

export interface ProfissionalCreateDTO {
  cpf?: string | null;
  nome: string;
  nomeGuerra?: string | null;
  telefone: string;
  email?: string | null;
  tipoProfissional?: TipoProfissional | null;
  numeroCreci?: string | null;
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