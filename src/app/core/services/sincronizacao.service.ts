import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SincronizacaoEmpreendimentosSaidaDTO, UltimaSincronizacaoEmpreendimentosSaidaDTO } from '../models/sincronizacao.model';

/**
 * Serviço para sincronização administrativa de empreendimentos e unidades
 * 
 * ENDPOINTS DISPONÍVEIS:
 * - GET /api/inicializacao/ultima-sincronizacao-empreendimentos-unidades
 * - POST /api/inicializacao/sincronizar-empreendimentos-unidades
 * 
 * IMPORTANTE:
 * - Esta operação pode levar alguns segundos ou minutos dependendo do volume
 * - Sincroniza empreendimentos, blocos e unidades da fonte externa TOTVS
 * - Retorna resumo consolidado com totais e detalhamento por empreendimento
 * - Existe uma rotina automática diária às 03:00 (America/Sao_Paulo)
 * - A ação manual não substitui a rotina agendada
 * 
 * OBSERVAÇÃO DE SEGURANÇA:
 * - Atualmente a rota está em /api/inicializacao/** que está liberada
 * - Deve ser tratada como funcionalidade administrativa no front
 * - Evolução futura: migrar para /api/v1/administracao/sincronizacoes
 */
@Injectable({
  providedIn: 'root'
})
export class SincronizacaoService {
  private readonly baseUrl = `${environment.apiUrl.replace('/api/v1', '')}/api/inicializacao`;

  constructor(private http: HttpClient) {}

  /**
   * Consulta a última sincronização registrada na base interna
   * 
   * IMPORTANTE:
   * - Retorna resumo consolidado da última sincronização
   * - Útil para exibir ao abrir a tela administrativa
   * - Deve ser chamado novamente após sincronização manual bem-sucedida
   * 
   * @returns Observable com resumo da última sincronização registrada
   */
  consultarUltimaSincronizacao(): Observable<UltimaSincronizacaoEmpreendimentosSaidaDTO> {
    return this.http.get<UltimaSincronizacaoEmpreendimentosSaidaDTO>(
      `${this.baseUrl}/ultima-sincronizacao-empreendimentos-unidades`
    );
  }

  /**
   * Executa sincronização manual de empreendimentos, blocos e unidades
   * 
   * ATENÇÃO:
   * - Operação pode demorar vários segundos/minutos
   * - Implemente loading/spinner na UI
   * - Bloqueie novas execuções até retornar resposta
   * - Exiba resumo consolidado e detalhamento por empreendimento
   * 
   * @returns Observable com resumo da sincronização executada
   */
  sincronizarEmpreendimentosUnidades(): Observable<SincronizacaoEmpreendimentosSaidaDTO> {
    return this.http.post<SincronizacaoEmpreendimentosSaidaDTO>(
      `${this.baseUrl}/sincronizar-empreendimentos-unidades`,
      {}
    );
  }
}
