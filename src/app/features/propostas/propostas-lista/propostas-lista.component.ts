import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { PropostaService } from '../../../core/services/proposta.service';
import { ReservaPropostaDTO } from '../../../core/models/proposta-fluxo.model';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { TableColumn } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-propostas-lista',
  templateUrl: './propostas-lista.component.html',
  styleUrls: ['./propostas-lista.component.scss']
})
export class PropostasListaComponent extends BaseListComponent implements OnInit {
  reservas: ReservaPropostaDTO[] = [];
  filtros: any = {};
  paginaAtual: number = 0;
  itensPorPagina: number = 10;
  colunas: TableColumn[] = [];

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
    this.configurarTabela();
    this.carregar();
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nomeEmpreendimento', header: 'Empreendimento', sortable: true, width: '22%' },
      { field: 'unidade', header: 'Unidade', sortable: true, width: '12%' },
      { field: 'corretor', header: 'Corretor', template: 'corretor', width: '18%' },
      { field: 'descricaoStatus', header: 'Status', template: 'status', sortable: true, width: '18%' },
      { field: 'dataReserva', header: 'Data Reserva', template: 'dataReserva', sortable: true, align: 'center', width: '15%' },
      { field: 'proposta', header: 'Proposta', template: 'proposta', align: 'center', width: '15%' }
    ];
  }

  carregar(): void {
    this.carregando = true;
    const page = this.paginaAtual || 0;
    const size = this.itensPorPagina || 10;

    this.propostaService.listarReservasParaProposta(page, size, this.filtros).subscribe({
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

  iniciarProposta(reserva: ReservaPropostaDTO): void {
    console.log('=== Iniciando navegação ===');
    console.log('Reserva ID:', reserva.id);
    console.log('Rota destino:', '/propostas/novo/dados-iniciais');
    console.log('Query params:', { reservaId: reserva.id });
    
    // Navega para Step 1 (Dados Iniciais) passando reservaId como query param
    const navegacao = this.router.navigate(['/propostas/novo/dados-iniciais'], {
      queryParams: { reservaId: reserva.id }
    });
    
    navegacao.then(
      success => console.log('Navegação bem-sucedida:', success),
      error => console.error('Erro na navegação:', error)
    );
  }

  continuarProposta(reserva: ReservaPropostaDTO): void {
    if (reserva.propostaId) {
      // Se já existe proposta, vai direto para Step 2  
      this.router.navigate([`/propostas/${reserva.propostaId}/dados-cliente`]);
    } else {
      // Se não existe, inicia nova proposta
      this.iniciarProposta(reserva);
    }
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

  limparFiltros(): void {
    this.filtros = {};
    this.carregar();
  }

  exportar(): void {
    this.exportando = true;
    // TODO: Implementar exportação quando backend disponibilizar endpoint
    setTimeout(() => {
      this.exportando = false;
      console.log('Exportação de reservas para proposta');
    }, 1000);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const statusUpper = status?.toUpperCase() || '';
    
    // Mapeamento baseado em palavras-chave no status
    if (statusUpper.includes('RESERVADO') || statusUpper.includes('VENDA')) {
      return 'info';
    }
    if (statusUpper.includes('ANALISE') || statusUpper.includes('PROPOSTA')) {
      return 'warning';
    }
    if (statusUpper.includes('APROVADO') || statusUpper.includes('CONTRATO')) {
      return 'success';
    }
    if (statusUpper.includes('CANCELADO') || statusUpper.includes('RECUSADO')) {
      return 'danger';
    }
    
    return 'info';
  }
}
