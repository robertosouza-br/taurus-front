import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ReservaService } from '../../../core/services/reserva.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { ReservaDTO, StatusReserva, STATUS_RESERVA_LABELS, STATUS_RESERVA_SEVERITY, codigoToStatusReserva } from '../../../core/models/reserva.model';
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
export class ReservasListaComponent extends BaseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  reservas: ReservaDTO[] = [];
  paginaAtual = 0;
  tamanhoPagina = 50;
  ordenacao?: string;
  searchTerm: string = '';

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: any[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  constructor(
    private reservaService: ReservaService,
    private permissaoService: PermissaoService,
    private appConfirmationService: AppConfirmationService,
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

    this.configurarTabela();
    this.carregar();
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nomeEmpreendimento', header: 'Empreendimento', width: '20%', align: 'left' },
      { field: 'bloco', header: 'Bloco / Unidade', width: '12%', align: 'center', template: 'blocoUnidade' },
      { field: 'tipologia', header: 'Tipologia', width: '11%', align: 'left', template: 'tipologia' },
      { field: 'nomeCliente', header: 'Cliente', width: '19%', align: 'left', template: 'cliente' },
      { field: 'nomeImobiliariaPrincipal', header: 'Imobiliária', width: '16%', align: 'left', template: 'imobiliaria' },
      { field: 'dataReserva', header: 'Data Reserva', width: '10%', align: 'center', pipe: 'date', pipeFormat: 'dd/MM/yyyy' },
      { field: 'status', header: 'Status', width: '12%', align: 'center', template: 'status' }
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

  onBuscar(termo: any): void {
    this.searchTerm = termo as string;
    this.paginaAtual = 0; // Reset para primeira página ao buscar
    this.carregar(this.searchTerm);
  }

  carregar(search: string = ''): void {
    this.carregando = true;
    this.reservaService.listar(this.paginaAtual, this.tamanhoPagina, this.ordenacao, search)
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
      this.carregar(this.searchTerm);
    });
  }

  private buildSortParam(sortField?: string, sortOrder?: number): string | undefined {
    if (!sortField || !sortOrder) {
      return undefined;
    }

    const direction = sortOrder === -1 ? 'DESC' : 'ASC';
    return `${sortField},${direction}`;
  }

  editar(reserva: ReservaDTO): void {
    this.router.navigate(['/reservas', reserva.id, 'editar'], {
      state: { fromList: true }
    });
  }

  excluir(reserva: ReservaDTO): void {
    const mensagem = `Deseja realmente excluir a reserva da unidade ${reserva.bloco}/${reserva.unidade}?`;
    
    this.appConfirmationService.confirmDelete(mensagem)
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        
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
      });
  }

  getStatusLabel(reserva: ReservaDTO): string {
    // Prioriza descricaoStatus do backend (mais preciso)
    if (reserva.descricaoStatus) {
      return reserva.descricaoStatus;
    }
    
    // Fallback: usa enum status se disponível
    if (reserva.status) {
      return STATUS_RESERVA_LABELS[reserva.status] || reserva.status;
    }
    
    // Último fallback: converte codigoStatus para enum
    if (reserva.codigoStatus) {
      const statusConvertido = codigoToStatusReserva(reserva.codigoStatus);
      return statusConvertido ? STATUS_RESERVA_LABELS[statusConvertido] : 'N/A';
    }
    
    return 'N/A';
  }

  getStatusSeverity(reserva: ReservaDTO): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    // Converte codigoStatus para StatusReserva se status não estiver disponível
    let status = reserva.status;
    
    if (!status && reserva.codigoStatus) {
      const statusConvertido = codigoToStatusReserva(reserva.codigoStatus);
      if (statusConvertido) {
        status = statusConvertido;
      }
    }
    
    return status ? (STATUS_RESERVA_SEVERITY[status] || 'secondary') : 'secondary';
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
