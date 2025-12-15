import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para solicitação de recuperação de senha
 */
export interface SolicitarRecuperacaoDTO {
  cpf: string;
}

/**
 * Interface para validação de código
 */
export interface ValidarCodigoDTO {
  cpf: string;
  codigo: string;
}

/**
 * Interface para redefinição de senha
 */
export interface RedefinirSenhaDTO {
  cpf: string;
  codigo: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
}

/**
 * Interface para resposta de solicitação de código
 */
export interface SolicitarRecuperacaoResponse {
  message: string;
  emailMascarado?: string;
}

/**
 * Interface para resposta de validação de código
 */
export interface ValidarCodigoResponse {
  message: string;
  codigoValido: boolean;
}

/**
 * Serviço para recuperação de senha
 */
@Injectable({
  providedIn: 'root'
})
export class RecuperarSenhaService {
  private readonly apiUrl = `${environment.apiUrl}/auth/recuperar-senha`;

  constructor(private http: HttpClient) {}

  /**
   * Solicita código de recuperação de senha
   * Endpoint: POST /api/v1/auth/recuperar-senha/solicitar
   */
  solicitarRecuperacao(cpf: string): Observable<SolicitarRecuperacaoResponse> {
    const body: SolicitarRecuperacaoDTO = { cpf };
    return this.http.post<SolicitarRecuperacaoResponse>(`${this.apiUrl}/solicitar`, body);
  }

  /**
   * Valida código de recuperação
   * Endpoint: POST /api/v1/auth/recuperar-senha/validar
   */
  validarCodigo(cpf: string, codigo: string): Observable<ValidarCodigoResponse> {
    const body: ValidarCodigoDTO = { cpf, codigo };
    return this.http.post<ValidarCodigoResponse>(`${this.apiUrl}/validar`, body);
  }

  /**
   * Redefine a senha do usuário
   * Endpoint: POST /api/v1/auth/recuperar-senha/redefinir
   */
  redefinirSenha(
    cpf: string,
    codigo: string,
    novaSenha: string,
    confirmacaoNovaSenha: string
  ): Observable<void> {
    const body: RedefinirSenhaDTO = {
      cpf,
      codigo,
      novaSenha,
      confirmacaoNovaSenha
    };
    return this.http.post<void>(`${this.apiUrl}/redefinir`, body);
  }
}
