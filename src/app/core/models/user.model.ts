import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';

/**
 * Modelo de usuário do sistema
 * Representa os dados do usuário autenticado
 */
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
}

/**
 * Credenciais de login
 */
export interface LoginCredentials {
  email: string;
  senha: string;
}

/**
 * Resposta de autenticação da API
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

/**
 * Payload decodificado do JWT
 */
export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * Resposta do endpoint de login com permissões granulares
 */
export interface LoginResponse {
  token: string;
  expiracao: string;
  usuario: string;
  nomeUsuario: string;
  permissoes: Record<Funcionalidade, Permissao[]>;
}

/**
 * Usuário logado com permissões estruturadas
 */
export interface UsuarioLogado {
  email: string;
  nome: string;
  token: string;
  expiracao: Date;
  permissoes: Map<Funcionalidade, Set<Permissao>>;
}
