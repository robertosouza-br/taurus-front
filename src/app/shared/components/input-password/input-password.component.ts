import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-password',
  templateUrl: './input-password.component.html',
  styleUrl: './input-password.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputPasswordComponent),
      multi: true
    }
  ]
})
export class InputPasswordComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'Senha';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() feedback: boolean = false;
  @Input() toggleMask: boolean = true;
  @Input() promptLabel: string = 'Digite uma senha';
  @Input() weakLabel: string = 'Fraca';
  @Input() mediumLabel: string = 'Média';
  @Input() strongLabel: string = 'Forte';
  @Input() autocomplete: string = 'off';

  value: string = '';
  touched: boolean = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: any): void {
    this.value = event;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  get inputId(): string {
    return this.id || `input-password-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    if (this.required && (!this.value || this.value.trim().length === 0)) {
      return this.showValidation;
    }
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    if (this.required && (!this.value || this.value.trim().length === 0)) {
      return `${this.label} é obrigatório`;
    }
    
    return '';
  }
}
