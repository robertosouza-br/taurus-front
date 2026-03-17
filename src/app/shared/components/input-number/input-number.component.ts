import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-number',
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputNumberComponent),
      multi: true
    }
  ]
})
export class InputNumberComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'Número';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() mode: 'decimal' | 'currency' = 'decimal';
  @Input() currency: string = 'BRL';
  @Input() locale: string = 'pt-BR';
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() minFractionDigits: number = 0;
  @Input() maxFractionDigits: number = 2;
  @Input() useGrouping: boolean = true;
  @Input() showButtons: boolean = false;

  value: number | null = null;
  touched: boolean = false;
  isFocused: boolean = false;
  private _generatedId: string = `input-number-${Math.random().toString(36).substr(2, 9)}`;
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: number | null): void {
    this.value = value;
    this.onChange(value);
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
    return this.id || this._generatedId;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    if (!this.showValidation && !this.touched) return false;

    if (this.required && (this.value === null || this.value === undefined)) {
      return true;
    }

    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;

    if (this.required && (this.value === null || this.value === undefined)) {
      return `${this.label} é obrigatório`;
    }

    return '';
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || (this.value !== null && this.value !== undefined);
  }
}