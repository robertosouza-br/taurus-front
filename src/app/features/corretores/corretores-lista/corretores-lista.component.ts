import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { CorretorSaidaDTO, CARGO_LABELS } from '../../../core/models/corretor.model';
import { Page } from '../../../core/models/page.model';
import { PermissaoService, AuthorizationService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { BaseListComponent } from '../../../shared/base/base-list.component';

@Component({
  selector: 'app-corretores-lista',
  templateUrl: './corretores-lista.component.html',
  styleUrls: ['./corretores-lista.component.scss']
})
export class CorretoresListaComponent extends BaseListComponent implements OnInit {
  corretores: any[] = [];
  currentPage = 0;
  pageSize = 50;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  constructor(
    private corretorService: CorretorService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private authorizationService: AuthorizationService,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.configurarHeader();
    this.configurarTabela();
    this.carregarCorretores();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [];

    if (this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.INCLUIR)) {
      this.headerActions.push({
        label: 'Novo Corretor',
        icon: 'pi pi-plus',
        severity: 'primary',
        command: () => this.novoCorretor()
      });
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nome', header: 'Nome', sortable: true, width: '25%' },
      { field: 'cpf', header: 'CPF', sortable: true, template: 'cpf', align: 'center', width: '15%' },
      { field: 'telefone', header: 'Telefone', sortable: true, template: 'telefone', align: 'center', width: '15%' },
      { field: 'email', header: 'E-mail', sortable: true, width: '25%' },
      { field: 'ativo', header: 'Status', sortable: true, template: 'status', align: 'center', width: '10%' }
    ];

    this.acoes = [];

    if (this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.ALTERAR)) {
      this.acoes.push({
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        command: (rowData: any) => this.editarCorretor(rowData.cpf)
      });
    }

    // Exclusão permitida apenas para administradores
    if (this.authorizationService.isAdministrador()) {
      this.acoes.push({
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        command: (rowData: any) => this.excluirCorretor(rowData)
      });
    }
  }

  onBuscar(termo: any): void {
    this.currentPage = 0; // Reset para primeira página ao buscar
    this.carregarCorretores(this.currentPage, this.pageSize, termo as string);
  }

  /**
   * Evento disparado quando usuário troca de página, ordena ou filtra
   * 
   * IMPORTANTE: Frontend trabalha com paginação 0-based (primeira página = 0).
   * O backend automaticamente converte para 1-based ao chamar a API externa.
   */
  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, (page, size) => {
      this.currentPage = page;
      this.pageSize = size;
      this.carregarCorretores(page, size);
    });
  }

  /**
   * Carrega lista de corretores com paginação server-side
   * 
   * IMPORTANTE: 
   * - A paginação é feita totalmente no backend via API externa RMS
   * - Frontend envia page 0-based, backend converte para 1-based
   * - Cada página retorna até 50 registros (fixo no backend)
   * - Total de ~3496 corretores distribuídos em 70 páginas
   * - O parâmetro 'search' NÃO é suportado pela API externa (filtrar no frontend se necessário)
   */
  carregarCorretores(page: number = 0, size: number = 50, search: string = ''): void {
    this.carregando = true;
    
    this.corretorService.listar(page, size, search).subscribe({
      next: (response: Page<CorretorSaidaDTO>) => {
        this.corretores = response.content.map((corretor: CorretorSaidaDTO) => ({
          ...corretor,
          cargoLabel: CARGO_LABELS[corretor.cargo]
        }));
        this.totalRegistros = response.totalElements;
        
        // Para navegação rápida entre páginas, oculta loading imediatamente
        setTimeout(() => {
          this.carregando = false;
        }, 0);
        
        // Log de debug para verificar paginação server-side
        console.log('📊 Paginação Server-Side:', {
          paginaAtual: response.number + 1,
          totalPaginas: response.totalPages,
          totalRegistros: response.totalElements,
          registrosNestaPagina: response.numberOfElements,
          tamanhoPagina: response.size,
          primeiraRegistro: (response.number * response.size) + 1,
          ultimoRegistro: (response.number * response.size) + response.numberOfElements
        });
      },
      error: (error) => {
        // Exibe mensagem específica para erro 403 e redireciona
        if (error.status === 403) {
          const mensagem = error.error?.detail || error.error?.message || 'Você não tem permissão para consultar corretores';
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
          const mensagem = error.error?.message || error.error?.detail || 'Erro ao carregar corretores';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagem
          });
        }
        this.carregando = false;
      }
    });
  }

  novoCorretor(): void {
    this.router.navigate(['/cadastros/corretores/novo']);
  }

  editarCorretor(cpf: string): void {
    this.router.navigate(['/cadastros/corretores/editar', cpf]);
  }

  excluirCorretor(corretor: CorretorSaidaDTO): void {
    this.confirmationService.confirmDelete(corretor.nome)
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.corretorService.excluir(corretor.idExterno).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: `Corretor "${corretor.nome}" excluído com sucesso.`,
              life: 3000
            });
            this.carregarCorretores();
          },
          error: (error) => {
            const mensagem = error.status === 400 && error.error?.message
              ? error.error.message
              : 'Não foi possível excluir o corretor.';
            
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao excluir',
              detail: mensagem,
              life: 5000
            });
          }
        });
      });
  }

  /**
   * Formata CPF para exibição (000.000.000-00)
   * 
   * NOTA: A API RMS já retorna o CPF formatado (ex: "077.696.437-24").
   * Este método é mantido para casos onde o CPF venha sem formatação.
   */
  formatarCPF(cpf: string): string {
    if (!cpf) return cpf;
    // Se já estiver formatado, retorna direto
    if (cpf.includes('.') || cpf.includes('-')) return cpf;
    // Se tiver 11 dígitos sem formatação, aplica a máscara
    if (cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata telefone para exibição
   */
  formatarTelefone(telefone: string | null | undefined): string {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }
}
