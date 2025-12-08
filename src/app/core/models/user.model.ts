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
