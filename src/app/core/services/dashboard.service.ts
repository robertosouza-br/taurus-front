import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardDTO, NotificacaoDTO } from '../models/dashboard.model';

/**
 * Serviço para gerenciar dados do dashboard e notificações
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Obtém os dados completos do dashboard baseado no perfil do usuário
   * @returns Observable com dados do dashboard
   */
  getDashboard(): Observable<DashboardDTO> {
    return this.http.get<DashboardDTO>(this.apiUrl);
  }

  /**
   * Obtém apenas a lista de notificações do usuário
   * Ideal para atualizar apenas notificações sem carregar todo o dashboard
   * @returns Observable com array de notificações
   */
  getNotificacoes(): Observable<NotificacaoDTO[]> {
    return this.http.get<NotificacaoDTO[]>(`${this.apiUrl}/notificacoes`);
  }

  /**
   * Retorna o total de notificações pendentes para exibir no sino de alertas
   * Endpoint leve para polling frequente (ex: a cada 30 segundos)
   * @returns Observable com número total de notificações
   */
  getNotificacoesCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notificacoes/count`);
  }
}
