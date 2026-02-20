import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { ReservaService } from '../../../core/services/reserva.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { ReservaDTO, StatusReserva, STATUS_RESERVA_LABELS, STATUS_RESERVA_SEVERITY } from '../../../core/models/reserva.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-reservas-lista',
  templateUrl: './reservas-lista.component.html',
  styleUrls: ['./reservas-lista.component.scss']
})
export class ReservasListaComponent extends BaseListComponent implements OnInit {
  reservas: ReservaDTO[] = [];
  paginaAtual = 0;
  tamanhoPagina = 50;
  ordenacao?: string;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: any[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  constructor(
    private reservaService: ReservaService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    this.breadcrumbItems = [
      { label: 'Reservas', icon: 'pi pi-bookmark' },
      { label: 'Listagem' }
    ];

    this.configurarHeaderActions();
    this.configurarTabela();
    this.carregar();
  }

  private configurarHeaderActions(): void {
    if (this.temPermissaoIncluir()) {
      this.headerActions = [
        {
          label: 'Nova Reserva',
          icon: 'pi pi-plus',
          command: () => this.nova()
        }
      ];
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nomeEmpreendimento', header: 'Empreendimento', width: '20%', align: 'left', sortable: true },
      { field: 'bloco', header: 'Bloco / Unidade', width: '12%', align: 'center', sortable: true, template: 'blocoUnidade' },
      { field: 'tipologia', header: 'Tipologia', width: '11%', align: 'left', sortable: true, template: 'tipologia' },
      { field: 'nomeCliente', header: 'Cliente', width: '19%', align: 'left', sortable: true, template: 'cliente' },
      { field: 'nomeImobiliariaPrincipal', header: 'Imobiliária', width: '16%', align: 'left', sortable: true, template: 'imobiliaria' },
      { field: 'dataReserva', header: 'Data Reserva', width: '10%', align: 'center', sortable: true, pipe: 'date', pipeFormat: 'dd/MM/yyyy' },
      { field: 'status', header: 'Status', width: '12%', align: 'center', sortable: true, template: 'status' }
    ];

    this.acoes = [
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        visible: () => this.temPermissaoAlterar(),
        action: (row: ReservaDTO) => this.editar(row)
      },
      {
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        visible: () => this.temPermissaoExcluir(),
        action: (row: ReservaDTO) => this.excluir(row)
      }
    ];
  }

  carregar(): void {
    this.carregando = true;
    this.reservaService.listar(this.paginaAtual, this.tamanhoPagina, this.ordenacao)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (page) => {
          this.reservas = page.content;
          this.totalRegistros = page.totalElements;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar as reservas.'
          });
        }
      });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, (page, size) => {
      this.paginaAtual = page;
      this.tamanhoPagina = size;
      this.ordenacao = this.buildSortParam(event?.sortField, event?.sortOrder);
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

  nova(): void {
    this.router.navigate(['/reservas/nova']);
  }

  editar(reserva: ReservaDTO): void {
    this.router.navigate(['/reservas', reserva.id, 'editar']);
  }

  excluir(reserva: ReservaDTO): void {
    this.confirmationService.confirm({
      message: `Deseja excluir a reserva da unidade ${reserva.bloco}/${reserva.unidade}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.reservaService.excluir(reserva.id)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Reserva excluída com sucesso.'
              });
              this.carregar();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível excluir a reserva.'
              });
            }
          });
      }
    });
  }

  getStatusLabel(status: StatusReserva): string {
    return STATUS_RESERVA_LABELS[status] || status;
  }

  getStatusSeverity(status: StatusReserva): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    return STATUS_RESERVA_SEVERITY[status] || 'secondary';
  }

  temPermissaoIncluir(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.INCLUIR);
  }

  temPermissaoAlterar(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.ALTERAR);
  }

  temPermissaoExcluir(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.EXCLUIR);
  }

  formatarData(data: string | null): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  }
}
