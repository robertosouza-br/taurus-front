import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * DTO para requisição de bloqueio
 */
export interface BloqueioUnidadeEntradaDTO {
  codEmpreendimento: number;
  bloco: string;
  unidade: string;
}

/**
 * DTO de resposta unificado para bloqueio e status
 * Especificação API - Mapa de Integração (25/02/2026)
 * 
 * Usado em:
 * - POST /api/v1/reservas/unidades/bloquear
 * - GET /api/v1/reservas/unidades/status-bloqueio
 * - POST /api/v1/reservas/unidades/renovar
 */
export interface BloqueioUnidadeDTO {
  codEmpreendimento: number;
  bloco: string;
  unidade: string;
  usuarioCpf: string | null;
  dataHoraBloqueio: string | null;
  dataHoraExpiracao: string | null;
  tempoRestanteSegundos: number;
  bloqueado: boolean;
  bloqueadoPorOutroUsuario: boolean;
}

/**
 * Serviço para gerenciar bloqueio temporário de unidades
 * 
 * Sistema de bloqueio com controle de concorrência para garantir que apenas
 * um usuário possa criar/editar reserva por vez. Bloqueio tem duração de 5 minutos FIXOS.
 * 
 * **Especificação - Mapa de Integração - 25/02/2026**
 * 
 * Endpoints disponíveis:
 * - POST /api/v1/reservas/unidades/bloquear - Bloqueia unidade por 5 minutos
 * - GET /api/v1/reservas/unidades/status-bloqueio - Verifica status do bloqueio
 * - DELETE /api/v1/reservas/unidades/liberar - Libera bloqueio manualmente
 * 
 * **IMPORTANTE:**
 * Bloqueios NÃO podem ser renovados. Uma vez criado, o bloqueio expira em exatamente 5 minutos.
 * O frontend deve alertar o usuário quando restar 30 segundos.
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
   * - 200 OK: Bloqueio criado (verificar campo bloqueadoPorOutroUsuario)
   * - 409 Conflict: Unidade já bloqueada por outro usuário
   * 
   * **Importante:** Response pode ter bloqueadoPorOutroUsuario: true mesmo com status 200.
   * Sempre verificar este campo para decidir se permite acesso.
   */
  bloquear(dados: BloqueioUnidadeEntradaDTO): Observable<BloqueioUnidadeDTO> {
    return this.http.post<BloqueioUnidadeDTO>(
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
   * @returns Observable com status do bloqueio (inclui campo bloqueadoPorOutroUsuario)
   * 
   * **HTTP Status:**
   * - 200 OK: Retorna status do bloqueio (bloqueada ou não)
   */
  consultarStatus(
    codEmpreendimento: number,
    bloco: string,
    unidade: string
  ): Observable<BloqueioUnidadeDTO> {
    const params = new HttpParams()
      .set('codEmpreendimento', codEmpreendimento.toString())
      .set('bloco', bloco)
      .set('unidade', unidade);

    return this.http.get<BloqueioUnidadeDTO>(
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
   * - 404 Not Found: Bloqueio não encontrado
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
      `${this.baseUrl}/liberar`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Erro ao liberar bloqueio:', error);
        return throwError(() => error);
      })
    );
  }
}
