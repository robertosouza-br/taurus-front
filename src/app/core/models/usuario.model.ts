import { PerfilDTO } from './funcionalidade.model';

/**
 * DTO de entrada para criação de usuário
 * Nota: senha é gerada automaticamente pelo backend
 */
export interface UsuarioEntradaDTO {
  nome: string;
  email: string;
  ativo: boolean;
  perfisIds: number[]; // Array com IDs dos perfis
}

/**
 * DTO para atualização de dados gerais do usuário
 */
export interface UsuarioAtualizacaoDTO {
  nome: string;
  email: string;
  ativo: boolean;
  perfisIds: number[]; // Array com IDs dos perfis
  resetarSenha?: boolean; // Opcional: gerar nova senha
}

/**
 * DTO para vincular perfis ao usuário
 */
export interface UsuarioPerfisDTO {
  perfilIds: number[]; // Front garante envio de apenas 1 elemento
}

/**
 * DTO para alteração de senha
 */
export interface AlteracaoSenhaDTO {
  senhaAtual: string;
  novaSenha: string;
}

/**
 * DTO de saída do usuário (retorno da API)
 */
export interface UsuarioSaidaDTO {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  perfis: PerfilDTO[];
  senhaGerada?: string; // Opcional: senha gerada pelo backend em ambiente de teste
}

/**
 * Interface para exibição de usuário na tabela
 */
export interface UsuarioListaDTO {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  perfil?: string; // Nome do perfil principal para exibição
}
