import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { EmpreendimentoDTO, PageResponse, STATUS_EMPREENDIMENTO_COLORS } from '../../../core/models/empreendimento.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-empreendimentos-lista',
  templateUrl: './empreendimentos-lista.component.html',
  styleUrls: ['./empreendimentos-lista.component.scss']
})
export class EmpreendimentosListaComponent implements OnInit, OnDestroy {
  empreendimentos: EmpreendimentoDTO[] = [];
  carregando = false;
  
  // Paginação
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 12;
  
  // Busca
  searchTerm = '';
  
  // Constantes
  readonly STATUS_COLORS = STATUS_EMPREENDIMENTO_COLORS;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private empreendimentoService: EmpreendimentoService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.carregarEmpreendimentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos' }
    ];
  }

  carregarEmpreendimentos(): void {
    this.carregando = true;

    this.empreendimentoService
      .listarEmpreendimentos(this.currentPage, this.pageSize, this.searchTerm || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PageResponse<EmpreendimentoDTO>) => {
          this.empreendimentos = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.carregando = false;
        },
        error: (error) => {
          this.carregando = false;
          let mensagem = 'Erro ao carregar empreendimentos';
          
          if (error.status === 403) {
            mensagem = 'Você não tem permissão para consultar empreendimentos';
          } else if (error.status === 500) {
            mensagem = 'Erro ao comunicar com o servidor';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagem
          });
        }
      });
  }

  buscar(): void {
    this.currentPage = 0;
    this.carregarEmpreendimentos();
  }

  limparBusca(): void {
    this.searchTerm = '';
    this.buscar();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.carregarEmpreendimentos();
  }

  verDetalhes(empreendimento: EmpreendimentoDTO): void {
    this.router.navigate(['/imoveis/empreendimentos', empreendimento.id]);
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  getStatusColor(status: string): { bg: string; color: string; icon: string } {
    return this.STATUS_COLORS[status] || { bg: '#f5f5f5', color: '#666666', icon: 'pi pi-info-circle' };
  }

  getDisponibilidadePercentual(empreendimento: EmpreendimentoDTO): number {
    if (empreendimento.totalUnidades === 0) return 0;
    return (empreendimento.unidadesDisponiveis / empreendimento.totalUnidades) * 100;
  }

  getDisponibilidadeSeverity(percentual: number): 'success' | 'warning' | 'danger' {
    if (percentual >= 50) return 'success';
    if (percentual >= 20) return 'warning';
    return 'danger';
  }
}
