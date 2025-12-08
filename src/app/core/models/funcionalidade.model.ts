import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';

/**
 * DTO de Funcionalidade retornado pela API
 */
export interface FuncionalidadeDTO {
  codigo: Funcionalidade;
  nome: string;
  descricao: string;
  permissoesDisponiveis: Permissao[];
}

/**
 * DTO de Permissão retornado pela API
 */
export interface PermissaoDTO {
  codigo: Permissao;
  nome: string;
  descricao: string;
  icone: string;
}

/**
 * DTO para configurar permissões de um perfil
 */
export interface ConfiguracaoPermissaoDTO {
  perfilId: number;
  funcionalidade: string;
  permissoes: string[];
}

/**
 * DTO de Perfil retornado pela API
 */
export interface PerfilDTO {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissoes?: Record<string, string[]>;
}

/**
 * DTO de saída de Perfil
 */
export interface PerfilSaidaDTO {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissoes: Record<string, string[]>;
}

/**
 * DTO de entrada para criar/atualizar Perfil
 */
export interface PerfilEntradaDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  permissoes?: Record<string, string[]>;
}
