import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * DTO para requisição de bloqueio/renovação
 */
export interface BloqueioUnidadeEntradaDTO {
  codEmpreendimento: number;
  bloco: string;
  unidade: string;
}

/**
 * DTO de resposta para bloquear e renovar bloqueio
 * Especificação API v3.0 (24/02/2026)
 * 
 * Usado em:
 * - POST /api/v1/reservas/unidades/bloquear
 * - PUT /api/v1/reservas/unidades/renovar-bloqueio
 */
export interface BloqueioCriadoDTO {
  bloqueado: boolean;
  tempoRestanteSegundos: number;
  dataHoraExpiracao: string;
  mensagem: string;
}

/**
 * DTO de resposta para consulta de status de bloqueio
 * Especificação API v3.0 (24/02/2026)
 * 
 * Usado em:
 * - GET /api/v1/reservas/unidades/status-bloqueio
 */
export interface BloqueioStatusDTO {
  bloqueado: boolean;
  tempoRestanteSegundos: number;
  dataHoraExpiracao: string | null;
  bloqueadoPorMim: boolean;
}

/**
 * Serviço para gerenciar bloqueio temporário de unidades
 * 
 * Sistema de bloqueio com controle de concorrência para garantir que apenas
 * um usuário possa criar/editar reserva por vez. Bloqueio tem duração de 5 minutos.
 * 
 * **Especificação v3.0 - 24/02/2026**
 * 
 * Endpoints disponíveis:
 * - POST /api/v1/reservas/unidades/bloquear - Bloqueia unidade por 5 minutos
 * - GET /api/v1/reservas/unidades/status-bloqueio - Verifica status do bloqueio
 * - DELETE /api/v1/reservas/unidades/liberar-bloqueio - Libera bloqueio manualmente
 * - PUT /api/v1/reservas/unidades/renovar-bloqueio - Renova bloqueio por mais 5 minutos
 * 
 * @Injectable
 */
@Injectable({
  providedIn: 'root'
})
export class ReservaBloqueioService {
  private readonly baseUrl = `${environment.apiUrl}/reservas/unidades`;

  constructor(private http: HttpClient) {}

  /**
   * Bloqueia uma unidade por 5 minutos
   * 
   * @param dados Dados da unidade a ser bloqueada
   * @returns Observable com status do bloqueio
   * 
   * **HTTP Status:**
   * - 200 OK: Bloqueio criado com sucesso
   * - 409 Conflict: Unidade já bloqueada por outro usuário
   */
  bloquear(dados: BloqueioUnidadeEntradaDTO): Observable<BloqueioCriadoDTO> {
    return this.http.post<BloqueioCriadoDTO>(
      `${this.baseUrl}/bloquear`,
      dados
    ).pipe(
      catchError(error => {
        console.error('Erro ao bloquear unidade:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica o status de bloqueio de uma unidade
   * 
   * **Use este endpoint ao carregar a página ou dar refresh para obter o tempo restante atualizado.**
   * 
   * @param codEmpreendimento Código do empreendimento
   * @param bloco Número do bloco
   * @param unidade Número da unidade
   * @returns Observable com status do bloqueio
   * 
   * **HTTP Status:**
   * - 200 OK: Retorna status do bloqueio (bloqueada ou não)
   */
  consultarStatus(
    codEmpreendimento: number,
    bloco: string,
    unidade: string
  ): Observable<BloqueioStatusDTO> {
    const params = new HttpParams()
      .set('codEmpreendimento', codEmpreendimento.toString())
      .set('bloco', bloco)
      .set('unidade', unidade);

    return this.http.get<BloqueioStatusDTO>(
      `${this.baseUrl}/status-bloqueio`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Erro ao consultar status de bloqueio:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Libera o bloqueio de uma unidade manualmente
   * 
   * Apenas o usuário que bloqueou pode liberar.
   * 
   * @param codEmpreendimento Código do empreendimento
   * @param bloco Número do bloco
   * @param unidade Número da unidade
   * @returns Observable (204 No Content em caso de sucesso)
   * 
   * **HTTP Status:**
   * - 204 No Content: Bloqueio liberado com sucesso
   */
  liberar(
    codEmpreendimento: number,
    bloco: string,
    unidade: string
  ): Observable<void> {
    const params = new HttpParams()
      .set('codEmpreendimento', codEmpreendimento.toString())
      .set('bloco', bloco)
      .set('unidade', unidade);

    return this.http.delete<void>(
      `${this.baseUrl}/liberar-bloqueio`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Erro ao liberar bloqueio:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Renova o bloqueio por mais 5 minutos
   * 
   * Apenas o usuário que bloqueou pode renovar.
   * 
   * @param dados Dados da unidade a renovar bloqueio
   * @returns Observable com novo status do bloqueio
   * 
   * **HTTP Status:**
   * - 200 OK: Bloqueio renovado com sucesso
   * - 404 Not Found: Bloqueio não encontrado ou expirado
   */
  renovar(dados: BloqueioUnidadeEntradaDTO): Observable<BloqueioCriadoDTO> {
    return this.http.put<BloqueioCriadoDTO>(
      `${this.baseUrl}/renovar-bloqueio`,
      dados
    ).pipe(
      catchError(error => {
        console.error('Erro ao renovar bloqueio:', error);
        return throwError(() => error);
      })
    );
  }
}
