import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import {
  ModalidadeTabelaPadraoSnapshot,
  ModalidadeTabelaPadraoSnapshotComponente,
  ModalidadeTabelaPadraoSnapshotResumo
} from '../../../core/models/modalidade-tabela-padrao-snapshot.model';
import { ModalidadeTabelaPadraoSnapshotService } from '../../../core/services/modalidade-tabela-padrao-snapshot.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-empreendimento-modalidades-snapshot',
  templateUrl: './empreendimento-modalidades-snapshot.component.html',
  styleUrls: ['./empreendimento-modalidades-snapshot.component.scss']
})
export class EmpreendimentoModalidadesSnapshotComponent implements OnInit {
  codigoEmpreendimento = '';
  nomeEmpreendimento = '';
  incluirInativos = false;
  origemConsulta = false;

  carregandoResumo = false;
  carregandoLista = false;
  carregandoDetalhe = false;

  resumo: ModalidadeTabelaPadraoSnapshotResumo | null = null;
  modalidades: ModalidadeTabelaPadraoSnapshot[] = [];
  modalidadeSelecionada: ModalidadeTabelaPadraoSnapshot | null = null;
  detalheModalidade: ModalidadeTabelaPadraoSnapshot | null = null;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private snapshotService: ModalidadeTabelaPadraoSnapshotService
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.PROPOSTA, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.origemConsulta = this.route.snapshot.queryParamMap.get('origem') === 'consulta';

    this.codigoEmpreendimento = this.route.snapshot.paramMap.get('codigo') || '';

    if (!this.codigoEmpreendimento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código do empreendimento não informado.'
      });
      this.router.navigate([this.origemConsulta ? '/consultas/modalidades-snapshot' : '/empreendimentos']);
      return;
    }

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;

    if (state?.nomeEmpreendimento) {
      this.nomeEmpreendimento = state.nomeEmpreendimento;
    }

    this.configurarBreadcrumb();
    this.configurarHeader();
    this.carregarResumo();
    this.carregarLista(true);
  }

  private configurarBreadcrumb(): void {
    if (this.origemConsulta) {
      this.breadcrumbItems = [
        { label: 'Consultas', icon: 'pi pi-search' },
        { label: 'Modalidade de empreendimentos', url: '/consultas/modalidades-snapshot' },
        { label: this.nomeEmpreendimento || `Cód. ${this.codigoEmpreendimento}` }
      ];
      return;
    }

    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/empreendimentos' },
      { label: this.nomeEmpreendimento || `Cód. ${this.codigoEmpreendimento}` },
      { label: 'Modalidade de empreendimentos' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [
      {
        label: this.origemConsulta ? 'Nova Consulta' : 'Mapa de Unidades',
        icon: this.origemConsulta ? 'pi pi-search' : 'pi pi-th-large',
        outlined: true,
        action: () => this.voltarParaOrigem()
      }
    ];
  }

  carregarResumo(): void {
    this.carregandoResumo = true;

    this.snapshotService.consultarResumo(this.codigoEmpreendimento)
      .pipe(finalize(() => this.carregandoResumo = false))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;

          if (!this.nomeEmpreendimento && resumo.nomeEmpreendimento) {
            this.nomeEmpreendimento = resumo.nomeEmpreendimento;
            this.configurarBreadcrumb();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar resumo do snapshot de modalidades:', error);
          this.resumo = null;

          this.messageService.add({
            severity: error.status === 404 ? 'warn' : 'error',
            summary: error.status === 404 ? 'Resumo indisponível' : 'Erro',
            detail: error.error?.message || 'Não foi possível carregar o resumo do snapshot de modalidades.'
          });
        }
      });
  }

  carregarLista(selecionarPrimeira: boolean = false): void {
    const codigoAtual = this.modalidadeSelecionada?.codigoModalidade || null;

    this.carregandoLista = true;

    this.snapshotService.listarPorEmpreendimento(this.codigoEmpreendimento, this.incluirInativos)
      .pipe(finalize(() => this.carregandoLista = false))
      .subscribe({
        next: (modalidades) => {
          this.modalidades = modalidades;

          if (!this.nomeEmpreendimento && modalidades.length > 0) {
            this.nomeEmpreendimento = modalidades[0].nomeEmpreendimento;
            this.configurarBreadcrumb();
          }

          if (modalidades.length === 0) {
            this.modalidadeSelecionada = null;
            this.detalheModalidade = null;
            return;
          }

          const codigoParaSelecionar = codigoAtual && modalidades.some(item => item.codigoModalidade === codigoAtual)
            ? codigoAtual
            : (selecionarPrimeira ? modalidades[0].codigoModalidade : codigoAtual || modalidades[0].codigoModalidade);

          if (codigoParaSelecionar) {
            this.selecionarModalidadePorCodigo(codigoParaSelecionar);
          }
        },
        error: (error) => {
          console.error('Erro ao carregar lista de snapshots de modalidades:', error);
          this.modalidades = [];
          this.modalidadeSelecionada = null;
          this.detalheModalidade = null;

          this.messageService.add({
            severity: error.status === 404 ? 'warn' : 'error',
            summary: error.status === 404 ? 'Lista indisponível' : 'Erro',
            detail: error.error?.message || 'Não foi possível carregar a lista de modalidades do snapshot.'
          });
        }
      });
  }

  aoAlterarIncluirInativos(): void {
    this.carregarLista();
  }

  onSelecionarModalidade(modalidade: ModalidadeTabelaPadraoSnapshot): void {
    this.modalidadeSelecionada = modalidade;
    this.carregarDetalhe(modalidade.codigoModalidade);
  }

  private selecionarModalidadePorCodigo(codigoModalidade: string): void {
    const modalidade = this.modalidades.find(item => item.codigoModalidade === codigoModalidade);

    if (!modalidade) {
      this.modalidadeSelecionada = null;
      this.detalheModalidade = null;
      return;
    }

    this.modalidadeSelecionada = modalidade;
    this.carregarDetalhe(codigoModalidade);
  }

  private carregarDetalhe(codigoModalidade: string): void {
    this.carregandoDetalhe = true;

    this.snapshotService.consultarDetalhe(this.codigoEmpreendimento, codigoModalidade, this.incluirInativos)
      .pipe(finalize(() => this.carregandoDetalhe = false))
      .subscribe({
        next: (detalhe) => {
          this.detalheModalidade = detalhe;
        },
        error: (error) => {
          console.error('Erro ao carregar detalhe da modalidade snapshot:', error);
          this.detalheModalidade = null;

          this.messageService.add({
            severity: error.status === 404 ? 'warn' : 'error',
            summary: error.status === 404 ? 'Detalhe não encontrado' : 'Erro',
            detail: error.error?.message || 'Não foi possível carregar o detalhe da modalidade selecionada.'
          });
        }
      });
  }

  voltarParaOrigem(): void {
    if (this.origemConsulta) {
      this.router.navigate(['/consultas/modalidades-snapshot']);
      return;
    }

    this.router.navigate(['/empreendimentos', this.codigoEmpreendimento, 'unidades'], {
      state: { nomeEmpreendimento: this.nomeEmpreendimento }
    });
  }

  getLinhaSelecionada(codigoModalidade: string): boolean {
    return this.modalidadeSelecionada?.codigoModalidade === codigoModalidade;
  }

  getAtivoSeverity(ativo: boolean): 'success' | 'danger' {
    return ativo ? 'success' : 'danger';
  }

  getTabelaPadraoSeverity(valor: string | null): 'info' | 'secondary' {
    return (valor || '').toUpperCase() === 'SIM' ? 'info' : 'secondary';
  }

  getComponenteTabelaPadraoSeverity(componente: ModalidadeTabelaPadraoSnapshotComponente): 'info' | 'secondary' {
    return componente.tabelaPadrao ? 'info' : 'secondary';
  }

  formatarDataHora(dataHora: string | null): string {
    if (!dataHora) {
      return '-';
    }

    return new Date(dataHora).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarNumero(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2
    }).format(valor);
  }
}