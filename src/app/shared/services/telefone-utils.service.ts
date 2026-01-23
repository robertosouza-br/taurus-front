import { Injectable } from '@angular/core';

/**
 * Serviço utilitário para manipulação de telefones
 */
@Injectable({
  providedIn: 'root'
})
export class TelefoneUtilsService {

  /**
   * Remove DDI (código do país) do telefone
   * @param telefone Telefone com ou sem DDI
   * @param ddi Código do país (padrão: '55' - Brasil)
   * @returns Telefone sem DDI (apenas DDD + número)
   * 
   * @example
   * removerDDI('5521998954455') // '21998954455'
   * removerDDI('21998954455')   // '21998954455'
   * removerDDI('552133334444')  // '2133334444'
   */
  removerDDI(telefone: string | null | undefined, ddi: string = '55'): string {
    if (!telefone) return '';
    
    const numeros = telefone.replace(/\D/g, '');
    const ddiLength = ddi.length;
    
    // Se o telefone começa com o DDI e tem o tamanho esperado
    // Brasil: 13 dígitos (55 + 11 dígitos) ou 12 dígitos (55 + 10 dígitos)
    const expectedLengthCelular = ddiLength + 11; // DDI + DDD + 9 dígitos
    const expectedLengthFixo = ddiLength + 10;    // DDI + DDD + 8 dígitos
    
    if ((numeros.length === expectedLengthCelular || numeros.length === expectedLengthFixo) 
        && numeros.startsWith(ddi)) {
      return numeros.substring(ddiLength);
    }
    
    return numeros;
  }

  /**
   * Adiciona DDI ao telefone se não tiver
   * @param telefone Telefone sem DDI
   * @param ddi Código do país (padrão: '55' - Brasil)
   * @returns Telefone com DDI
   * 
   * @example
   * adicionarDDI('21998954455') // '5521998954455'
   * adicionarDDI('5521998954455') // '5521998954455' (não duplica)
   */
  adicionarDDI(telefone: string | null | undefined, ddi: string = '55'): string {
    if (!telefone) return '';
    
    const numeros = telefone.replace(/\D/g, '');
    
    // Se já tem DDI, retorna como está
    if (numeros.startsWith(ddi)) {
      return numeros;
    }
    
    // Adiciona DDI
    return ddi + numeros;
  }

  /**
   * Valida se o telefone brasileiro está em formato válido
   * @param telefone Telefone para validar (com ou sem DDI)
   * @returns true se válido, false caso contrário
   * 
   * @example
   * validarTelefoneBR('21998954455')  // true (celular)
   * validarTelefoneBR('2133334444')   // true (fixo)
   * validarTelefoneBR('5521998954455') // true (com DDI)
   * validarTelefoneBR('123456')       // false (muito curto)
   */
  validarTelefoneBR(telefone: string | null | undefined): boolean {
    if (!telefone) return false;
    
    const numeros = this.removerDDI(telefone);
    
    // Telefone válido: 10 dígitos (fixo) ou 11 dígitos (celular)
    return numeros.length === 10 || numeros.length === 11;
  }

  /**
   * Formata telefone no padrão brasileiro
   * @param telefone Telefone para formatar
   * @param incluirDDI Se deve incluir DDI na formatação
   * @returns Telefone formatado
   * 
   * @example
   * formatarTelefoneBR('21998954455')    // '(21) 99895-4455'
   * formatarTelefoneBR('2133334444')     // '(21) 3333-4444'
   * formatarTelefoneBR('21998954455', true) // '+55 (21) 99895-4455'
   */
  formatarTelefoneBR(telefone: string | null | undefined, incluirDDI: boolean = false): string {
    if (!telefone) return '';
    
    let numeros = telefone.replace(/\D/g, '');
    const temDDI = numeros.startsWith('55') && (numeros.length === 12 || numeros.length === 13);
    
    if (temDDI && !incluirDDI) {
      numeros = numeros.substring(2);
    }
    
    if (!temDDI && incluirDDI) {
      numeros = '55' + numeros;
    }
    
    // Formata com DDI
    if (incluirDDI && numeros.length >= 12) {
      const ddi = numeros.substring(0, 2);
      const ddd = numeros.substring(2, 4);
      const resto = numeros.substring(4);
      
      if (resto.length === 9) {
        // Celular: +55 (21) 99895-4455
        return `+${ddi} (${ddd}) ${resto.substring(0, 5)}-${resto.substring(5)}`;
      } else if (resto.length === 8) {
        // Fixo: +55 (21) 3333-4444
        return `+${ddi} (${ddd}) ${resto.substring(0, 4)}-${resto.substring(4)}`;
      }
    }
    
    // Formata sem DDI
    if (numeros.length === 11) {
      // Celular: (21) 99895-4455
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
      // Fixo: (21) 3333-4444
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    
    return numeros;
  }
}
