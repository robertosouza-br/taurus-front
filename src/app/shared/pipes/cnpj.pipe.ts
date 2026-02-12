import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatar CNPJ
 * Transforma: 12345678000190 → 12.345.678/0001-90
 * 
 * Uso:
 * {{ cnpj | cnpj }}
 */
@Pipe({
  name: 'cnpj'
})
export class CnpjPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    
    // Remove tudo que não é dígito
    const cnpj = value.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return value;
    
    // Aplica a máscara: 00.000.000/0000-00
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}
