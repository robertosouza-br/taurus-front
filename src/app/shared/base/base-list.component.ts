import { Directive } from '@angular/core';

/**
 * Classe base genérica para componentes de listagem com comportamentos padrão
 * 
 * Estenda esta classe em seus componentes de lista para obter:
 * - Scroll automático para o topo ao trocar de página
 * - Controle de estado de carregamento e exportação
 * - Estrutura padrão para paginação
 * 
 * @example
 * ```typescript
 * export class MinhaListaComponent extends BaseListComponent implements OnInit {
 *   // Seus campos específicos
 *   
 *   onLazyLoad(event: any): void {
 *     this.handleLazyLoad(event, (page, size) => {
 *       this.filtro.page = page;
 *       this.filtro.size = size;
 *       this.carregar();
 *     });
 *   }
 * }
 * ```
 */
@Directive()
export abstract class BaseListComponent {
  /**
   * Indica se a lista está sendo carregada
   */
  carregando = false;

  /**
   * Indica se está exportando dados
   */
  exportando = false;

  /**
   * Total de registros para paginação
   */
  totalRegistros = 0;

  /**
   * Manipula evento de lazy load da tabela
   * Executa scroll para o topo e chama callback de carregamento
   * 
   * @param event Evento do PrimeNG DataTable
   * @param loadCallback Função que será chamada para carregar os dados
   */
  protected handleLazyLoad(
    event: any,
    loadCallback: (page: number, size: number) => void
  ): void {
    const page = event.first / event.rows;
    const size = event.rows;

    // Scroll suave para o topo da página
    this.scrollToTop();

    // Executa callback de carregamento
    loadCallback(page, size);
  }

  /**
   * Scroll suave para o topo da página
   * Funciona em diferentes contêineres do sistema
   */
  protected scrollToTop(): void {
    // Tenta encontrar o contêiner de conteúdo principal
    const contentArea = document.querySelector('.content-area');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
    if (contentWrapper) {
      contentWrapper.scrollTop = 0;
    }
    
    // Scroll na janela principal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Reseta paginação para primeira página
   * Útil ao aplicar filtros ou busca
   * 
   * @param filtro Objeto de filtro com propriedade page
   */
  protected resetarPaginacao(filtro: { page: number }): void {
    filtro.page = 0;
  }
}
