import { TipoProfissional } from './reserva.model';

export interface ProfissionalImobiliariaDTO {
  id: number;
  imobiliariaId: number;
  nomeImobiliaria: string;
  ativo: boolean;
  principal: boolean;
}

export interface ProfissionalDTO {
  id: number;
  usuarioId?: number | null;
  cpf?: string | null;
  nome: string;
  nomeGuerra?: string | null;
  telefone: string;
  email?: string | null;
  tipoProfissional?: TipoProfissional | null;
  numeroCreci?: string | null;
  ativo: boolean;
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
  usuarioId?: number | null;
  imobiliariaPrincipalId?: number | null;
  imobiliariaIds?: number[];
}

export interface ProfissionalCadastroRapidoDTO {
  nome: string;
  telefone: string;
  tipoProfissional?: TipoProfissional;
}