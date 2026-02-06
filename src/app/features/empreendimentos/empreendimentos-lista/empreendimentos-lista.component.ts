import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Empreendimento } from '../../../core/models/empreendimento.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { PageChangeEvent } from '../../../shared/components/card-paginator/card-paginator.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BaseListComponent } from '../../../shared/base/base-list.component';

interface EmpreendimentoFiltro {
  page: number;
  size: number;
  search?: string;
}

/**
 * Componente de listagem de empreendimentos
 * Visual moderno com cards destacados
 * 
 * Funcionalidade: IMOVEL
 * Permissão requerida: CONSULTAR
 */
@Component({
  selector: 'app-empreendimentos-lista',
  templateUrl: './empreendimentos-lista.component.html',
  styleUrls: ['./empreendimentos-lista.component.scss']
})
export class EmpreendimentosListaComponent extends BaseListComponent implements OnInit {
  empreendimentos: Empreendimento[] = [];
  
  filtro: EmpreendimentoFiltro = {
    page: 0,
    size: 12
  };
  
  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];

  constructor(
    private empreendimentoService: EmpreendimentoService,
    private permissaoService: PermissaoService,
    private router: Router,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {

    if (!this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.configurarBreadcrumb();
    this.configurarHeader();
    this.carregar();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [];
    // Adicionar ações futuras aqui (ex: exportar, filtros avançados)
  }

  carregar(): void {
    this.carregando = true;
    this.empreendimentoService
      .listarEmpreendimentos(this.filtro.page, this.filtro.size, this.filtro.search)
      .subscribe({
        next: (response) => {
          this.empreendimentos = response.content;
          this.totalRegistros = response.totalElements;
          this.carregando = false;
        },
        error: (error: any) => {
          this.carregando = false;
          console.error('Erro ao carregar empreendimentos:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os empreendimentos'
          });
        }
      });
  }

  onPageChange(event: PageChangeEvent): void {
    this.filtro.page = event.page;
    this.filtro.size = event.rows;
    this.carregar();
  }

  onBuscar(termo: string): void {
    this.filtro.search = termo || undefined;
    this.filtro.page = 0;
    this.carregar();
  }

  limparBusca(): void {
    this.filtro.search = undefined;
    this.filtro.page = 0;
    this.carregar();
  }

  /**
   * Navega para gerenciar imagens
   */
  gerenciarImagens(emp: Empreendimento): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.CONSULTAR)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para gerenciar imagens'
      });
      return;
    }
    this.router.navigate(['/empreendimentos', emp.codEmpreendimento, 'imagens']);
  }

  /**
   * Retorna a imagem principal ou placeholder
   */
  getImagemPrincipal(emp: Empreendimento): string {
    const imagemPrincipal = emp.imagens?.find(img => img.principal);
    return imagemPrincipal?.urlTemporaria || this.getPlaceholderImage();
  }

  /**
   * Retorna imagem placeholder
   */
  private getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';
  }

  /**
   * Conta total de imagens
   */
  getNumeroImagens(emp: Empreendimento): number {
    return emp.imagens?.length || 0;
  }

  /**
   * Retorna se empreendimento está disponível
   */
  isDisponivel(emp: Empreendimento): boolean {
    return emp.disponivelPdc === 'S';
  }
}
