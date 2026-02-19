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

@Component({
  selector: 'app-reservas-lista',
  templateUrl: './reservas-lista.component.html',
  styleUrls: ['./reservas-lista.component.scss']
})
export class ReservasListaComponent extends BaseListComponent implements OnInit {
  reservas: ReservaDTO[] = [];
  paginaAtual = 0;

  breadcrumbItems: BreadcrumbItem[] = [];

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
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.reservaService.listar(this.paginaAtual)
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

  onPageChange(event: any): void {
    this.paginaAtual = event.page;
    this.carregar();
    this.scrollToTop();
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
