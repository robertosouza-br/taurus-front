import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { Page } from '../../../core/models/page.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

/**
 * Componente para listar perfis
 */
@Component({
  selector: 'app-perfis-lista',
  templateUrl: './perfis-lista.component.html',
  styleUrls: ['./perfis-lista.component.scss']
})
export class PerfisListaComponent implements OnInit {
  perfis: PerfilDTO[] = [];
  carregando = false;
  
  // Controle de paginação
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 50;
  searchTerm = '';
  
  // Controle de ordenação
  sortField?: string;
  sortOrder?: number;
  
  // Controle de permissões
  podeIncluir = false;
  podeAlterar = false;
  podeExcluir = false;

  // Configuração da tabela
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  // Configuração do breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [];

  // Configuração do header
  headerActions: HeaderAction[] = [];

  constructor(
    private router: Router,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    this.verificarPermissoes();
    this.configurarBreadcrumb();
    this.configurarHeader();
    this.configurarTabela();
    this.carregarPerfis();
  }

  private verificarPermissoes(): void {
    this.podeIncluir = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.INCLUIR
    );
    this.podeAlterar = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.ALTERAR
    );
    this.podeExcluir = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.EXCLUIR
    );
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Perfis' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [
      {
        label: 'Novo Perfil',
        icon: 'pi pi-plus',
        severity: 'success',
        visible: this.podeIncluir,
        action: () => this.novoPerfil()
      }
    ];
  }

  private configurarTabela(): void {
    // Configuração das colunas
    this.colunas = [
      { field: 'id', header: '#', width: '80px', sortable: true, align: 'center' },
      { field: 'nome', header: 'Nome', sortable: true, align: 'left' },
      { field: 'descricao', header: 'Descrição', sortable: true, align: 'left' },
      { 
        field: 'status', 
        header: 'Status', 
        width: '120px', 
        align: 'center',
        template: 'status'
      },
      { 
        field: 'funcionalidades', 
        header: 'Funcionalidades', 
        width: '150px', 
        align: 'center',
        template: 'funcionalidades'
      },
      { 
        field: 'permissoes', 
        header: 'Permissões', 
        width: '150px', 
        align: 'center',
        template: 'permissoes'
      }
    ];

    // Configuração das ações
    this.acoes = [
      {
        icon: 'pi pi-cog',
        tooltip: 'Configurar Permissões',
        severity: 'info',
        visible: () => this.podeAlterar,
        action: (perfil) => this.editarPerfil(perfil)
      },
      {
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        visible: () => this.podeExcluir,
        action: (perfil) => this.excluirPerfil(perfil)
      }
    ];
  }

  carregarPerfis(
    page: number = 0, 
    size: number = 50, 
    search: string = '',
    sortField?: string,
    sortOrder?: number
  ): void {
    this.carregando = true;
    this.funcionalidadeService.listarPerfis(page, size, search, sortField, sortOrder)
      .subscribe({
        next: (response: Page<PerfilDTO>) => {
          this.perfis = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.number;
          this.pageSize = response.size;
          this.carregando = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar perfis',
            life: 300000
          });
          this.carregando = false;
        }
      });
  }

  novoPerfil(): void {
    if (!this.podeIncluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para incluir perfis'
      });
      return;
    }
    this.router.navigate(['/admin/perfis/novo']);
  }

  editarPerfil(perfil: PerfilDTO): void {
    if (!this.podeAlterar) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar perfis'
      });
      return;
    }
    this.router.navigate(['/admin/perfis', perfil.id, 'configuracao']);
  }

  excluirPerfil(perfil: PerfilDTO): void {
    if (!this.podeExcluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para excluir perfis',
        life: 300000
      });
      return;
    }
    
    this.confirmationService.confirmDelete(perfil.nome).subscribe(confirmed => {
      if (confirmed) {
        this.funcionalidadeService.excluirPerfil(perfil.id)
          .subscribe({
            next: () => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Perfil excluído com sucesso',
                life: 300000
              });
              this.carregarPerfis();
            },
            error: () => {
              this.messageService.clear();
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao excluir perfil',
                life: 300000
              });
            }
          });
      }
    });
  }

  getTotalPermissoes(perfil: PerfilDTO): number {
    if (!perfil.permissoes) return 0;
    return Object.values(perfil.permissoes)
      .reduce((acc, perms) => acc + perms.length, 0);
  }

  getTotalFuncionalidades(perfil: PerfilDTO): number {
    if (!perfil.permissoes) return 0;
    return Object.keys(perfil.permissoes).length;
  }

  onPageChange(event: any): void {
    const rows = typeof event.rows === 'number' && event.rows > 0 ? event.rows : this.pageSize;
    const first = typeof event.first === 'number' && event.first >= 0
      ? event.first
      : this.currentPage * rows;
    const pageIndex = typeof event.page === 'number' && event.page >= 0
      ? event.page
      : Math.floor(first / rows);

    const sortField = event.sortField ?? this.sortField;
    const sortOrder = typeof event.sortOrder === 'number' ? event.sortOrder : this.sortOrder;

    this.sortField = sortField;
    this.sortOrder = sortOrder;
    this.pageSize = rows;

    this.carregarPerfis(
      pageIndex,
      rows,
      this.searchTerm,
      sortField,
      sortOrder
    );
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    // Mantém ordenação ao buscar
    this.carregarPerfis(0, this.pageSize, searchTerm, this.sortField, this.sortOrder);
  }
}
