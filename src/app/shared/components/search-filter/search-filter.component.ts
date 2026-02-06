import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';

/**
 * Componente de filtro de busca padronizado
 * 
 * @example
 * ```html
 * <app-search-filter
 *   [value]="filtro.search"
 *   [label]="'Buscar por nome...'"
 *   [debounceTime]="500"
 *   (onSearch)="onBuscar($event)"
 *   (onClear)="limparBusca()">
 * </app-search-filter>
 * ```
 */
@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnDestroy {
  /**
   * Valor atual do campo de busca
   */
  @Input() value?: string;

  /**
   * Label do campo (float label)
   */
  @Input() label = 'Buscar...';

  /**
   * Tempo de debounce em milissegundos (0 = desabilitado)
   */
  @Input() debounceTime = 500;

  /**
   * Se deve buscar ao digitar (com debounce)
   */
  @Input() searchOnType = true;

  /**
   * Desabilita o campo
   */
  @Input() disabled = false;

  /**
   * Placeholder alternativo (quando não quer usar float label)
   */
  @Input() placeholder?: string;

  /**
   * Evento emitido ao buscar (Enter ou após debounce)
   */
  @Output() onSearch = new EventEmitter<string>();

  /**
   * Evento emitido ao limpar
   */
  @Output() onClear = new EventEmitter<void>();

  /**
   * Evento emitido a cada mudança no input (sem debounce)
   */
  @Output() onChange = new EventEmitter<string>();

  private searchTimeout: any;

  /**
   * Handler de input com debounce
   */
  handleInput(value: string): void {
    this.onChange.emit(value);

    if (!this.searchOnType || this.debounceTime === 0) {
      return;
    }

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.onSearch.emit(value);
    }, this.debounceTime);
  }

  /**
   * Handler de Enter
   */
  handleEnter(value: string): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.onSearch.emit(value);
  }

  /**
   * Handler de limpar
   */
  handleClear(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.value = '';
    this.onClear.emit();
    this.onSearch.emit('');
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
