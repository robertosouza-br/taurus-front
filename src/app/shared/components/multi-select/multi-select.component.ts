import { Component, Input, forwardRef, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ]
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = 'Selecione';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() options: any[] = [];
  @Input() optionLabel: string = 'label';
  @Input() optionValue: string = ''; // Vazio para usar o objeto inteiro por padrão
  @Input() filter: boolean = true;
  @Input() filterBy: string = '';
  @Input() emptyMessage: string = 'Nenhum resultado encontrado';
  @Input() emptyFilterMessage: string = 'Nenhum resultado encontrado';
  @Input() display: string = 'chip'; // 'comma' | 'chip'
  @Input() showClear: boolean = true;
  @Input() maxSelectedLabels: number = 3;
  @Input() selectedItemsLabel: string = '{0} itens selecionados';
  
  @Output() onChange = new EventEmitter<any>();

  value: any[] = [];
  touched: boolean = false;
  isFocused: boolean = false;
  private onChangeCallback: (value: any) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  writeValue(value: any): void {
    this.value = value || [];
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(event: any): void {
    this.value = event.value;
    this.onChangeCallback(this.value);
    this.onChange.emit(event);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.touched = true;
    this.onTouchedCallback();
  }

  get inputId(): string {
    return this.id || `multi-select-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    return this.showValidation && this.required && (!this.value || this.value.length === 0) && this.touched;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) {
      return this.errorMessage;
    }
    return this.required ? `${this.label} é obrigatório` : '';
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || (this.value && this.value.length > 0);
  }

  get filterByField(): string {
    return this.filterBy || this.optionLabel;
  }
}
