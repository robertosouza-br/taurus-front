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
 * 
 * IMAGEM DE APRESENTAÇÃO:
 * - Backend retorna automaticamente o campo 'imagemCapa' com a URL da imagem principal
 * - A imagem principal é aquela marcada como 'principal: true' no cadastro
 * - URLs têm validade de 5 minutos (geradas pelo MinIO)
 * - Se não houver imagem principal, backend retorna URL da imagem padrão (sem_empreendimento.png)
 * - Frontend usa placeholder local para evitar requisição à imagem padrão do backend
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
          
          // Debug: verificar se imagemCapa está vindo do backend
          if (this.empreendimentos.length > 0) {
            console.log('Exemplo de empreendimento retornado:', this.empreendimentos[0]);
            console.log('imagemCapa presente?', this.empreendimentos[0].imagemCapa);
          }
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
   * Navega para ver o portfólio de imagens
   */
  gerenciarImagens(emp: Empreendimento): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.CONSULTAR)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para visualizar o portfólio'
      });
      return;
    }
    this.router.navigate(['/empreendimentos', emp.codEmpreendimento, 'imagens']);
  }

  /**
   * Retorna a imagem principal ou placeholder
   * 
   * ESTRUTURA ATUAL: Backend retorna array 'imagens' com urlTemporaria
   * ESTRUTURA FUTURA: Backend retornará campo 'imagemCapa' diretamente
   * Este método suporta ambas as estruturas
   */
  getImagemPrincipal(emp: Empreendimento): string {
    // Tenta nova estrutura (quando backend for atualizado)
    if (emp.imagemCapa) {
      return emp.imagemCapa;
    }
    
    // Estrutura atual: busca no array de imagens
    const imagemPrincipal = emp.imagens?.find(img => img.principal);
    if (imagemPrincipal) {
      // Suporta ambos os campos (urlImagem é o novo, urlTemporaria é o atual)
      return imagemPrincipal.urlImagem || imagemPrincipal.urlTemporaria || this.getPlaceholderImage();
    }
    
    // Fallback para placeholder local
    return this.getPlaceholderImage();
  }

  /**
   * Retorna imagem placeholder local (usado apenas como fallback)
   */
  private getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';
  }

  /**
   * Verifica se empreendimento tem imagem real (não padrão)
   */
  temImagem(emp: Empreendimento): boolean {
    // Verifica nova estrutura
    if (emp.imagemCapa && !emp.imagemCapa.includes('sem_empreendimento')) {
      return true;
    }
    
    // Verifica estrutura atual
    const imagemPrincipal = emp.imagens?.find(img => img.principal);
    if (!imagemPrincipal) return false;
    
    const nomeArquivo = imagemPrincipal.nomeArquivo || '';
    return !nomeArquivo.includes('sem_empreendimento');
  }

  /**
   * Retorna se empreendimento está disponível
   * Suporta ambos os campos (disponivel é novo, disponivelPdc é atual)
   */
  isDisponivel(emp: Empreendimento): boolean {
    return (emp.disponivel || emp.disponivelPdc) === 'S';
  }
}
