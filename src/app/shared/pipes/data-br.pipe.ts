import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatação de data no formato brasileiro
 * Entrada: string no formato ISO (YYYY-MM-DD) ou Date
 * Saída: DD/MM/YYYY
 * 
 * @example
 * {{ '2024-12-25' | dataBr }} // 25/12/2024
 * {{ dateObject | dataBr }}   // 25/12/2024
 */
@Pipe({
  name: 'dataBr'
})
export class DataBrPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    
    let data: Date;
    
    if (typeof value === 'string') {
      // Se for string no formato YYYY-MM-DD
      const [ano, mes, dia] = value.split('-').map(Number);
      if (!ano || !mes || !dia) return value;
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    } else if (value instanceof Date) {
      // Se for objeto Date
      data = value;
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    return String(value);
  }
}
