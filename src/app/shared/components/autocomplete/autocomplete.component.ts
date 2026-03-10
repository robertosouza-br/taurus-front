import { Component, Input, forwardRef, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoComplete } from 'primeng/autocomplete';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, OnChanges {
  @ViewChild('autoComplete') autoComplete!: AutoComplete;

  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = 'Digite para buscar...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() field: string = 'nome'; // Campo a ser exibido
  @Input() dataKey: string = ''; // Campo que contém o ID (se definido, retorna apenas o ID)
  @Input() suggestions: any[] = []; // Sugestões filtradas
  @Input() emptyMessage: string = 'Nenhum resultado encontrado';
  @Input() itemTemplate: any = null; // Template customizado para os itens
  @Input() appendTo: any = 'body';
  @Input() panelStyleClass: string = 'app-autocomplete-panel';
  
  @Output() completeMethod = new EventEmitter<any>(); // Evento de filtro
  @Output() onSelect = new EventEmitter<any>(); // Evento de seleção
  @Output() onDropdownClick = new EventEmitter<void>(); // Evento ao clicar para expandir

  value: any = null;
  touched: boolean = false;
  isFocused: boolean = false;
  private _generatedId: string = `autocomplete-${Math.random().toString(36).substr(2, 9)}`;
  private _pendingValue: any = null; // Armazena valor pendente até suggestions serem carregadas
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    // Quando suggestions mudarem e houver um valor pendente, tenta encontrar o objeto
    if (changes['suggestions'] && this.suggestions.length > 0 && this._pendingValue !== null) {
      this.resolverValorPendente();
    }
  }

  writeValue(value: any): void {
    // Se dataKey estiver definido e value for um ID, busca o objeto completo nas suggestions
    if (this.dataKey && value && typeof value !== 'object') {
      if (this.suggestions.length > 0) {
        const foundItem = this.suggestions.find(item => item[this.dataKey] === value);
        this.value = foundItem || null;
        this._pendingValue = null;
      } else {
        // Suggestions ainda não foram carregadas, armazena valor pendente
        this._pendingValue = value;
        this.value = null;
      }
    } else {
      this.value = value;
      this._pendingValue = null;
    }
  }

  private resolverValorPendente(): void {
    if (this._pendingValue !== null && this.dataKey) {
      const foundItem = this.suggestions.find(item => item[this.dataKey] === this._pendingValue);
      if (foundItem) {
        this.value = foundItem;
        this._pendingValue = null;
      }
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(event: any): void {
    this.value = event;
    
    // Se dataKey estiver definido, retorna apenas o ID/valor da propriedade especificada
    const valueToEmit = this.dataKey && event && typeof event === 'object' 
      ? event[this.dataKey] 
      : event;
    
    this.onChange(valueToEmit);
    this.onSelect.emit(event); // Evento sempre emite o objeto completo
  }

  onFilter(event: any): void {
    this.completeMethod.emit(event);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.touched = true;
    this.onTouched();
  }

  mostrarTodasOpcoes(): void {
    if (this.disabled) {
      return;
    }

    // Permite que o pai carregue todas as opções antes de abrir o dropdown
    this.onDropdownClick.emit();

    // Aguarda o ciclo de mudança para aplicar sugestões e abrir
    setTimeout(() => {
      if (this.autoComplete) {
        this.autoComplete.show();
      }
    }, 50);
  }

  get inputId(): string {
    return this.id || this._generatedId;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    return this.showValidation && this.required && !this.value;
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || !!this.value;
  }

  get displayErrorMessage(): string {
    return this.errorMessage || `${this.label} é obrigatório`;
  }
}

