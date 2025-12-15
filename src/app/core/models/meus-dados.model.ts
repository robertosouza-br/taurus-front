/**
 * Interface para dados do usuário autenticado
 */
export interface MeusDadosDTO {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  apelido?: string;
  dataExpiracao?: string;
  ativo: boolean;
  perfis: PerfilResumoDTO[];
}

/**
 * Interface para resumo de perfil
 */
export interface PerfilResumoDTO {
  id: number;
  nome: string;
  descricao: string;
}

/**
 * Interface para atualização de dados pessoais
 */
export interface AtualizarMeusDadosDTO {
  nome: string;
  email: string;
  telefone?: string;
  apelido?: string;
}

/**
 * Interface para troca de senha
 */
export interface TrocarSenhaDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
}
