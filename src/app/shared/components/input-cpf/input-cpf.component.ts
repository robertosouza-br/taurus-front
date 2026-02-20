import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
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
  @Input() documentType: 'cpf' | 'cnpj' | 'cpfCnpj' = 'cpf';
  @Output() onBlur = new EventEmitter<void>();

  value: string = '';
  touched: boolean = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = this.formatarDocumento(value || '');
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
    this.value = this.formatarDocumento(valorSemFormatacao);
    this.onChange(valorSemFormatacao); // Envia valor sem formatação para o modelo
  }

  onKeyDown(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (teclasPermitidas.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  handleBlur(): void {
    this.touched = true;
    this.onTouched();
    this.onBlur.emit();
  }

  private formatarDocumento(valor: string): string {
    valor = valor.replace(/\D/g, '');

    if (this.documentType === 'cnpj') {
      return this.formatarCNPJ(valor);
    }

    if (this.documentType === 'cpfCnpj') {
      if (valor.length <= 11) {
        return this.formatarCPF(valor);
      }
      return this.formatarCNPJ(valor);
    }

    return this.formatarCPF(valor);
  }

  private formatarCPF(valor: string): string {
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

  private formatarCNPJ(valor: string): string {
    valor = valor.replace(/\D/g, '');

    if (valor.length > 14) {
      valor = valor.substring(0, 14);
    }

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

  private validarCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

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
    
    const documentoSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!documentoSemFormatacao || documentoSemFormatacao.length === 0)) {
      return true;
    }

    if (!documentoSemFormatacao) {
      return false;
    }

    if (this.documentType === 'cnpj') {
      return !this.validarCNPJ(documentoSemFormatacao);
    }

    if (this.documentType === 'cpfCnpj') {
      if (documentoSemFormatacao.length <= 11) {
        return !this.validarCPF(documentoSemFormatacao);
      }
      return !this.validarCNPJ(documentoSemFormatacao);
    }

    return !this.validarCPF(documentoSemFormatacao);
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) return this.errorMessage;
    
    const documentoSemFormatacao = this.value.replace(/\D/g, '');
    
    if (this.required && (!documentoSemFormatacao || documentoSemFormatacao.length === 0)) {
      return `${this.label} é obrigatório`;
    }

    if (!documentoSemFormatacao) {
      return '';
    }

    if (this.documentType === 'cnpj') {
      return this.validarCNPJ(documentoSemFormatacao) ? '' : 'CNPJ inválido';
    }

    if (this.documentType === 'cpfCnpj') {
      if (documentoSemFormatacao.length <= 11) {
        return this.validarCPF(documentoSemFormatacao) ? '' : 'CPF/CNPJ inválido';
      }
      return this.validarCNPJ(documentoSemFormatacao) ? '' : 'CPF/CNPJ inválido';
    }

    if (!this.validarCPF(documentoSemFormatacao)) {
      return 'CPF inválido';
    }

    return '';
  }

  get inputMaxLength(): number {
    return this.documentType === 'cpf' ? 14 : 18;
  }
}
