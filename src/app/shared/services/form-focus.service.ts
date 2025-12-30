import { Injectable } from '@angular/core';

/**
 * Serviço genérico para gerenciar foco em campos de formulário
 * 
 * Útil para melhorar a UX ao validar formulários, direcionando
 * automaticamente o usuário para o primeiro campo com erro.
 */
@Injectable({
  providedIn: 'root'
})
export class FormFocusService {

  /**
   * Foca no primeiro campo obrigatório que esteja vazio
   * 
   * @param campos Array de objetos com id e valor dos campos obrigatórios
   * @example
   * this.formFocusService.focarPrimeiroErro([
   *   { id: 'nome', valor: this.nome },
   *   { id: 'email', valor: this.email },
   *   { id: 'cpf', valor: this.cpf }
   * ]);
   */
  focarPrimeiroErro(campos: { id: string; valor: any }[]): void {
    const primeiroCampoVazio = campos.find(campo => !campo.valor);
    
    if (primeiroCampoVazio) {
      this.focarCampo(primeiroCampoVazio.id);
    }
  }

  /**
   * Foca em um campo específico pelo ID e rola até ele
   * 
   * Funciona com:
   * - Inputs nativos (input, textarea, select)
   * - Componentes customizados que encapsulam inputs
   * - Componentes PrimeNG (p-dropdown, p-calendar, p-autocomplete, etc.)
   * 
   * @param fieldId ID do campo ou do wrapper do componente
   * @param options Opções de scroll e delay
   */
  focarCampo(
    fieldId: string, 
    options: {
      scrollBehavior?: ScrollBehavior;
      scrollBlock?: ScrollLogicalPosition;
      delayBeforeFocus?: number;
      delayAfterScroll?: number;
    } = {}
  ): void {
    const {
      scrollBehavior = 'smooth',
      scrollBlock = 'center',
      delayBeforeFocus = 100,
      delayAfterScroll = 300
    } = options;

    setTimeout(() => {
      // Busca o elemento pelo ID
      const wrapper = document.getElementById(fieldId);
      
      if (!wrapper) {
        console.warn(`[FormFocusService] Campo com ID "${fieldId}" não encontrado`);
        return;
      }

      // Tenta encontrar o input/elemento focável
      const focusableElement = this.findFocusableElement(wrapper);
      
      if (focusableElement) {
        // Rola até o elemento
        wrapper.scrollIntoView({ 
          behavior: scrollBehavior, 
          block: scrollBlock 
        });
        
        // Aguarda o scroll completar antes de focar
        setTimeout(() => {
          focusableElement.focus();
          
          // Para inputs de texto, também seleciona o conteúdo
          if (focusableElement instanceof HTMLInputElement && 
              (focusableElement.type === 'text' || 
               focusableElement.type === 'email' || 
               focusableElement.type === 'tel')) {
            focusableElement.select();
          }
        }, delayAfterScroll);
      } else {
        console.warn(`[FormFocusService] Nenhum elemento focável encontrado dentro de "${fieldId}"`);
      }
    }, delayBeforeFocus);
  }

  /**
   * Encontra o elemento focável dentro de um wrapper
   * 
   * Busca por:
   * 1. Input nativo (input, textarea, select)
   * 2. Elemento com contenteditable
   * 3. Botão ou link
   * 4. Qualquer elemento com tabindex
   */
  private findFocusableElement(wrapper: HTMLElement): HTMLElement | null {
    // Se o próprio wrapper for focável
    if (this.isFocusable(wrapper)) {
      return wrapper;
    }

    // Busca por inputs nativos
    const input = wrapper.querySelector('input, textarea, select') as HTMLElement;
    if (input) {
      return input;
    }

    // Busca por elementos PrimeNG que possuem input interno
    const primeInput = wrapper.querySelector('.p-inputtext, .p-dropdown, .p-calendar input') as HTMLElement;
    if (primeInput) {
      return primeInput;
    }

    // Busca por elementos editáveis
    const editable = wrapper.querySelector('[contenteditable="true"]') as HTMLElement;
    if (editable) {
      return editable;
    }

    // Busca por elementos com tabindex
    const tabindexElement = wrapper.querySelector('[tabindex]') as HTMLElement;
    if (tabindexElement) {
      return tabindexElement;
    }

    return null;
  }

  /**
   * Verifica se um elemento é focável
   */
  private isFocusable(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    
    // Elementos nativamente focáveis
    if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName)) {
      return true;
    }

    // Elementos com tabindex
    if (element.hasAttribute('tabindex')) {
      return true;
    }

    // Elementos editáveis
    if (element.getAttribute('contenteditable') === 'true') {
      return true;
    }

    return false;
  }

  /**
   * Rola até um elemento específico sem focar
   * Útil para apenas destacar visualmente um campo com erro
   */
  rolarAte(
    elementId: string,
    options: {
      behavior?: ScrollBehavior;
      block?: ScrollLogicalPosition;
      delay?: number;
    } = {}
  ): void {
    const { behavior = 'smooth', block = 'center', delay = 0 } = options;

    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior, block });
      }
    }, delay);
  }

  /**
   * Foca em múltiplos campos em sequência (útil para wizards/steps)
   */
  focarEmSequencia(fieldIds: string[], intervalMs: number = 500): void {
    fieldIds.forEach((id, index) => {
      setTimeout(() => {
        this.focarCampo(id);
      }, index * intervalMs);
    });
  }
}
