import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-cep',
  templateUrl: './input-cep.component.html',
  styleUrl: './input-cep.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputCepComponent),
      multi: true
    }
  ]
})
export class InputCepComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'CEP';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() styleClass: string = '';
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Output() onBlurEvent = new EventEmitter<void>();

  value: string = '';
  touched: boolean = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = this.formatarCEP(value || '');
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
    const valorSemFormatacao = input.value.replace(/\D/g, '');
    this.value = this.formatarCEP(valorSemFormatacao);
    this.onChange(valorSemFormatacao); // Envia valor sem formatação para o modelo
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
    this.onBlurEvent.emit();
  }

  private formatarCEP(valor: string): string {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }
    
    // Aplica a formatação: 00000-000
    if (valor.length > 5) {
      valor = valor.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    }
    
    return valor;
  }

  private validarCEP(cep: string): boolean {
    cep = cep.replace(/\D/g, '');
    
    // CEP deve ter 8 dígitos
    if (cep.length !== 8) return false;
    
    // Não pode ser todos zeros ou sequência de números iguais
    if (/^0{8}$/.test(cep) || /^(\d)\1{7}$/.test(cep)) return false;
    
    return true;
  }

  get inputId(): string {
    return this.id || `input-cep-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    // Mostra validação se showValidation está ativo OU se o campo foi tocado
    if (!this.showValidation && !this.touched) return false;
    
    const cepSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cepSemFormatacao || cepSemFormatacao.length === 0)) {
      return true;
    }
    
    if (cepSemFormatacao.length > 0 && !this.validarCEP(cepSemFormatacao)) {
      return true;
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    const cepSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cepSemFormatacao || cepSemFormatacao.length === 0)) {
      return `${this.label} é obrigatório`;
    }
    
    if (cepSemFormatacao.length > 0 && !this.validarCEP(cepSemFormatacao)) {
      return 'CEP inválido';
    }
    
    return '';
  }
}
