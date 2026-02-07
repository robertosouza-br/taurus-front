import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { ContatoService } from '../../../core/services/contato.service';
import { ContatoDTO, StatusContato, STATUS_CONTATO_LABELS, STATUS_CONTATO_SEVERITIES } from '../../../core/models/contato.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-contatos-lista',
  templateUrl: './contatos-lista.component.html',
  styleUrls: ['./contatos-lista.component.scss']
})
export class ContatosListaComponent extends BaseListComponent implements OnInit {
  contatos: ContatoDTO[] = [];
  statusFiltro: any = null;
  totalPendentes = 0;
  
  // Propriedades herdadas de BaseListComponent
  override carregando = false;
  override totalRegistros = 0;
  
  // Propriedades de paginação (não override porque não existem na base)
  first = 0;
  rows = 20;
  
  colunas: TableColumn[] = [
    { field: 'dataCriacao', header: 'Data', width: '15%', template: 'data', align: 'center' },
    { field: 'status', header: 'Status', width: '15%', template: 'status', align: 'center' },
    { field: 'nome', header: 'Contato', width: '25%', template: 'nome', align: 'center' },
    { field: 'assunto', header: 'Mensagem', width: '45%', template: 'assunto' }
  ];
  
  acoes: any[] = [
    {
      icon: 'pi pi-eye',
      tooltip: 'Visualizar',
      severity: 'info',
      action: (contato: ContatoDTO) => this.visualizar(contato)
    }
  ];
  
  statusOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Pendentes', value: StatusContato.PENDENTE },
    { label: 'Lidos', value: StatusContato.LIDO },
    { label: 'Respondidos', value: StatusContato.RESPONDIDO }
  ];

  breadcrumbItems: BreadcrumbItem[] = [];

  readonly StatusContato = StatusContato;
  readonly STATUS_LABELS = STATUS_CONTATO_LABELS;
  readonly STATUS_SEVERITIES = STATUS_CONTATO_SEVERITIES;

  constructor(
    private contatoService: ContatoService,
    private router: Router,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.carregarContatos();
    this.carregarContadorPendentes();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Mensagens de Contato' }
    ];
  }

  carregarContatos(): void {
    this.carregando = true;
    const pagina = Math.floor((this.first || 0) / (this.rows || 20));
    const status = this.statusFiltro?.value;

    this.contatoService.listar(pagina, this.rows, status).subscribe({
      next: (response) => {
        this.contatos = response.content;
        this.totalRegistros = response.totalElements;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar contatos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar mensagens de contato'
        });
        this.carregando = false;
      }
    });
  }

  carregarContadorPendentes(): void {
    this.contatoService.contarPendentes().subscribe({
      next: (count) => {
        this.totalPendentes = count;
      },
      error: (error) => {
        console.error('Erro ao carregar contador de pendentes:', error);
      }
    });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, () => this.carregarContatos());
  }

  buscarStatus(event: any): void {
    // Para autocomplete de status, não precisa filtrar no backend
    // As opções já estão carregadas em statusOptions
  }

  filtrarPorStatus(): void {
    this.first = 0;
    this.carregarContatos();
  }

  visualizar(contato: ContatoDTO): void {
    if (contato.id) {
      this.router.navigate(['/cadastros/contatos/detalhes', contato.id]);
    }
  }

  formatarData(data: string | undefined): string {
    if (!data) return '-';
    
    const date = new Date(data);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retorna data formatada com tempo relativo
   */
  formatarDataComRelativo(data: string | undefined): { completa: string, relativa: string } {
    if (!data) return { completa: '-', relativa: '' };
    
    const date = new Date(data);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    let relativa = '';
    if (diffMinutos < 1) {
      relativa = 'Agora';
    } else if (diffMinutos < 60) {
      relativa = `${diffMinutos}min atrás`;
    } else if (diffHoras < 24) {
      relativa = `${diffHoras}h atrás`;
    } else if (diffDias === 1) {
      relativa = 'Ontem';
    } else if (diffDias < 7) {
      relativa = `${diffDias} dias atrás`;
    }
    
    const completa = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { completa, relativa };
  }

  truncarTexto(texto: string | undefined, limite: number = 50): string {
    if (!texto) return '-';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  getStatusLabel(status: StatusContato): string {
    return STATUS_CONTATO_LABELS[status];
  }

  getStatusSeverity(status: StatusContato): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    return STATUS_CONTATO_SEVERITIES[status] as 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  }

  /**
   * Retorna ícone para o status
   */
  getStatusIcon(status: StatusContato): string {
    const icons: Record<StatusContato, string> = {
      [StatusContato.PENDENTE]: 'pi pi-clock',
      [StatusContato.LIDO]: 'pi pi-eye',
      [StatusContato.RESPONDIDO]: 'pi pi-check-circle'
    };
    return icons[status];
  }
}
