import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AuditoriaDTO, FiltroAuditoriaDTO, ENTIDADES_AUDITADAS, TIPO_OPERACAO_LABELS, TIPO_OPERACAO_SEVERITY } from '../../../core/models/auditoria.model';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

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
    size: 10
  };

  // Breadcrumb
  breadcrumbItems: BreadcrumbItem[] = [];

  // Opções dos filtros
  entidades = ENTIDADES_AUDITADAS;
  entidadesFiltradas: string[] = [];
  
  tiposOperacao = [
    { label: TIPO_OPERACAO_LABELS['INSERT'], value: 'INSERT' },
    { label: TIPO_OPERACAO_LABELS['UPDATE'], value: 'UPDATE' },
    { label: TIPO_OPERACAO_LABELS['DELETE'], value: 'DELETE' }
  ];
  tiposOperacaoFiltrados: any[] = [];

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
    this.carregar();
  }

  private inicializarFiltros(): void {
    this.entidadesFiltradas = [...this.entidades];
    this.tiposOperacaoFiltrados = [...this.tiposOperacao];
  }

  filtrarEntidades(event: any): void {
    const query = event.query.toLowerCase();
    this.entidadesFiltradas = this.entidades.filter(entidade => 
      entidade.toLowerCase().includes(query)
    );
  }

  mostrarTodasEntidades(): void {
    this.entidadesFiltradas = [...this.entidades];
  }

  filtrarTiposOperacao(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposOperacaoFiltrados = this.tiposOperacao.filter(tipo => 
      tipo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosTiposOperacao(): void {
    this.tiposOperacaoFiltrados = [...this.tiposOperacao];
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Auditoria' }
    ];
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'id', header: 'ID', width: '5%' },
      { field: 'nomeEntidade', header: 'Entidade', width: '10%' },
      { field: 'idEntidade', header: 'ID Entidade', width: '8%' },
      { field: 'tipoOperacao', header: 'Operação', width: '10%', template: 'tipoOperacao' },
      { field: 'usuarioNome', header: 'Usuário', width: '15%' },
      { field: 'usuarioCpf', header: 'CPF', width: '12%', template: 'usuarioCpf' },
      { field: 'dataHora', header: 'Data/Hora', width: '15%', template: 'dataHora' },
      { field: 'ipOrigem', header: 'IP', width: '10%' }
    ];

    this.acoes = [
      {
        icon: 'pi pi-eye',
        tooltip: 'Visualizar detalhes',
        severity: 'info',
        action: (row: AuditoriaDTO) => this.visualizar(row.id)
      }
    ];
  }

  visualizar(id: number): void {
    this.router.navigate(['/auditoria', id]);
  }

  carregar(): void {
    this.carregando = true;
    this.auditoriaService.listar(this.filtro).subscribe({
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
    this.filtro.page = 0;
    this.carregar();
  }

  limparFiltros(): void {
    this.filtro = {
      page: 0,
      size: this.filtro.size
    };
    this.carregar();
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.AUDITORIA, permissao);
  }

  getLabelOperacao(tipoOperacao: string): string {
    return TIPO_OPERACAO_LABELS[tipoOperacao as keyof typeof TIPO_OPERACAO_LABELS] || tipoOperacao;
  }

  getSeverityOperacao(tipoOperacao: string): 'success' | 'info' | 'danger' {
    const severity = TIPO_OPERACAO_SEVERITY[tipoOperacao as keyof typeof TIPO_OPERACAO_SEVERITY];
    return severity || 'info';
  }

  formatarCpf(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
}
