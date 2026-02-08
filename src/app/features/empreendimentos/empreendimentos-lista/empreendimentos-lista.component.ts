import { Component, OnInit, OnDestroy } from '@angular/core';
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
 * FUNCIONALIDADES:
 * - Listar empreendimentos em cards visuais
 * - Pesquisar por nome
 * - Paginação de resultados
 * - Visualizar imagem de capa (principal)
 * - Acessar portfólio de imagens
 * - Renovação automática de URLs do MinIO (válidas por 5 minutos)
 * 
 * PERMISSÕES (Backend):
 * - EMPREENDIMENTOS_CONSULTAR (listar e visualizar)
 * - Administradores têm acesso total
 * 
 * MAPEAMENTO FRONTEND → BACKEND:
 * - Funcionalidade.EMPREENDIMENTO + Permissao.CONSULTAR → EMPREENDIMENTOS_CONSULTAR
 * 
 * IMAGEM DE CAPA (conforme mapa de integração):
 * - Backend retorna automaticamente o campo 'imagemCapa' no DTO de listagem
 * - imagemCapa contém a URL da imagem marcada como PRINCIPAL do empreendimento
 * - URLs MinIO têm validade de 5 minutos (300 segundos)
 * - Se não houver imagem principal definida, backend retorna URL da imagem padrão:
 *   taurus/empreendimentos/sem_empreendimento.png
 * - Frontend trata erro de carregamento (URL expirada) e exibe placeholder
 * 
 * COMPATIBILIDADE:
 * - Mantém suporte à estrutura antiga (disponivelPdc, array imagens) durante transição
 */
@Component({
  selector: 'app-empreendimentos-lista',
  templateUrl: './empreendimentos-lista.component.html',
  styleUrls: ['./empreendimentos-lista.component.scss']
})
export class EmpreendimentosListaComponent extends BaseListComponent implements OnInit, OnDestroy {
  empreendimentos: Empreendimento[] = [];
  
  filtro: EmpreendimentoFiltro = {
    page: 0,
    size: 12
  };
  
  // Timer para renovação automática de URLs do MinIO
  private refreshTimer: any = null;
  
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
    // Verifica permissão de consulta (EMPREENDIMENTOS_CONSULTAR no backend)
    if (!this.permissaoService.temPermissao(Funcionalidade.EMPREENDIMENTO, Permissao.CONSULTAR)) {
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
          
          // Agenda renovação automática das URLs do MinIO (expiram em 5 minutos)
          this.agendarRenovacaoUrls();
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
   * Tratamento de erro ao carregar imagem
   */
  onImageError(event: Event, emp: Empreendimento): void {
    (event.target as HTMLImageElement).src = this.getPlaceholderImage();
  }

  /**
   * Navega para o portfólio de imagens do empreendimento
   * Requer: EMPREENDIMENTOS_CONSULTAR (já verificado no ngOnInit)
   */
  gerenciarImagens(emp: Empreendimento): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.EMPREENDIMENTO, Permissao.CONSULTAR)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para visualizar o portfólio'
      });
      return;
    }
    this.router.navigate(['/empreendimentos', emp.codEmpreendimento, 'imagens'], {
      state: { nomeEmpreendimento: emp.nome }
    });
  }

  /**
   * Retorna a URL da imagem de apresentação do empreendimento
   * 
   * ESTRUTURA OFICIAL (conforme mapa de integração):
   * - Backend retorna o campo 'imagemCapa' diretamente no DTO de listagem
   * - imagemCapa já vem com a URL da imagem marcada como PRINCIPAL
   * - Se não houver imagem principal, vem a URL da imagem padrão (sem_empreendimento.png)
   * - URLs MinIO têm validade de 5 minutos
   * 
   * COMPATIBILIDADE:
   * - Mantém suporte ao array 'imagens' caso backend ainda não esteja atualizado
   * - Fallback para placeholder local em último caso
   */
  getImagemPrincipal(emp: Empreendimento): string {
    // Estrutura oficial: campo imagemCapa vem diretamente no DTO
    if (emp.imagemCapa) {
      return emp.imagemCapa;
    }
    
    // Compatibilidade: estrutura antiga com array de imagens
    const imagemPrincipal = emp.imagens?.find(img => img.principal);
    if (imagemPrincipal) {
      return imagemPrincipal.urlImagem || imagemPrincipal.urlTemporaria || this.getPlaceholderImage();
    }
    
    // Fallback: placeholder local SVG
    return this.getPlaceholderImage();
  }

  /**
   * Retorna placeholder SVG local
   * Usado apenas como fallback quando backend não retorna imagemCapa
   * ou quando há erro ao carregar a imagem (URL expirada)
   */
  private getPlaceholderImage(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';
  }

  /**
   * Verifica se empreendimento possui imagem real (não a imagem padrão)
   * Útil para exibir badges ou indicadores visuais
   */
  temImagem(emp: Empreendimento): boolean {
    // Verifica se imagemCapa não é a imagem padrão
    if (emp.imagemCapa && !emp.imagemCapa.includes('sem_empreendimento')) {
      return true;
    }
    
    // Compatibilidade: verifica array de imagens
    const imagemPrincipal = emp.imagens?.find(img => img.principal);
    if (!imagemPrincipal) return false;
    
    const nomeArquivo = imagemPrincipal.nomeArquivo || '';
    return !nomeArquivo.includes('sem_empreendimento');
  }

  /**
   * Verifica se empreendimento está disponível para venda
   * 
   * ESTRUTURA OFICIAL: campo 'disponivel' (S/N)
   * COMPATIBILIDADE: mantém suporte ao campo antigo 'disponivelPdc'
   */
  isDisponivel(emp: Empreendimento): boolean {
    return (emp.disponivel || emp.disponivelPdc) === 'S';
  }

  ngOnDestroy(): void {
    // Limpa o timer de renovação de URLs
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Agenda renovação automática das URLs do MinIO
   * URLs do MinIO expiram em 5 minutos (300s)
   * Renova 30 segundos antes de expirar (270s = 4min30s)
   */
  private agendarRenovacaoUrls(): void {
    // Limpa timer anterior se existir
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // URLs do MinIO expiram em 5 minutos = 300 segundos
    // Renovar 30 segundos antes = 270 segundos
    const tempoParaRenovar = 270 * 1000; // 4min30s em milissegundos

    this.refreshTimer = setTimeout(() => {
      this.renovarUrls();
    }, tempoParaRenovar);
  }

  /**
   * Renova as URLs das imagens (chamada silenciosa, sem loading)
   * Usa o endpoint de listagem que já retorna URLs assinadas novas do MinIO
   */
  private renovarUrls(): void {
    // Usa o mesmo endpoint de listagem que já retorna URLs renovadas do MinIO
    this.empreendimentoService
      .listarEmpreendimentos(this.filtro.page, this.filtro.size, this.filtro.search)
      .subscribe({
        next: (response) => {
          // Atualiza apenas as URLs das imagens, mantendo outras propriedades
          this.empreendimentos = this.empreendimentos.map(empAtual => {
            const empAtualizado = response.content.find(e => e.codEmpreendimento === empAtual.codEmpreendimento);
            if (empAtualizado) {
              return {
                ...empAtual,
                imagemCapa: empAtualizado.imagemCapa,
                imagens: empAtualizado.imagens // Atualiza array completo de imagens
              };
            }
            return empAtual;
          });
          
          // Agenda próxima renovação
          this.agendarRenovacaoUrls();
        },
        error: (error: any) => {
          console.error('[EmpreendimentosLista] Erro ao renovar URLs:', error);
          // Em caso de erro, tenta novamente em 30 segundos
          this.refreshTimer = setTimeout(() => this.renovarUrls(), 30000);
        }
      });
  }
}
