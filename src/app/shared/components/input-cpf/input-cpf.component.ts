import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-cpf',
  templateUrl: './input-cpf.component.html',
  styleUrl: './input-cpf.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputCpfComponent),
      multi: true
    }
  ]
})
export class InputCpfComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'CPF';
  @Input() placeholder: string = '';
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
    this.value = this.formatarCPF(value || '');
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
    this.value = this.formatarCPF(valorSemFormatacao);
    this.onChange(valorSemFormatacao); // Envia valor sem formatação para o modelo
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  private formatarCPF(valor: string): string {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    // Aplica a formatação
    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }
    
    return valor;
  }

  private validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  get inputId(): string {
    return this.id || `input-cpf-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    // Mostra validação se showValidation está ativo OU se o campo foi tocado
    if (!this.showValidation && !this.touched) return false;
    
    const cpfSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cpfSemFormatacao || cpfSemFormatacao.length === 0)) {
      return true;
    }
    
    if (cpfSemFormatacao.length > 0 && !this.validarCPF(cpfSemFormatacao)) {
      return true;
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    const cpfSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cpfSemFormatacao || cpfSemFormatacao.length === 0)) {
      return `${this.label} é obrigatório`;
    }
    
    if (cpfSemFormatacao.length > 0 && !this.validarCPF(cpfSemFormatacao)) {
      return 'CPF inválido';
    }
    
    return '';
  }
}
