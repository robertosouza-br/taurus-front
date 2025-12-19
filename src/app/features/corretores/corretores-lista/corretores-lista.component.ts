import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { CorretorSaidaDTO, CARGO_LABELS } from '../../../core/models/corretor.model';
import { Page } from '../../../core/models/page.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-corretores-lista',
  templateUrl: './corretores-lista.component.html',
  styleUrls: ['./corretores-lista.component.scss']
})
export class CorretoresListaComponent implements OnInit {
  corretores: any[] = [];
  totalRecords = 0;
  carregando = false;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  constructor(
    private corretorService: CorretorService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService
  ) {}

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
      { field: 'nome', header: 'Nome', sortable: true },
      { field: 'cpf', header: 'CPF', sortable: true, template: 'cpf', align: 'center' },
      { field: 'telefone', header: 'Telefone', sortable: true, template: 'telefone', align: 'center' },
      { field: 'cargo', header: 'Cargo', sortable: true, template: 'cargo', align: 'center' },
      { field: 'email', header: 'E-mail', sortable: true },
      { field: 'ativo', header: 'Status', sortable: true, template: 'status', align: 'center' }
    ];

    this.acoes = [];

    if (this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.ALTERAR)) {
      this.acoes.push({
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        command: (rowData: any) => this.editarCorretor(rowData.id)
      });
    }

    if (this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.EXCLUIR)) {
      this.acoes.push({
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        command: (rowData: any) => this.excluirCorretor(rowData)
      });
    }
  }

  onBuscar(termo: any): void {
    this.carregarCorretores(termo as string);
  }

  carregarCorretores(search: string = ''): void {
    this.carregando = true;
    this.corretorService.listar(0, 50, search).subscribe({
      next: (page: Page<CorretorSaidaDTO>) => {
        this.corretores = page.content.map((corretor: CorretorSaidaDTO) => ({
          ...corretor,
          cargoLabel: CARGO_LABELS[corretor.cargo]
        }));
        this.totalRecords = page.totalElements;
        this.carregando = false;
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

  editarCorretor(id: string): void {
    this.router.navigate(['/cadastros/corretores/editar', id]);
  }

  excluirCorretor(corretor: CorretorSaidaDTO): void {
    this.confirmationService.confirmDelete(corretor.nome)
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.corretorService.excluir(corretor.id).subscribe({
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
   */
  formatarCPF(cpf: string): string {
    if (!cpf || cpf.length !== 11) return cpf;
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
