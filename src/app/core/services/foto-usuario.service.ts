import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MeusDadosService } from './meus-dados.service';

/**
 * Serviço centralizado para gerenciar a foto do usuário
 * Evita requisições duplicadas e gerencia cache com renovação automática
 */
@Injectable({
  providedIn: 'root'
})
export class FotoUsuarioService implements OnDestroy {
  private fotoUrl$ = new BehaviorSubject<string | null>(null);
  private refreshTimer: any = null;
  private carregando = false;

  constructor(private meusDadosService: MeusDadosService) {}

  /**
   * Observable da URL da foto (para components se inscreverem)
   * Carrega automaticamente na primeira chamada
   */
  getFotoUrl(): Observable<string | null> {
    // Carrega automaticamente na primeira vez (se não estiver já carregando)
    if (!this.carregando && this.fotoUrl$.value === null) {
      this.carregarFoto(false);
    }
    return this.fotoUrl$.asObservable();
  }

  /**
   * Carrega a foto do usuário (apenas se não estiver já carregando)
   * @param silencioso Se true, não conta como atividade do usuário
   */
  carregarFoto(silencioso: boolean = false): void {
    // Evita requisições duplicadas
    if (this.carregando) {
      return;
    }

    this.carregando = true;

    this.meusDadosService.obterFotoUrl(silencioso).subscribe({
      next: (response) => {
        // Backend retorna expiresIn (em inglês)
        const expiracao = response.expiresIn ?? 300;
        
        this.fotoUrl$.next(response.url);
        this.agendarRefresh(expiracao);
        this.carregando = false;
      },
      error: () => {
        this.fotoUrl$.next(null);
        this.carregando = false;
      }
    });
  }

  /**
   * Limpa foto e timers em memória (usado no logout/troca de usuário)
   */
  limparFoto(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.carregando = false;
    this.fotoUrl$.next(null);
  }

  /**
   * Força recarga da foto do usuário autenticado atual
   */
  recarregarFotoUsuarioAtual(): void {
    this.limparFoto();
    this.carregarFoto(false);
  }

  /**
   * Agenda refresh automático antes da URL expirar
   */
  private agendarRefresh(expiracaoSegundos: number): void {
    // Valida o valor de expiração
    if (!expiracaoSegundos || expiracaoSegundos <= 0) {
      console.error('[FotoUsuarioService] expiracaoSegundos inválido:', expiracaoSegundos);
      return;
    }
    
    // Limpa timer anterior
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Renova 30 segundos antes de expirar
    const tempoParaRenovar = Math.max(1000, (expiracaoSegundos - 30) * 1000);
    
    this.refreshTimer = setTimeout(() => {
      // Refresh automático é SILENCIOSO - não conta como atividade
      this.carregarFoto(true);
    }, tempoParaRenovar);
  }

  /**
   * Limpa recursos
   */
  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}
