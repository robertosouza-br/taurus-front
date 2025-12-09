import { Component, Input, Output, EventEmitter, TemplateRef, ContentChildren, QueryList, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Table } from 'primeng/table';
import { DataTableTemplateDirective } from './data-table-template.directive';

/**
 * Definição de coluna da tabela
 */
export interface TableColumn {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  pipe?: 'date' | 'currency' | 'number' | 'percent';
  pipeFormat?: string;
  align?: 'left' | 'center' | 'right';
  template?: string;
}

/**
 * Definição de ação da tabela
 */
export interface TableAction {
  icon: string;
  label?: string;
  tooltip?: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  visible?: (row: any) => boolean;
  disabled?: (row: any) => boolean;
  action: (row: any) => void;
}

/**
 * Componente genérico de tabela reutilizável
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnDestroy {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading = false;
  @Input() paginator = true;
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [10, 25, 50];
  @Input() emptyMessage = 'Nenhum registro encontrado';
  @Input() title?: string;
  @Input() showHeader = true;
  @Input() globalFilterFields: string[] = [];
  @Input() responsive = true;
  @Input() striped = true;
  @Input() hoverable = true;
  @Input() showGridlines = true;
  @Input() lazy = false; // Paginação lazy (server-side)
  @Input() totalRecords = 0; // Total de registros (para lazy loading)
  
  // Templates personalizados
  @Input() headerTemplate?: TemplateRef<any>;
  @Input() bodyTemplate?: TemplateRef<any>;
  @Input() emptyTemplate?: TemplateRef<any>;
  @Input() captionTemplate?: TemplateRef<any>;
  
  // Eventos
  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowUnselect = new EventEmitter<any>();
  @Output() onLazyLoad = new EventEmitter<any>(); // Evento para paginação lazy
  @Output() onSearch = new EventEmitter<string>(); // Evento para busca server-side

  private searchTimeout: any;

  searchValue = '';
  @ViewChild('dt') table?: Table;

  private templateDirectives?: QueryList<DataTableTemplateDirective>;
  private templateChangeSub?: Subscription;
  private templateRegistry = new Map<string, TemplateRef<any>>();

  @ContentChildren(DataTableTemplateDirective)
  set templates(value: QueryList<DataTableTemplateDirective>) {
    this.templateDirectives = value;
    this.registerTemplates();
    this.templateChangeSub?.unsubscribe();
    this.templateChangeSub = value?.changes.subscribe(() => this.registerTemplates());
  }

  /**
   * Obtém o valor de um campo aninhado (ex: 'usuario.nome')
   */
  getFieldValue(row: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], row);
  }

  /**
   * Verifica se uma ação deve ser visível
   */
  isActionVisible(action: TableAction, row: any): boolean {
    return action.visible ? action.visible(row) : true;
  }

  /**
   * Verifica se uma ação deve estar desabilitada
   */
  isActionDisabled(action: TableAction, row: any): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  /**
   * Executa uma ação
   */
  executeAction(action: TableAction, row: any): void {
    if (!this.isActionDisabled(action, row)) {
      action.action(row);
    }
  }

  /**
   * Limpa o filtro de busca
   */
  clearFilter(): void {
    this.searchValue = '';
    if (this.onSearch.observed) {
      this.onSearch.emit('');
    } else {
      this.table?.clear();
    }
  }

  /**
   * Manipula mudança de busca com debounce
   */
  onSearchChange(event: any): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.onSearch.emit(this.searchValue);
    }, 500); // 500ms de debounce
  }

  /**
   * Retorna classes CSS da tabela baseado nas configurações
   */
  getTableClass(): string {
    const classes = [];
    if (this.striped) classes.push('p-datatable-striped');
    if (this.showGridlines) classes.push('p-datatable-gridlines');
    if (this.hoverable) classes.push('p-datatable-hoverable-rows');
    return classes.join(' ');
  }

  /**
   * Recupera template customizado pelo nome
   */
  getTemplate(name?: string): TemplateRef<any> | undefined {
    if (!name) {
      return undefined;
    }
    return this.templateRegistry.get(name) || this.getLegacyTemplate(name);
  }

  /**
   * Resolve template específico para colunas
   */
  resolveColumnTemplate(column: TableColumn): TemplateRef<any> | undefined {
    return this.getTemplate(column.template);
  }

  ngOnDestroy(): void {
    this.templateChangeSub?.unsubscribe();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private registerTemplates(): void {
    this.templateRegistry.clear();
    this.templateDirectives?.forEach((directive) => {
      if (directive.templateName) {
        this.templateRegistry.set(directive.templateName, directive.template);
      }
    });
  }

  private getLegacyTemplate(name: string): TemplateRef<any> | undefined {
    if (name === 'header') {
      return this.headerTemplate;
    }
    if (name === 'body') {
      return this.bodyTemplate;
    }
    if (name === 'empty') {
      return this.emptyTemplate;
    }
    if (name === 'caption') {
      return this.captionTemplate;
    }
    return undefined;
  }
}

