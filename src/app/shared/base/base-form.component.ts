import { Directive, inject } from '@angular/core';
import { FormFocusService } from '../services/form-focus.service';

/**
 * Classe base genérica para formulários com validação automática e foco em erros
 * 
 * Estenda esta classe em seus componentes de formulário para obter:
 * - Controle automático de tentativa de salvamento
 * - Foco automático no primeiro campo com erro
 * - Métodos auxiliares para validação
 * 
 * @example
 * ```typescript
 * export class MeuFormularioComponent extends BaseFormComponent {
 *   nome = '';
 *   email = '';
 *   
 *   protected getCamposObrigatorios() {
 *     return [
 *       { id: 'nome', valor: this.nome, label: 'Nome' },
 *       { id: 'email', valor: this.email, label: 'E-mail' }
 *     ];
 *   }
 *   
 *   salvar(): void {
 *     if (!this.validarFormulario()) {
 *       return; // Mensagem e foco já foram tratados
 *     }
 *     // Continuar com o salvamento...
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseFormComponent {
  /**
   * Indica se o usuário tentou salvar o formulário
   * Usado para exibir validações apenas após a primeira tentativa
   */
  tentouSalvar = false;

  /**
   * Indica se o formulário está sendo salvo
   */
  salvando = false;

  /**
   * Serviço de foco em campos (injetado automaticamente)
   */
  protected formFocusService = inject(FormFocusService);

  /**
   * Define os campos obrigatórios do formulário
   * Deve ser implementado pelas classes filhas
   * 
   * @returns Array de campos com id, valor e opcionalmente label
   */
  protected abstract getCamposObrigatorios(): Array<{
    id: string;
    valor: any;
    label?: string;
  }>;

  /**
   * Valida o formulário e exibe mensagens de erro se necessário
   * 
   * @param exibirMensagem Se true, exibe toast com mensagem de erro
   * @returns true se o formulário é válido, false caso contrário
   */
  protected validarFormulario(exibirMensagem: boolean = true): boolean {
    this.tentouSalvar = true;

    const camposObrigatorios = this.getCamposObrigatorios();
    const campoInvalido = camposObrigatorios.find(campo => !this.isCampoValido(campo.valor));

    if (campoInvalido) {
      // Foca no primeiro campo inválido
      this.focarPrimeiroErro();

      // Exibe mensagem de erro se solicitado
      if (exibirMensagem) {
        this.exibirMensagemCampoObrigatorio(campoInvalido);
      }

      return false;
    }

    return true;
  }

  /**
   * Verifica se um campo tem valor válido
   * Considera vazio: null, undefined, string vazia, array vazio
   */
  protected isCampoValido(valor: any): boolean {
    if (valor === null || valor === undefined) {
      return false;
    }

    if (typeof valor === 'string') {
      return valor.trim() !== '';
    }

    if (Array.isArray(valor)) {
      return valor.length > 0;
    }

    return true;
  }

  /**
   * Foca no primeiro campo que contém erro
   */
  protected focarPrimeiroErro(): void {
    this.formFocusService.focarPrimeiroErro(this.getCamposObrigatorios());
  }

  /**
   * Foca em um campo específico
   */
  protected focarCampo(fieldId: string): void {
    this.formFocusService.focarCampo(fieldId);
  }

  /**
   * Exibe mensagem toast de campo obrigatório
   * Pode ser sobrescrito nas classes filhas para customizar a mensagem
   */
  protected exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    // Implementação padrão vazia - deve ser sobrescrita pela classe filha
    // que tem acesso ao MessageService
    console.warn(`Campo obrigatório vazio: ${campo.label || campo.id}`);
  }

  /**
   * Reseta o estado do formulário
   */
  protected resetarFormulario(): void {
    this.tentouSalvar = false;
    this.salvando = false;
  }

  /**
   * Valida um campo específico
   */
  protected validarCampo(fieldId: string): boolean {
    const campo = this.getCamposObrigatorios().find(c => c.id === fieldId);
    return campo ? this.isCampoValido(campo.valor) : true;
  }

  /**
   * Obtém lista de campos inválidos
   */
  protected getCamposInvalidos(): Array<{ id: string; valor: any; label?: string }> {
    return this.getCamposObrigatorios().filter(campo => !this.isCampoValido(campo.valor));
  }

  /**
   * Verifica se existe algum campo inválido
   */
  protected hasErros(): boolean {
    return this.getCamposInvalidos().length > 0;
  }

  /**
   * Obtém mensagem de erro formatada com todos os campos inválidos
   */
  protected getMensagemErros(): string {
    const camposInvalidos = this.getCamposInvalidos();
    
    if (camposInvalidos.length === 0) {
      return '';
    }

    if (camposInvalidos.length === 1) {
      const campo = camposInvalidos[0];
      return `O campo "${campo.label || campo.id}" é obrigatório`;
    }

    const labels = camposInvalidos
      .map(c => c.label || c.id)
      .join(', ');
    
    return `Os seguintes campos são obrigatórios: ${labels}`;
  }
}
