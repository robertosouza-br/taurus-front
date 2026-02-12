import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { MessageService } from 'primeng/api';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { Imobiliaria, ImobiliariaFiltroDTO, TIPO_IMOBILIARIA_LABELS } from '../../../core/models/imobiliaria.model';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { BaseListComponent } from '../../../shared/base/base-list.component';

/**
 * Componente de listagem de imobiliárias
 * 
 * Funcionalidade: IMOBILIARIA
 * Permissão requerida: CONSULTAR
 */
@Component({
  selector: 'app-imobiliarias-lista',
  templateUrl: './imobiliarias-lista.component.html',
  styleUrls: ['./imobiliarias-lista.component.scss']
})
export class ImobiliariasListaComponent extends BaseListComponent implements OnInit {
  imobiliarias: Imobiliaria[] = [];

  filtro: ImobiliariaFiltroDTO = {
    page: 0,
    size: 50
  };

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [];

  // Header actions
  headerActions: any[] = [];

  // Colunas da tabela
  colunas: TableColumn[] = [];

  // Ações da tabela
  acoes: TableAction[] = [];

  constructor(
    private imobiliariaService: ImobiliariaService,
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
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Imobiliárias' }
    ];
  }

  private configurarHeaderActions(): void {
    if (this.podeIncluir) {
      this.headerActions = [
        {
          label: 'Nova Imobiliária',
          icon: 'pi pi-plus',
          command: () => this.novo()
        }
      ];
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'razaoSocial', header: 'Razão Social', width: '22%', align: 'left' },
      { field: 'nomeFantasia', header: 'Nome Fantasia', width: '18%', align: 'left' },
      { field: 'tipoImobiliaria', header: 'Tipo', width: '10%', align: 'center' },
      { field: 'cnpj', header: 'CNPJ', width: '13%', align: 'center' },
      { field: 'responsavel', header: 'Responsável', width: '13%', align: 'left' },
      { field: 'telefone', header: 'Telefone', width: '11%', align: 'center' },
      { 
        field: 'ativo', 
        header: 'Status', 
        width: '8%', 
        align: 'center',
        type: 'boolean'
      }
    ];

    this.acoes = [
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        visible: () => this.temPermissao(Permissao.ALTERAR),
        action: (row: Imobiliaria) => this.editar(row)
      },
      {
        icon: 'pi pi-check',
        tooltip: 'Ativar',
        severity: 'success',
        visible: (row: Imobiliaria) => !row.ativo && this.temPermissao(Permissao.ALTERAR),
        action: (row: Imobiliaria) => this.ativar(row)
      },
      {
        icon: 'pi pi-times',
        tooltip: 'Inativar',
        severity: 'warning',
        visible: (row: Imobiliaria) => row.ativo && this.temPermissao(Permissao.ALTERAR),
        action: (row: Imobiliaria) => this.confirmarInativacao(row)
      }
    ];
  }

  carregar(): void {
    this.carregando = true;
    this.imobiliariaService.listar(this.filtro).subscribe({
      next: (response) => {
        this.imobiliarias = response.content;
        this.totalRegistros = response.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar imobiliárias'
        });
      }
    });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, (page, size) => {
      this.filtro.page = page;
      this.filtro.size = size;
      this.carregar();
    });
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
    this.router.navigate(['/imobiliarias/novo']);
  }

  editar(imobiliaria: Imobiliaria): void {
    this.router.navigate(['/imobiliarias', imobiliaria.id, 'editar']);
  }

  confirmarInativacao(imobiliaria: Imobiliaria): void {
    this.confirmationService.confirmDelete(`a imobiliária "${imobiliaria.nomeFantasia}"`)
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.inativar(imobiliaria.id);
      });
  }

  inativar(id: number): void {
    this.imobiliariaService.inativar(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Imobiliária inativada com sucesso'
        });
        this.carregar();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao inativar imobiliária'
        });
      }
    });
  }

  ativar(imobiliaria: Imobiliaria): void {
    this.imobiliariaService.ativar(imobiliaria.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Imobiliária ativada com sucesso'
        });
        this.carregar();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao ativar imobiliária'
        });
      }
    });
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.IMOBILIARIA, permissao);
  }

  get podeIncluir(): boolean {
    return this.temPermissao(Permissao.INCLUIR);
  }

  getTipoImobiliariaLabel(tipo: string): string {
    return TIPO_IMOBILIARIA_LABELS[tipo as keyof typeof TIPO_IMOBILIARIA_LABELS] || tipo;
  }
}
