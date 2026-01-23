import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input-emails',
  templateUrl: './input-emails.component.html',
  styleUrls: ['./input-emails.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputEmailsComponent),
      multi: true
    }
  ]
})
export class InputEmailsComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'E-mail(s)';
  @Input() placeholder: string = 'Digite emails separados por ; ou Enter';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() separator: string = ';';
  @Input() allowDuplicate: boolean = false;
  @Input() maxEmails?: number;
  @Input() validateEmail: boolean = true;
  @Input() maxLength?: number; // Tamanho máximo do texto completo (com separadores)

  value: string[] = [];
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Regex de validação de email
   */
  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Valida email ao adicionar
   */
  onAdd(event: any): void {
    if (this.validateEmail && event.value) {
      const email = event.value.trim();
      
      // Valida formato do email
      if (!this.emailRegex.test(email)) {
        // Remove email inválido
        setTimeout(() => {
          this.value = this.value.filter(e => e !== event.value);
          this.onChange(this.value);
        }, 0);
        return;
      }
    }

    // Verifica limite de tamanho total
    if (this.maxLength && this.value.length > 0) {
      const tamanhoTotal = this.value.join(this.separator).length;
      if (tamanhoTotal > this.maxLength) {
        // Remove último email adicionado se exceder o limite
        setTimeout(() => {
          this.value = this.value.slice(0, -1);
          this.onChange(this.value);
        }, 0);
        return;
      }
    }

    // Verifica limite máximo de emails
    if (this.maxEmails && this.value.length > this.maxEmails) {
      setTimeout(() => {
        this.value = this.value.slice(0, this.maxEmails);
        this.onChange(this.value);
      }, 0);
    }
  }

  /**
   * Atualiza valor ao remover email
   */
  onRemove(): void {
    this.onChange(this.value);
    this.onTouched();
  }

  /**
   * Atualiza valor ao modificar
   */
  onModelChange(value: string[]): void {
    this.value = value;
    this.onChange(value);
  }

  /**
   * Implementação do ControlValueAccessor
   */
  writeValue(value: string[]): void {
    this.value = value || [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Verifica se há erro de validação
   */
  get hasError(): boolean {
    if (this.showValidation && this.required && (!this.value || this.value.length === 0)) {
      return true;
    }
    if (this.showValidation && this.maxLength && this.tamanhoAtual > this.maxLength) {
      return true;
    }
    return false;
  }

  /**
   * Retorna tamanho atual do texto completo
   */
  get tamanhoAtual(): number {
    return this.value.join(this.separator).length;
  }

  /**
   * Mensagem de erro
   */
  get errorMessage(): string {
    if (this.required && (!this.value || this.value.length === 0)) {
      return 'Campo obrigatório';
    }
    if (this.maxLength && this.tamanhoAtual > this.maxLength) {
      return `Tamanho máximo de ${this.maxLength} caracteres excedido (atual: ${this.tamanhoAtual})`;
    }
    return '';
  }
}
