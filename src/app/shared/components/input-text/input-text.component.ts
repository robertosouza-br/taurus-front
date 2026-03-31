import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputTextComponent),
      multi: true
    }
  ]
})
export class InputTextComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() set inputValue(value: any) {
    this.value = value ?? '';
  }
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() maxlength: number | null = null;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false; // Controla se deve mostrar validação
  @Input() errorMessage: string = ''; // Mensagem de erro customizada
  @Input() helper: string = ''; // Texto de ajuda abaixo do campo
  @Output() onBlur = new EventEmitter<void>();

  value: any = '';
  touched: boolean = false;
  isFocused: boolean = false;
  emailInvalido: boolean = false;
  private _generatedId: string = `input-${Math.random().toString(36).substr(2, 9)}`;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value ?? '';
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

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = this.type === 'number' ? (input.value ? Number(input.value) : null) : input.value;
    this.onChange(this.value);
    
    // Limpa o erro de email enquanto digita
    if (this.type === 'email' && this.emailInvalido) {
      this.emailInvalido = false;
    }
  }

  handleBlur(): void {
    this.isFocused = false;
    this.touched = true;
    this.onTouched();
    this.onBlur.emit();
    
    // Valida email se o tipo for email
    if (this.type === 'email' && this.value && typeof this.value === 'string' && this.value.trim().length > 0) {
      this.emailInvalido = !this.validarEmail(this.value);
    } else {
      this.emailInvalido = false;
    }
  }

  onFocus(): void {
    this.isFocused = true;
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  get inputId(): string {
    return this.id || this._generatedId;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || !!this.value;
  }

  get isInvalid(): boolean {
    // Valida campo obrigatório vazio (só mostra se showValidation ou se touched)
    if (this.required) {
      if (this.type === 'number') {
        return this.showValidation && (this.value === null || this.value === undefined || this.value === '');
      }
      if (!this.value || (typeof this.value === 'string' && this.value.trim().length === 0)) {
        return this.showValidation;
      }
    }
    
    // Valida formato de email se o tipo for email (mostra imediatamente após touched)
    if (this.type === 'email' && this.value && typeof this.value === 'string' && this.value.trim().length > 0) {
      return this.touched && this.emailInvalido;
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    if (this.required) {
      if (this.type === 'number' && (this.value === null || this.value === undefined || this.value === '')) {
        return `${this.label} é obrigatório`;
      }
      if (!this.value || (typeof this.value === 'string' && this.value.trim().length === 0)) {
        return `${this.label} é obrigatório`;
      }
    }
    
    if (this.type === 'email' && this.value && typeof this.value === 'string' && !this.validarEmail(this.value)) {
      return 'E-mail inválido';
    }
    
    return '';
  }
}
