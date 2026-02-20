import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-telefone',
  templateUrl: './input-telefone.component.html',
  styleUrl: './input-telefone.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTelefoneComponent),
      multi: true
    }
  ]
})
export class InputTelefoneComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'Telefone';
  @Input() placeholder: string = '(00) 00000-0000';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';

  value: string = '';
  touched: boolean = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
    if (this.value) {
      this.value = this.aplicarMascara(this.value);
    }
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

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    // Limita a 11 dígitos
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Aplica a máscara
    this.value = this.aplicarMascara(value);
    input.value = this.value;
    
    // Emite apenas os números para o ngModel
    this.onChange(value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  private aplicarMascara(value: string): string {
    if (!value) return '';
    
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    } else {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
    }
  }

  get inputId(): string {
    return this.id || `input-telefone-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    const deveExibirValidacao = this.showValidation || this.touched;

    if (this.required && (!this.value || this.value.trim().length === 0)) {
      return deveExibirValidacao;
    }
    
    // Valida se tem pelo menos 10 dígitos (telefone fixo)
    if (this.value && this.value.trim().length > 0) {
      const numbers = this.value.replace(/\D/g, '');
      return deveExibirValidacao && (numbers.length < 10 || numbers.length > 11);
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    if (this.required && (!this.value || this.value.trim().length === 0)) {
      return `${this.label} é obrigatório`;
    }
    
    if (this.value && this.value.trim().length > 0) {
      const numbers = this.value.replace(/\D/g, '');
      if (numbers.length < 10 || numbers.length > 11) {
        return 'Telefone inválido';
      }
    }
    
    return '';
  }
}
