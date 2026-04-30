import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { PropostaService } from '../../../core/services/proposta.service';
import { ReservaPropostaDTO } from '../../../core/models/proposta-fluxo.model';
import {
  PropostaStatus,
  PROPOSTA_STATUS_SEVERITY,
  STATUS_NAO_INICIADA,
  StatusTelaProposta
} from '../../../core/models/proposta-simplificada.model';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-propostas-lista',
  templateUrl: './propostas-lista.component.html',
  styleUrls: ['./propostas-lista.component.scss']
})
export class PropostasListaComponent extends BaseListComponent implements OnInit {
  private readonly statusAliasMap: Record<string, StatusTelaProposta> = {
    NAO_INICIADA: STATUS_NAO_INICIADA,
    'NAO INICIADA': STATUS_NAO_INICIADA,
    RASCUNHO: PropostaStatus.RASCUNHO,
    AGUARDANDO_ANALISE: PropostaStatus.AGUARDANDO_ANALISE,
    'AGUARDANDO ANALISE': PropostaStatus.AGUARDANDO_ANALISE,
    EM_ANALISE: PropostaStatus.EM_ANALISE,
    'EM ANALISE': PropostaStatus.EM_ANALISE,
    APROVADA_AUTOMATICAMENTE: PropostaStatus.APROVADA_AUTOMATICAMENTE,
    'APROVADA AUTOMATICAMENTE': PropostaStatus.APROVADA_AUTOMATICAMENTE,
    APROVADA: PropostaStatus.APROVADA,
    APROVADO: PropostaStatus.APROVADA,
    REPROVADA: PropostaStatus.REPROVADA,
    REPROVADO: PropostaStatus.REPROVADA,
    RECUSADA: PropostaStatus.REPROVADA,
    RECUSADO: PropostaStatus.REPROVADA,
    EM_NEGOCIACAO: PropostaStatus.EM_NEGOCIACAO,
    'EM NEGOCIACAO': PropostaStatus.EM_NEGOCIACAO,
    FINALIZADA: PropostaStatus.FINALIZADA,
    FINALIZADO: PropostaStatus.FINALIZADA,
    CANCELADA: PropostaStatus.CANCELADA,
    CANCELADO: PropostaStatus.CANCELADA
  };

  reservas: ReservaPropostaDTO[] = [];
  paginaAtual: number = 0;
  itensPorPagina: number = 20;
  filtroTexto = '';
  breadcrumbItems: BreadcrumbItem[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  // Enums públicos para uso no template
  Funcionalidade = Funcionalidade;
  Permissao = Permissao;

  constructor(
    private propostaService: PropostaService,
    private router: Router
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
      { label: 'Início', url: '/dashboard' },
      { label: 'Propostas' }
    ];
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nomeEmpreendimento', header: 'Empreendimento', sortable: true, width: '20%' },
      { field: 'unidade', header: 'Unidade', sortable: true, align: 'center', width: '10%' },
      { field: 'tipologia', header: 'Tipologia', sortable: true, width: '12%' },
      { field: 'nomeCliente', header: 'Cliente', sortable: true, width: '18%' },
      { field: 'cpfCnpjCliente', header: 'CPF/CNPJ', template: 'cpfCnpj', align: 'center', width: '15%' },
      { field: 'statusProposta', header: 'Status', template: 'status', sortable: true, align: 'center', width: '12%' },
      { field: 'dataReserva', header: 'Data Reserva', template: 'dataReserva', sortable: true, align: 'center', width: '13%' }
    ];

    this.acoes = [
      {
        icon: 'pi pi-search',
        tooltip: 'Abrir proposta',
        severity: 'info',
        command: (row: ReservaPropostaDTO) => this.onRowClick(row)
      }
    ];
  }

  carregar(): void {
    this.carregando = true;
    const page = this.paginaAtual || 0;
    const size = this.itensPorPagina || 20;

    this.propostaService.listarReservasParaProposta(page, size, this.filtroTexto || undefined).subscribe({
      next: (response) => {
        this.reservas = response.content;
        this.totalRegistros = response.totalElements;
        
        setTimeout(() => {
          this.carregando = false;
        }, 0);
      },
      error: (error) => {
        console.error('Erro ao carregar reservas para proposta:', error);
        
        setTimeout(() => {
          this.carregando = false;
        }, 0);
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

  iniciarProposta(reserva: ReservaPropostaDTO): void {
    console.log('=== Iniciando navegação ===');
    console.log('Reserva ID:', reserva.id);
    console.log('Rota destino:', '/propostas/nova');
    console.log('Query params:', { reservaId: reserva.id });
    
    // Navega para Nova Proposta (formulário unificado) passando reservaId como query param
    const navegacao = this.router.navigate(['/propostas/nova'], {
      queryParams: { reservaId: reserva.id }
    });
    
    navegacao.then(
      success => console.log('Navegação bem-sucedida:', success),
      error => console.error('Erro na navegação:', error)
    );
  }

  continuarProposta(reserva: ReservaPropostaDTO): void {
    // Sempre redireciona para o formulário unificado
    this.router.navigate(['/propostas/nova'], {
      queryParams: { reservaId: reserva.id }
    });
  }

  onRowClick(reserva: ReservaPropostaDTO): void {
    console.log('onRowClick chamado:', reserva);
    if (reserva.propostaId) {
      console.log('Navegando para proposta existente:', reserva.propostaId);
      this.continuarProposta(reserva);
    } else {
      console.log('Iniciando nova proposta para reserva:', reserva.id);
      this.iniciarProposta(reserva);
    }
  }

  exportar(): void {
    this.exportando = true;
    // TODO: Implementar exportação quando backend disponibilizar endpoint
    setTimeout(() => {
      this.exportando = false;
      console.log('Exportação de reservas para proposta');
    }, 1000);
  }

  formatarCpfCnpj(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }

    const valorLimpo = valor.replace(/\D/g, '');

    if (valorLimpo.length === 11) {
      return valorLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    if (valorLimpo.length === 14) {
      return valorLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return valor;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const statusResolvido = this.resolverStatusTela(status);
    return PROPOSTA_STATUS_SEVERITY[statusResolvido];
  }

  private resolverStatusTela(status: string | null | undefined): StatusTelaProposta {
    const statusNormalizado = this.normalizarStatus(status);

    if (!statusNormalizado || statusNormalizado === '-') {
      return STATUS_NAO_INICIADA;
    }

    return this.statusAliasMap[statusNormalizado] ?? STATUS_NAO_INICIADA;
  }

  private normalizarStatus(status: string | null | undefined): string {
    return (status || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }
}
