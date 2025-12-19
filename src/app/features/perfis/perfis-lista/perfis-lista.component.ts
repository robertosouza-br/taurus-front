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
        severity: 'primary',
        visible: this.podeIncluir,
        action: () => this.novoPerfil()
      }
    ];
  }

  private configurarTabela(): void {
    // Configuração das colunas
    this.colunas = [
      { field: 'id', header: '#', width: '80px', sortable: true, align: 'center' },
      { field: 'nome', header: 'Nome', sortable: true, align: 'left', template: 'nome' },
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
        visible: (perfil) => this.podeExcluirPerfil(perfil),
        action: (perfil) => this.excluirPerfil(perfil)
      }
    ];
  }

  carregarPerfis(search: string = ''): void {
    this.carregando = true;
    // Carrega TODOS os perfis de uma vez para ordenação client-side
    this.funcionalidadeService.listarPerfis(0, 1000, search)
      .subscribe({
        next: (response: Page<PerfilDTO>) => {
          this.perfis = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.number;
          this.carregando = false;
        },
        error: (error) => {
          // Exibe mensagem específica para erro 403 e redireciona
          if (error.status === 403) {
            const mensagem = error.error?.detail || error.error?.message || 'Você não tem permissão para consultar perfis';
            this.messageService.add({
              severity: 'error',
              summary: 'Acesso Negado',
              detail: mensagem,
              life: 5000
            });
            
            // Redireciona para tela de acesso negado após mostrar o toast
            setTimeout(() => {
              this.router.navigate(['/acesso-negado']);
            }, 1500);
          } else {
            const mensagem = error.error?.message || error.error?.detail || 'Erro ao carregar perfis';
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: mensagem,
              life: 5000
            });
          }
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
                life: 3000
              });
              this.carregarPerfis();
            },
            error: (error) => {
              this.messageService.clear();
              
              // Erro 403 - Tentativa de excluir perfil de sistema
              if (error.status === 403) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Operação Não Permitida',
                  detail: error.error?.message || 'Perfis de sistema não podem ser excluídos',
                  life: 5000
                });
                return;
              }
              
              // Erro 409 - Perfil com usuários vinculados
              if (error.status === 409) {
                const quantidadeVinculos = error.error?.quantidadeVinculos || 0;
                this.messageService.add({
                  severity: 'error',
                  summary: 'Não é Possível Excluir',
                  detail: `Este perfil possui ${quantidadeVinculos} usuário(s) vinculado(s). Remova os vínculos antes de excluir.`,
                  life: 6000
                });
                return;
              }
              
              // Outros erros
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: error.error?.message || 'Erro ao excluir perfil',
                life: 5000
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

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.carregarPerfis(searchTerm);
  }

  /**
   * Verifica se o perfil é um perfil de sistema
   */
  isPerfilSistema(perfil: PerfilDTO): boolean {
    return perfil.perfilSistema === true;
  }

  /**
   * Verifica se o perfil é o ADMINISTRADOR
   */
  isAdministrador(perfil: PerfilDTO): boolean {
    return perfil.nome === 'ADMINISTRADOR';
  }

  /**
   * Verifica se o perfil é o CORRETOR
   */
  isCorretor(perfil: PerfilDTO): boolean {
    return perfil.nome === 'CORRETOR';
  }

  /**
   * Verifica se o perfil pode ser excluído
   */
  podeExcluirPerfil(perfil: PerfilDTO): boolean {
    return !this.isPerfilSistema(perfil) && this.podeExcluir;
  }
}
