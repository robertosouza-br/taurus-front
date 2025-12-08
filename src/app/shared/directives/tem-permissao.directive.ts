import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissaoService } from '../../core/services/permissao.service';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';

/**
 * Diretiva para mostrar/esconder elementos baseado em permissões.
 * 
 * Uso:
 * <button *appTemPermissao="{ funcionalidade: 'VENDA', permissoes: ['INCLUIR'] }">
 *   Criar Venda
 * </button>
 * 
 * <button *appTemPermissao="{ funcionalidade: 'VENDA', permissoes: ['EXPORTAR', 'IMPRIMIR'], qualquer: true }">
 *   Gerar Documento
 * </button>
 */
@Directive({
  selector: '[appTemPermissao]'
})
export class TemPermissaoDirective implements OnInit {
  
  @Input() appTemPermissao!: {
    funcionalidade: Funcionalidade;
    permissoes?: Permissao[];
    qualquer?: boolean; // true = OR, false = AND (padrão)
  };

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    this.atualizarView();
  }

  private atualizarView(): void {
    const { funcionalidade, permissoes, qualquer } = this.appTemPermissao;

    let temAcesso = false;

    if (!permissoes || permissoes.length === 0) {
      // Apenas verifica funcionalidade
      temAcesso = this.permissaoService.temFuncionalidade(funcionalidade);
    } else {
      // Verifica permissões
      temAcesso = qualquer
        ? this.permissaoService.temQualquerPermissao(funcionalidade, permissoes)
        : this.permissaoService.temTodasPermissoes(funcionalidade, permissoes);
    }

    if (temAcesso) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
