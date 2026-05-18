import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { SincronizacaoService } from '../../../core/services/sincronizacao.service';
import { SincronizacaoEmpreendimentosSaidaDTO, UltimaSincronizacaoEmpreendimentosSaidaDTO } from '../../../core/models/sincronizacao.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { TableColumn } from '../../../shared/components/data-table/data-table.component';

/**
 * Componente para sincronização administrativa de empreendimentos e unidades
 * 
 * FUNCIONALIDADE:
 * - Exibe última sincronização registrada ao abrir a tela
 * - Permite sincronização manual sob demanda
 * - Exibe resumo consolidado da execução
 * - Mostra detalhamento por empreendimento
 * - Bloqueia nova execução durante processamento
 * 
 * OBSERVAÇÕES:
 * - Existe rotina automática diária às 03:00
 * - Esta ação é complementar, não substitui o agendamento
 * - Operação pode demorar vários segundos/minutos
 */
@Component({
  selector: 'app-sincronizacao-empreendimentos',
  templateUrl: './sincronizacao-empreendimentos.component.html',
  styleUrls: ['./sincronizacao-empreendimentos.component.scss']
})
export class SincronizacaoEmpreendimentosComponent implements OnInit {
  /**
   * Indica se está carregando a última sincronização
   */
  carregandoUltimaSincronizacao = false;

  /**
   * Dados da última sincronização registrada
   */
  ultimaSincronizacao: UltimaSincronizacaoEmpreendimentosSaidaDTO | null = null;

  /**
   * Indica se a sincronização está em andamento
   */
  sincronizando = false;

  /**
   * Resultado da última sincronização executada
   */
  resultado: SincronizacaoEmpreendimentosSaidaDTO | null = null;

  /**
   * Itens do breadcrumb
   */
  breadcrumbItems: BreadcrumbItem[] = [];

  /**
   * Ações do header
   */
  headerActions: HeaderAction[] = [];

  /**
   * Colunas da tabela de detalhamento
   */
  colunas: TableColumn[] = [];

  constructor(
    private sincronizacaoService: SincronizacaoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.configurarHeader();
    this.configurarTabela();
    this.carregarUltimaSincronizacao();
  }

  /**
   * Carrega os dados da última sincronização registrada
   */
  private carregarUltimaSincronizacao(): void {
    this.carregandoUltimaSincronizacao = true;

    this.sincronizacaoService.consultarUltimaSincronizacao().subscribe({
      next: (dados) => {
        this.ultimaSincronizacao = dados;
        this.carregandoUltimaSincronizacao = false;
      },
      error: (erro) => {
        this.carregandoUltimaSincronizacao = false;
        
        const mensagemErro = erro.error?.message || 'Erro ao consultar última sincronização';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar dados',
          detail: mensagemErro
        });
        
        console.error('Erro ao consultar última sincronização:', erro);
      }
    });
  }

  /**
   * Configura o breadcrumb da página
   */
  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Sincronização de Empreendimentos e Unidades' }
    ];
  }

  /**
   * Configura as ações do header
   */
  private configurarHeader(): void {
    this.headerActions = [
      {
        label: 'Sincronizar Registros',
        icon: 'pi pi-refresh',
        severity: 'primary',
        command: () => this.sincronizar()
      }
    ];
  }

  /**
   * Configura as colunas da tabela de detalhamento
   */
  private configurarTabela(): void {
    this.colunas = [
      {
        field: 'codEmpreendimento',
        header: 'Código',
        sortable: false,
        width: '100px'
      },
      {
        field: 'nomeEmpreendimento',
        header: 'Empreendimento',
        sortable: false
      },
      {
        field: 'status',
        header: 'Status',
        sortable: false,
        width: '150px',
        align: 'center'
      },
      {
        field: 'blocosSincronizados',
        header: 'Blocos',
        sortable: false,
        width: '100px',
        align: 'center'
      },
      {
        field: 'unidadesSincronizadas',
        header: 'Unidades',
        sortable: false,
        width: '120px',
        align: 'center'
      },
      {
        field: 'mensagem',
        header: 'Mensagem',
        sortable: false
      }
    ];
  }

  /**
   * Executa a sincronização de empreendimentos e unidades
   */
  sincronizar(): void {
    // Bloqueia novas execuções durante o processamento
    if (this.sincronizando) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Aguarde a conclusão da sincronização em andamento'
      });
      return;
    }

    this.sincronizando = true;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Sincronização iniciada',
      detail: 'Processando registros... Esta operação pode levar alguns minutos.'
    });

    this.sincronizacaoService.sincronizarEmpreendimentosUnidades().subscribe({
      next: (resultado) => {
        this.resultado = resultado;
        this.sincronizando = false;
        
        // Determina o tipo de mensagem baseado nos resultados
        if (resultado.totalEmpreendimentosComErro === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Sincronização concluída com sucesso',
            detail: `${resultado.totalEmpreendimentosSincronizados} empreendimento(s), ${resultado.totalBlocosSincronizados} bloco(s) e ${resultado.totalUnidadesSincronizadas} unidade(s) sincronizados`
          });
        } else if (resultado.totalEmpreendimentosSincronizados > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sincronização concluída com avisos',
            detail: `${resultado.totalEmpreendimentosSincronizados} sincronizados, ${resultado.totalEmpreendimentosComErro} com erro. Verifique o detalhamento.`
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro na sincronização',
            detail: 'Todos os empreendimentos falharam. Verifique o detalhamento.'
          });
        }

        // Recarrega a última sincronização após execução bem-sucedida
        this.carregarUltimaSincronizacao();
      },
      error: (erro) => {
        this.sincronizando = false;
        
        const mensagemErro = erro.error?.message || 'Erro inesperado ao processar a sincronização';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao sincronizar',
          detail: mensagemErro
        });
        
        console.error('Erro na sincronização:', erro);
      }
    });
  }

  /**
   * Retorna a severidade do status para exibição visual
   */
  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'SUCESSO' ? 'success' : 'danger';
  }

  /**
   * Retorna o ícone do status para exibição visual
   */
  getStatusIcon(status: string): string {
    return status === 'SUCESSO' ? 'pi pi-check-circle' : 'pi pi-times-circle';
  }

  /**
   * Formata a data e hora da sincronização para exibição
   */
  formatarDataHora(dataHora: string): string {
    if (!dataHora) return '-';
    
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formata a data e hora de forma curta (sem segundos)
   */
  formatarDataHoraCurta(dataHora: string): string {
    if (!dataHora) return '-';
    
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
