import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Evento de mudança de página
 */
export interface PageChangeEvent {
  page: number;
  rows: number;
  first: number;
}

/**
 * Componente de paginação para cards e listas customizadas
 * 
 * @example
 * ```html
 * <app-card-paginator
 *   [rows]="12"
 *   [totalRecords]="totalRegistros"
 *   [currentPage]="currentPage"
 *   [loading]="carregando"
 *   [template]="'Mostrando {first} a {last} de {totalRecords} itens'"
 *   (onPageChange)="onPageChange($event)">
 * </app-card-paginator>
 * ```
 */
@Component({
  selector: 'app-card-paginator',
  templateUrl: './card-paginator.component.html',
  styleUrls: ['./card-paginator.component.scss']
})
export class CardPaginatorComponent {
  /**
   * Número de itens por página
   */
  @Input() rows = 12;

  /**
   * Total de registros
   */
  @Input() totalRecords = 0;

  /**
   * Página atual (0-indexed)
   */
  @Input() currentPage = 0;

  /**
   * Mostra opções de registros por página
   * @default false
   */
  @Input() showRowsPerPage = false;

  /**
   * Opções de registros por página (quando showRowsPerPage = true)
   */
  @Input() rowsPerPageOptions: number[] = [12, 24, 48, 96];

  /**
   * Template de exibição customizado
   * Use {first}, {last}, {totalRecords} como placeholders
   */
  @Input() template = 'Mostrando {first} a {last} de {totalRecords} registros';

  /**
   * Estado de carregamento (bloqueia mudanças de página)
   */
  @Input() loading = false;

  /**
   * Evento emitido ao mudar de página
   */
  @Output() onPageChange = new EventEmitter<PageChangeEvent>();

  /**
   * Calcula o primeiro índice da página atual
   */
  get first(): number {
    return this.currentPage * this.rows;
  }

  /**
   * Handler de mudança de página do PrimeNG
   */
  handlePageChange(event: any): void {
    if (this.loading) {
      return;
    }
    
    this.onPageChange.emit({
      page: event.page,
      rows: event.rows,
      first: event.first
    });
  }
}
