import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Funcionalidade, Permissao } from '../../../core/enums';
import { ImobiliariaComboDTO } from '../../../core/models/imobiliaria.model';
import { ProfissionalDTO } from '../../../core/models/profissional.model';
import { TipoProfissional, TIPO_PROFISSIONAL_LABELS } from '../../../core/models/reserva.model';
import { ImobiliariaService, PermissaoService, ProfissionalService } from '../../../core/services';
import { BaseListComponent } from '../../../shared/base/base-list.component';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

interface ProfissionalFiltro {
  page: number;
  size: number;
  search?: string;
  tipoProfissional?: TipoProfissional | null;
  imobiliariaId?: number | null;
}

@Component({
  selector: 'app-profissionais-lista',
  templateUrl: './profissionais-lista.component.html',
  styleUrls: ['./profissionais-lista.component.scss']
})
export class ProfissionaisListaComponent extends BaseListComponent implements OnInit {
  profissionais: ProfissionalDTO[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];
  busca = '';
  tipoProfissional: TipoProfissional | null = null;
  imobiliariaId: number | null = null;
  tipoProfissionalOptions = Object.values(TipoProfissional).map(tipo => ({
    label: TIPO_PROFISSIONAL_LABELS[tipo],
    value: tipo
  }));
  tipoProfissionalFiltrados = [...this.tipoProfissionalOptions];
  imobiliariaOptions: { label: string; value: number }[] = [];
  imobiliariaFiltradas: { label: string; value: number }[] = [];
  filtro: ProfissionalFiltro = {
    page: 0,
    size: 50
  };

  constructor(
    private profissionalService: ProfissionalService,
    private imobiliariaService: ImobiliariaService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.temPermissao(Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.configurarBreadcrumb();
    this.configurarHeaderActions();
    this.configurarTabela();
    this.carregarImobiliarias();
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.profissionalService.listar(
      this.filtro.page,
      this.filtro.size,
      this.filtro.search,
      this.filtro.tipoProfissional || undefined,
      this.filtro.imobiliariaId || undefined
    ).subscribe({
      next: (response) => {
        this.profissionais = response.content;
        this.totalRegistros = response.totalElements;
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao carregar profissionais'
        });
      }
    });
  }

  onLazyLoad(event: any): void {
    this.handleLazyLoad(event, (page, size) => {
      this.filtro.page = page;
      this.filtro.size = size;
      this.carregar();
    });
  }

  aplicarFiltros(): void {
    this.filtro.page = 0;
    this.filtro.search = this.busca.trim() || undefined;
    this.filtro.tipoProfissional = this.tipoProfissional;
    this.filtro.imobiliariaId = this.imobiliariaId;
    this.carregar();
  }

  limparFiltros(): void {
    this.busca = '';
    this.tipoProfissional = null;
    this.imobiliariaId = null;
    this.tipoProfissionalFiltrados = [...this.tipoProfissionalOptions];
    this.imobiliariaFiltradas = [...this.imobiliariaOptions];
    this.filtro = {
      page: 0,
      size: this.filtro.size
    };
    this.carregar();
  }

  filtrarTiposProfissionais(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.tipoProfissionalFiltrados = !query
      ? [...this.tipoProfissionalOptions]
      : this.tipoProfissionalOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  carregarTodosTiposProfissionais(): void {
    this.tipoProfissionalFiltrados = [...this.tipoProfissionalOptions];
  }

  filtrarImobiliarias(event: { query?: string }): void {
    const query = (event.query || '').toLowerCase().trim();
    this.imobiliariaFiltradas = !query
      ? [...this.imobiliariaOptions]
      : this.imobiliariaOptions.filter(item => item.label.toLowerCase().includes(query));
  }

  carregarTodasImobiliarias(): void {
    this.imobiliariaFiltradas = [...this.imobiliariaOptions];
  }

  novo(): void {
    this.router.navigate(['/cadastros/profissionais/novo']);
  }

  editar(profissional: ProfissionalDTO): void {
    this.router.navigate(['/cadastros/profissionais', profissional.id, 'editar']);
  }

  confirmarExclusao(profissional: ProfissionalDTO): void {
    this.confirmationService.confirmDelete(profissional.nome)
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.excluir(profissional.id);
      });
  }

  excluir(id: number): void {
    this.profissionalService.remover(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Profissional excluído com sucesso'
        });
        this.carregar();
      },
      error: (error) => {
        this.messageService.add({
          severity: error.status === 409 ? 'warn' : 'error',
          summary: error.status === 409 ? 'Exclusão não permitida' : 'Erro',
          detail: error.error?.message || 'Erro ao excluir profissional'
        });
      }
    });
  }

  getTipoProfissionalLabel(tipo?: TipoProfissional | null): string {
    return tipo ? TIPO_PROFISSIONAL_LABELS[tipo] : '-';
  }

  getStatusSeverity(ativo: boolean): 'success' | 'danger' {
    return ativo ? 'success' : 'danger';
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Profissionais' }
    ];
  }

  private configurarHeaderActions(): void {
    this.headerActions = this.temPermissao(Permissao.INCLUIR)
      ? [{
          label: 'Novo Profissional',
          icon: 'pi pi-plus',
          command: () => this.novo()
        }]
      : [];
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nome', header: 'Nome', sortable: false },
      { field: 'nomeGuerra', header: 'Nome de Guerra', sortable: false },
      { field: 'telefone', header: 'Telefone', width: '160px', sortable: false },
      { field: 'cpf', header: 'CPF', width: '140px', sortable: false },
      {
        field: 'tipoProfissional',
        header: 'Tipo',
        width: '170px',
        align: 'center',
        template: 'tipoProfissional'
      },
      {
        field: 'ativo',
        header: 'Status',
        width: '120px',
        align: 'center',
        template: 'ativo'
      }
    ];

    this.acoes = [
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        visible: () => this.temPermissao(Permissao.ALTERAR),
        action: (row: ProfissionalDTO) => this.editar(row)
      },
      {
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        visible: () => this.temPermissao(Permissao.EXCLUIR),
        action: (row: ProfissionalDTO) => this.confirmarExclusao(row)
      }
    ];
  }

  private carregarImobiliarias(): void {
    this.imobiliariaService.listarCombo().subscribe({
      next: (imobiliarias: ImobiliariaComboDTO[]) => {
        this.imobiliariaOptions = imobiliarias
          .filter(imobiliaria => imobiliaria.ativo)
          .map(imobiliaria => ({
            label: imobiliaria.nomeFantasia,
            value: imobiliaria.id
          }));
        this.imobiliariaFiltradas = [...this.imobiliariaOptions];
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Não foi possível carregar as imobiliárias para filtro'
        });
      }
    });
  }

  private temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.PROFISSIONAL, permissao);
  }
}