import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-cnpj',
  templateUrl: './input-cnpj.component.html',
  styleUrl: './input-cnpj.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputCnpjComponent),
      multi: true
    }
  ]
})
export class InputCnpjComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'CNPJ';
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
    this.value = this.formatarCNPJ(value || '');
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
    this.value = this.formatarCNPJ(valorSemFormatacao);
    this.onChange(valorSemFormatacao); // Envia valor sem formatação para o modelo
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  private formatarCNPJ(valor: string): string {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    if (valor.length > 14) {
      valor = valor.substring(0, 14);
    }
    
    // Aplica a formatação: 00.000.000/0000-00
    if (valor.length > 12) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    } else if (valor.length > 8) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else if (valor.length > 5) {
      valor = valor.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    }
    
    return valor;
  }

  private validarCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
  }

  get inputId(): string {
    return this.id || `input-cnpj-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    // Mostra validação se showValidation está ativo OU se o campo foi tocado
    if (!this.showValidation && !this.touched) return false;
    
    const cnpjSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cnpjSemFormatacao || cnpjSemFormatacao.length === 0)) {
      return true;
    }
    
    if (cnpjSemFormatacao.length > 0 && !this.validarCNPJ(cnpjSemFormatacao)) {
      return true;
    }
    
    return false;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    const cnpjSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!cnpjSemFormatacao || cnpjSemFormatacao.length === 0)) {
      return `${this.label} é obrigatório`;
    }
    
    if (cnpjSemFormatacao.length > 0 && !this.validarCNPJ(cnpjSemFormatacao)) {
      return 'CNPJ inválido';
    }
    
    return '';
  }
}
