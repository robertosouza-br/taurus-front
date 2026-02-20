import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BancoService } from '../../../core/services/banco.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { MessageService } from 'primeng/api';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { Banco, BancoFiltroDTO, TipoRelatorioBanco, TIPO_RELATORIO_BANCO_ICONS } from '../../../core/models/banco.model';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ExportOption } from '../../../shared/components/export-speed-dial/export-speed-dial.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { BaseListComponent } from '../../../shared/base/base-list.component';

/**
 * Componente de listagem de bancos
 * 
 * Funcionalidade: BANCO
 * Permissão requerida: CONSULTAR
 */
@Component({
  selector: 'app-banco-lista',
  templateUrl: './banco-lista.component.html',
  styleUrls: ['./banco-lista.component.scss']
})
export class BancoListaComponent extends BaseListComponent implements OnInit {
  bancos: Banco[] = [];

  filtro: BancoFiltroDTO = {
    page: 0,
    size: 50,
    sort: 'codigo,ASC'
  };

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [];

  // Header actions
  headerActions: any[] = [];

  // Opções de exportação
  exportOptions: ExportOption[] = [];

  // Colunas da tabela
  colunas: TableColumn[] = [];

  // Ações da tabela
  acoes: TableAction[] = [];

  constructor(
    private bancoService: BancoService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.temPermissao(Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    
    this.configurarBreadcrumb();
    this.configurarHeaderActions();
    this.configurarTabela();
    this.inicializarExportOptions();
    // A tabela lazy carrega automaticamente via onLazyLoad
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Bancos' }
    ];
  }

  private configurarHeaderActions(): void {
    if (this.podeIncluir) {
      this.headerActions = [
        {
          label: 'Novo Banco',
          icon: 'pi pi-plus',
          command: () => this.novo()
        }
      ];
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'codigo', header: 'Código', width: '15%', align: 'center', sortable: true },
      { field: 'nome', header: 'Nome do Banco', width: '70%', align: 'left', sortable: true }
    ];

    this.acoes = [
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        visible: () => this.temPermissao(Permissao.ALTERAR),
        action: (row: Banco) => this.editar(row)
      },
      {
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        visible: () => this.temPermissao(Permissao.EXCLUIR),
        action: (row: Banco) => this.confirmarExclusao(row)
      }
    ];
  }

  private inicializarExportOptions(): void {
    this.exportOptions = [
      {
        icon: TIPO_RELATORIO_BANCO_ICONS[TipoRelatorioBanco.PDF],
        label: 'PDF',
        format: TipoRelatorioBanco.PDF,
        tooltipLabel: 'Exportar PDF'
      },
      {
        icon: TIPO_RELATORIO_BANCO_ICONS[TipoRelatorioBanco.XLSX],
        label: 'Excel',
        format: TipoRelatorioBanco.XLSX,
        tooltipLabel: 'Exportar Excel'
      },
      {
        icon: TIPO_RELATORIO_BANCO_ICONS[TipoRelatorioBanco.CSV],
        label: 'CSV',
        format: TipoRelatorioBanco.CSV,
        tooltipLabel: 'Exportar CSV'
      },
      {
        icon: TIPO_RELATORIO_BANCO_ICONS[TipoRelatorioBanco.TXT],
        label: 'TXT',
        format: TipoRelatorioBanco.TXT,
        tooltipLabel: 'Exportar TXT'
      }
    ];
  }

  carregar(): void {
    this.carregando = true;
    this.bancoService.listar(this.filtro).subscribe({
      next: (response) => {
        this.bancos = response.content;
        this.totalRegistros = response.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar bancos'
        });
      }
    });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, (page, size) => {
      this.filtro.page = page;
      this.filtro.size = size;
      this.filtro.sort = this.buildSortParam(event?.sortField, event?.sortOrder);
      this.carregar();
    });
  }

  private buildSortParam(sortField?: string, sortOrder?: number): string | undefined {
    if (!sortField || !sortOrder) {
      return undefined;
    }

    const direction = sortOrder === -1 ? 'DESC' : 'ASC';
    return `${sortField},${direction}`;
  }

  onBuscar(termo: string): void {
    this.filtro.search = termo;
    this.filtro.page = 0;
    this.carregar();
  }

  filtrar(): void {
    this.filtro.page = 0;
    this.carregar();
  }

  limparFiltros(): void {
    this.filtro = {
      page: 0,
      size: this.filtro.size
    };
    this.carregar();
  }

  novo(): void {
    this.router.navigate(['/bancos/novo']);
  }

  editar(banco: Banco): void {
    this.router.navigate(['/bancos', banco.id, 'editar']);
  }

  confirmarExclusao(banco: Banco): void {
    this.confirmationService.confirmDelete(banco.nome)
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.excluir(banco.id);
      });
  }

  excluir(id: number): void {
    this.bancoService.remover(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Banco excluído com sucesso'
        });
        this.carregar();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao excluir banco'
        });
      }
    });
  }

  exportarRelatorio(tipoRelatorio: string): void {
    this.exportando = true;
    
    const filtroExportacao = { ...this.filtro };
    delete filtroExportacao.page;
    delete filtroExportacao.size;

    this.bancoService.exportarRelatorio(filtroExportacao, tipoRelatorio as TipoRelatorioBanco).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
        const extensao = tipoRelatorio.toLowerCase();
        link.download = `bancos_${timestamp}.${extensao}`;
        
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.exportando = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao gerar relatório'
        });
        this.exportando = false;
      }
    });
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.BANCO, permissao);
  }

  get podeIncluir(): boolean {
    return this.temPermissao(Permissao.INCLUIR);
  }
}
