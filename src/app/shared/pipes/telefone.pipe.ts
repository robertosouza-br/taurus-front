import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatação de telefone brasileiro
 * Formatos suportados:
 * - Celular (11 dígitos): (00) 00000-0000
 * - Fixo (10 dígitos): (00) 0000-0000
 * 
 * @example
 * {{ '11987654321' | telefone }} // (11) 98765-4321
 * {{ '1133334444' | telefone }}  // (11) 3333-4444
 */
@Pipe({
  name: 'telefone'
})
export class TelefonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    
    const numeros = value.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      // Celular: (00) 00000-0000
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      // Fixo: (00) 0000-0000
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return value;
  }
}
