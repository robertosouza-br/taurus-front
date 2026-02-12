import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatar CEP
 * Transforma: 12345678 → 12345-678
 * 
 * Uso:
 * {{ cep | cep }}
 */
@Pipe({
  name: 'cep'
})
export class CepPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    
    // Remove tudo que não é dígito
    const cep = value.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    if (cep.length !== 8) return value;
    
    // Aplica a máscara: 00000-000
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}
