import { Component, Input, forwardRef, ViewChild, Output, EventEmitter } from '@angular/core';
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
export class AutocompleteComponent implements ControlValueAccessor {
  @ViewChild('autoComplete') autoComplete!: AutoComplete;

  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = 'Digite para buscar...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() field: string = 'nome'; // Campo a ser exibido
  @Input() suggestions: any[] = []; // Sugestões filtradas
  @Input() emptyMessage: string = 'Nenhum resultado encontrado';
  @Input() itemTemplate: any = null; // Template customizado para os itens
  
  @Output() completeMethod = new EventEmitter<any>(); // Evento de filtro
  @Output() onSelect = new EventEmitter<any>(); // Evento de seleção
  @Output() onDropdownClick = new EventEmitter<void>(); // Evento ao clicar para expandir

  value: any = null;
  touched: boolean = false;
  isFocused: boolean = false;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
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
    this.onChange(this.value);
    this.onSelect.emit(event);
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
    return this.id || `autocomplete-${Math.random().toString(36).substr(2, 9)}`;
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

