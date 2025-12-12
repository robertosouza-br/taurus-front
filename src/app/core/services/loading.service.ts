import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Serviço para controlar o estado de loading global da aplicação
 * Utilizado para exibir/ocultar o spinner de loading com overlay
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('');
  
  /**
   * Observable do estado de loading
   */
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  
  /**
   * Observable da mensagem de loading
   */
  public message$: Observable<string> = this.messageSubject.asObservable();

  /**
   * Exibe o loading com mensagem opcional
   * @param message Mensagem a ser exibida
   */
  show(message: string = 'Carregando...'): void {
    this.messageSubject.next(message);
    this.loadingSubject.next(true);
  }

  /**
   * Oculta o loading
   */
  hide(): void {
    this.loadingSubject.next(false);
    this.messageSubject.next('');
  }

  /**
   * Retorna o estado atual de loading
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
