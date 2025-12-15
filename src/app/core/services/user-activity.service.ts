import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

/**
 * Serviço que monitora atividade do usuário e renova sessão automaticamente
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private activitySubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private isMonitoring = false;
  private readonly DEBOUNCE_TIME = 30000; // 30 segundos
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  private inactivityTimer: any = null;

  constructor(private authService: AuthService) {}

  /**
   * Inicia o monitoramento de atividade do usuário
   */
  iniciarMonitoramento(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Configura debounce para renovação de sessão
    this.activitySubject
      .pipe(
        debounceTime(this.DEBOUNCE_TIME),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.renovarSessao();
      });

    // Adiciona listeners de atividade
    this.adicionarListeners();

    // Inicia o timer de inatividade
    this.resetarTimerInatividade();
  }

  /**
   * Para o monitoramento de atividade
   */
  pararMonitoramento(): void {
    this.isMonitoring = false;
    this.removerListeners();
    
    // Limpa o timer de inatividade
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Adiciona listeners de eventos de atividade
   */
  private adicionarListeners(): void {
    document.addEventListener('click', this.onActivity);
    document.addEventListener('keydown', this.onActivity);
    document.addEventListener('scroll', this.onActivity);
    document.addEventListener('mousemove', this.onActivity);
  }

  /**
   * Remove listeners de eventos de atividade
   */
  private removerListeners(): void {
    document.removeEventListener('click', this.onActivity);
    document.removeEventListener('keydown', this.onActivity);
    document.removeEventListener('scroll', this.onActivity);
    document.removeEventListener('mousemove', this.onActivity);
  }

  /**
   * Handler de atividade do usuário
   */
  private onActivity = (): void => {
    if (this.authService.isAuthenticated) {
      this.activitySubject.next();
      this.resetarTimerInatividade();
      // Registra atividade no AuthService para controle de renovação de token
      this.authService.registrarAtividade();
    }
  };

  /**
   * Reseta o timer de inatividade
   */
  private resetarTimerInatividade(): void {
    // Limpa o timer anterior
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Inicia novo timer
    this.inactivityTimer = setTimeout(() => {
      this.authService.logout('Você foi desconectado por inatividade');
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Renova a sessão chamando o endpoint de refresh
   */
  private renovarSessao(): void {
    const usuario = this.authService.usuarioLogadoValue;
    
    if (!usuario) {
      return;
    }

    // Verifica se o refresh token ainda é válido
    const agora = new Date();
    if (usuario.refreshExpiracao <= agora) {
      this.authService.logout();
      return;
    }

    // Verifica se o access token está próximo de expirar (menos de 1 minuto)
    const umMinuto = 60 * 1000;
    const tempoRestante = usuario.expiracao.getTime() - agora.getTime();
    
    if (tempoRestante < umMinuto) {
      this.authService.renovarToken().subscribe({
        error: (error) => {
          console.error('Erro ao renovar sessão:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pararMonitoramento();
  }
}
