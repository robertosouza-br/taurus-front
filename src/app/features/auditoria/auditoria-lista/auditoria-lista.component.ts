import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AuditoriaDTO, FiltroAuditoriaDTO, ENTIDADES_AUDITADAS, TIPO_OPERACAO_LABELS, TIPO_OPERACAO_SEVERITY, EntidadeAuditada, TipoRelatorio, TIPO_RELATORIO_ICONS } from '../../../core/models/auditoria.model';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ExportOption } from '../../../shared/components/export-speed-dial/export-speed-dial.component';

/**
 * Componente de listagem de auditoria
 * 
 * Funcionalidade: AUDITORIA (acesso restrito a administradores)
 * Permissão requerida: CONSULTAR
 * 
 * Este componente permite visualizar o histórico completo de alterações do sistema,
 * incluindo inserções, atualizações e exclusões de registros.
 */
@Component({
  selector: 'app-auditoria-lista',
  templateUrl: './auditoria-lista.component.html',
  styleUrls: ['./auditoria-lista.component.scss']
})
export class AuditoriaListaComponent implements OnInit {
  auditorias: AuditoriaDTO[] = [];
  totalRegistros = 0;
  carregando = false;
  
  filtro: FiltroAuditoriaDTO = {
    page: 0,
    size: 50,
    sort: 'dataHora,desc'
  };

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [];

  // Opções dos filtros
  entidades = ENTIDADES_AUDITADAS;
  entidadesFiltradas: EntidadeAuditada[] = [];
  entidadeSelecionada: EntidadeAuditada | null = null;

  // Opções de exportação
  exportOptions: ExportOption[] = [];
  exportando = false;

  // Colunas da tabela
  colunas: TableColumn[] = [];
  
  // Ações da tabela
  acoes: TableAction[] = [];

  constructor(
    private auditoriaService: AuditoriaService,
    private permissaoService: PermissaoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.temPermissao(Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    this.configurarBreadcrumb();
    this.configurarTabela();
    this.inicializarFiltros();
    this.inicializarExportOptions();
    this.carregar();
  }

  private inicializarFiltros(): void {
    this.entidadesFiltradas = [...this.entidades];
  }

  filtrarEntidades(event: any): void {
    const query = event.query.toLowerCase();
    this.entidadesFiltradas = this.entidades.filter(entidade => 
      entidade.label.toLowerCase().includes(query)
    );
  }

  mostrarTodasEntidades(): void {
    this.entidadesFiltradas = [...this.entidades];
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Auditoria' }
    ];
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'dataHora', header: 'Data/Hora', width: '15%', template: 'dataHora', align: 'center' },
      { field: 'usuarioNome', header: 'Usuário', width: '20%', align: 'left' },
      { field: 'usuarioCpf', header: 'CPF', width: '13%', template: 'usuarioCpf', align: 'center' },
      { field: 'entidade', header: 'Entidade', width: '15%', align: 'center' },
      { field: 'tipoOperacao', header: 'Operação', width: '12%', template: 'tipoOperacao', align: 'center' },
      { field: 'ipCliente', header: 'IP', width: '13%', align: 'center' }
    ];

    this.acoes = [
      {
        icon: 'pi pi-eye',
        tooltip: 'Visualizar detalhes',
        severity: 'info',
        action: (row: AuditoriaDTO) => this.visualizar(row)
      }
    ];
  }

  visualizar(auditoria: AuditoriaDTO): void {
    this.router.navigate(['/auditoria', auditoria.revisaoId], {
      state: { auditoria }
    });
  }

  carregar(): void {
    this.carregando = true;
    
    // Cria uma cópia do filtro para enviar ao backend
    const filtroParaEnvio = { ...this.filtro };
    
    // Formata as datas apenas na cópia, sem modificar o filtro original
    if (filtroParaEnvio.dataInicio) {
      filtroParaEnvio.dataInicio = this.formatarDataParaBackend(filtroParaEnvio.dataInicio) as any;
    }
    
    if (filtroParaEnvio.dataFim) {
      const dataFimAjustada = this.ajustarDataFimParaDiaCompleto(filtroParaEnvio.dataFim);
      filtroParaEnvio.dataFim = this.formatarDataParaBackend(dataFimAjustada) as any;
    }
    
    this.auditoriaService.listar(filtroParaEnvio).subscribe({
      next: (response) => {
        this.auditorias = response.content;
        this.totalRegistros = response.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  onLazyLoad(event: any): void {
    this.filtro.page = event.first / event.rows;
    this.filtro.size = event.rows;
    this.carregar();
  }

  filtrar(): void {
    // Extrai o value da entidade selecionada
    if (this.entidadeSelecionada) {
      this.filtro.tipoEntidade = this.entidadeSelecionada.value;
    } else {
      this.filtro.tipoEntidade = undefined;
    }
    
    this.filtro.page = 0;
    this.carregar();
  }

  limparFiltros(): void {
    this.filtro = {
      page: 0,
      size: this.filtro.size
    };
    this.entidadeSelecionada = null;
    this.carregar();
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.AUDITORIA, permissao);
  }

  getLabelOperacao(tipoOperacao: string): string {
    return TIPO_OPERACAO_LABELS[tipoOperacao as keyof typeof TIPO_OPERACAO_LABELS] || tipoOperacao;
  }

  getSeverityOperacao(tipoOperacao: string): 'success' | 'info' | 'danger' | 'warning' {
    const severity = TIPO_OPERACAO_SEVERITY[tipoOperacao as keyof typeof TIPO_OPERACAO_SEVERITY];
    return severity || 'info';
  }

  formatarDataHora(dataHora: string): string {
    if (!dataHora) return '';
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

  formatarCpf(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  inicializarExportOptions(): void {
    this.exportOptions = [
      {
        icon: TIPO_RELATORIO_ICONS[TipoRelatorio.PDF],
        label: 'PDF',
        format: TipoRelatorio.PDF,
        tooltipLabel: 'Exportar PDF'
      },
      {
        icon: TIPO_RELATORIO_ICONS[TipoRelatorio.XLSX],
        label: 'Excel (XLSX)',
        format: TipoRelatorio.XLSX,
        tooltipLabel: 'Exportar Excel'
      },
      {
        icon: TIPO_RELATORIO_ICONS[TipoRelatorio.CSV],
        label: 'CSV',
        format: TipoRelatorio.CSV,
        tooltipLabel: 'Exportar CSV'
      },
      {
        icon: TIPO_RELATORIO_ICONS[TipoRelatorio.TXT],
        label: 'Texto (TXT)',
        format: TipoRelatorio.TXT,
        tooltipLabel: 'Exportar TXT'
      }
    ];
  }

  exportarRelatorio(tipoRelatorio: string): void {
    this.exportando = true;
    
    // Extrai o value da entidade selecionada
    const filtroExportacao = { ...this.filtro };
    if (this.entidadeSelecionada) {
      filtroExportacao.tipoEntidade = this.entidadeSelecionada.value;
    }
    
    // Formata as datas para o backend
    if (filtroExportacao.dataInicio) {
      filtroExportacao.dataInicio = this.formatarDataParaBackend(filtroExportacao.dataInicio) as any;
    }
    
    if (filtroExportacao.dataFim) {
      const dataFimAjustada = this.ajustarDataFimParaDiaCompleto(filtroExportacao.dataFim);
      filtroExportacao.dataFim = this.formatarDataParaBackend(dataFimAjustada) as any;
    }
    
    // Remove propriedades de paginação
    delete filtroExportacao.page;
    delete filtroExportacao.size;
    delete filtroExportacao.sort;
    
    this.auditoriaService.exportarRelatorio(filtroExportacao, tipoRelatorio as TipoRelatorio).subscribe({
      next: (blob) => {
        // Cria URL para download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Define o nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
        const extensao = tipoRelatorio.toLowerCase();
        link.download = `auditoria_${timestamp}.${extensao}`;
        
        // Dispara o download
        link.click();
        
        // Limpa a URL criada
        window.URL.revokeObjectURL(url);
        
        this.exportando = false;
      },
      error: () => {
        this.exportando = false;
      }
    });
  }

  /**
   * Formata uma data do JavaScript para o formato aceito pelo backend
   * @param data - Date ou string
   * @returns string no formato yyyy-MM-dd'T'HH:mm:ss
   */
  private formatarDataParaBackend(data: Date | string): string {
    if (!data) return '';
    
    const d = typeof data === 'string' ? new Date(data) : data;
    
    // Verifica se é uma data válida
    if (isNaN(d.getTime())) {
      console.error('Data inválida:', data);
      return '';
    }
    
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    const segundos = String(d.getSeconds()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
  }

  /**
   * Ajusta data fim para incluir todo o dia (23:59:59)
   */
  private ajustarDataFimParaDiaCompleto(data: Date | string): Date {
    const d = typeof data === 'string' ? new Date(data) : new Date(data);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
