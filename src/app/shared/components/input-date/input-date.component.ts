import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-date',
  templateUrl: './input-date.component.html',
  styleUrl: './input-date.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputDateComponent),
      multi: true
    }
  ]
})
export class InputDateComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'Data';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() dateFormat: string = 'dd/mm/yy';
  @Input() showButtonBar: boolean = true;
  @Input() appendTo: string = 'body';

  value: Date | null = null;
  isFocused: boolean = false;
  touched: boolean = false;
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDateChange(event: any): void {
    this.value = event;
    this.onChange(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.touched = true;
    this.onTouched();
  }

  get inputId(): string {
    return this.id || `input-date-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    if (!this.showValidation && !this.touched) return false;
    
    if (this.required && !this.value) {
      return true;
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    if (this.required && !this.value) {
      return `${this.label} é obrigatório`;
    }
    
    return '';
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || !!this.value;
  }
}
