import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { AnalisePropostaService } from '../../../core/services/analise-proposta.service';
import {
  PropostaAnaliseFilaDTO,
  StatusAnalise,
  STATUS_ANALISE_LABELS,
  STATUS_ANALISE_SEVERITY
} from '../../../core/models/analise-proposta.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-analise-lista',
  templateUrl: './analise-lista.component.html',
  styleUrls: ['./analise-lista.component.scss']
})
export class AnaliseListaComponent extends BaseListComponent implements OnInit {
  propostas: PropostaAnaliseFilaDTO[] = [];
  paginaAtual = 0;
  itensPorPagina = 20;
  filtroTexto = '';
  filtroStatus: string | null = null;

  breadcrumbItems: BreadcrumbItem[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  statusOpcoes = [
    { label: 'Todos', value: null },
    { label: 'Aguardando Análise', value: 'AGUARDANDO_ANALISE' },
    { label: 'Em Análise', value: 'EM_ANALISE' }
  ];

  constructor(
    private analiseService: AnalisePropostaService,
    private router: Router,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.configurarTabela();
    this.carregar();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Fila de Análise' }
    ];
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nomeEmpreendimento', header: 'Empreendimento', sortable: true, width: '20%' },
      { field: 'unidade', header: 'Unidade', sortable: true, align: 'center', width: '10%' },
      { field: 'tipologia', header: 'Tipologia', sortable: true, width: '12%' },
      { field: 'nomeCliente', header: 'Cliente', sortable: true, width: '18%' },
      { field: 'cpfCnpjCliente', header: 'CPF/CNPJ', template: 'cpfCnpj', align: 'center', width: '13%' },
      { field: 'status', header: 'Status', template: 'status', align: 'center', width: '12%' },
      { field: 'dataSolicitacaoAnalise', header: 'Solicitado em', template: 'dataSolicitacao', align: 'center', width: '15%' }
    ];

    this.acoes = [
      {
        icon: 'pi pi-search',
        tooltip: 'Analisar',
        severity: 'info',
        command: (row: PropostaAnaliseFilaDTO) => this.abrirAnalise(row)
      }
    ];
  }

  carregar(): void {
    this.carregando = true;
    const status = this.filtroStatus ? [this.filtroStatus] : undefined;

    this.analiseService.listarFilaAnalise(
      this.paginaAtual,
      this.itensPorPagina,
      this.filtroTexto || undefined,
      status
    ).subscribe({
      next: (response) => {
        this.propostas = response.content;
        this.totalRegistros = response.totalElements;
        setTimeout(() => { this.carregando = false; }, 0);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar a fila de análise.'
        });
        setTimeout(() => { this.carregando = false; }, 0);
      }
    });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, () => {
      this.paginaAtual = event.first / event.rows;
      this.itensPorPagina = event.rows;
      this.carregar();
    });
  }

  onBuscar(filtro: string): void {
    this.filtroTexto = filtro;
    this.paginaAtual = 0;
    this.carregar();
  }

  onFiltroStatusChange(): void {
    this.paginaAtual = 0;
    this.carregar();
  }

  abrirAnalise(proposta: PropostaAnaliseFilaDTO): void {
    this.router.navigate(['/propostas/analise', proposta.id]);
  }

  getStatusLabel(status: StatusAnalise): string {
    return STATUS_ANALISE_LABELS[status] || status;
  }

  getStatusSeverity(status: StatusAnalise): 'info' | 'warning' | 'success' | 'danger' {
    return STATUS_ANALISE_SEVERITY[status] || 'info';
  }

  formatarCpfCnpj(valor: string): string {
    if (!valor) return '';
    const v = valor.replace(/\D/g, '');
    if (v.length === 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (v.length === 14) {
      return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  }
}
