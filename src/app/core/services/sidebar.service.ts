import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Serviço para gerenciar o estado da sidebar
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isExpandedSubject = new BehaviorSubject<boolean>(false);
  public isExpanded$: Observable<boolean> = this.isExpandedSubject.asObservable();

  /**
   * Alterna o estado da sidebar
   */
  toggle(): void {
    this.isExpandedSubject.next(!this.isExpandedSubject.value);
  }

  /**
   * Define o estado da sidebar
   */
  setExpanded(expanded: boolean): void {
    this.isExpandedSubject.next(expanded);
  }

  /**
   * Obtém o estado atual da sidebar
   */
  get isExpanded(): boolean {
    return this.isExpandedSubject.value;
  }
}
