import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatação de CPF
 * Formato: 000.000.000-00
 * 
 * @example
 * {{ '12345678901' | cpf }} // 123.456.789-01
 */
@Pipe({
  name: 'cpf'
})
export class CpfPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    
    const numeros = value.replace(/\D/g, '');
    
    if (numeros.length !== 11) return value;
    
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
