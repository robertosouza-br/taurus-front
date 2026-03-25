import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AnalisePropostaService } from '../../../core/services/analise-proposta.service';
import {
  PropostaAnaliseDetalheDTO,
  StatusAnalise,
  STATUS_ANALISE_LABELS,
  STATUS_ANALISE_SEVERITY
} from '../../../core/models/analise-proposta.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-analise-detalhe',
  templateUrl: './analise-detalhe.component.html',
  styleUrls: ['./analise-detalhe.component.scss']
})
export class AnaliseDetalheComponent implements OnInit {
  carregando = false;
  processando = false;

  proposta: PropostaAnaliseDetalheDTO | null = null;
  propostaId!: number;

  // Dialog de reprovação
  exibirDialogReprovacao = false;
  motivoReprovacao = '';
  tentouSalvarReprovacao = false;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];

  STATUS_ANALISE_LABELS = STATUS_ANALISE_LABELS;
  STATUS_ANALISE_SEVERITY = STATUS_ANALISE_SEVERITY;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analiseService: AnalisePropostaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.propostaId = +this.route.snapshot.paramMap.get('id')!;
    this.configurarBreadcrumb();
    this.carregar();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Propostas', url: '/propostas' },
      { label: 'Fila de Análise', url: '/propostas/analise' },
      { label: 'Análise da Proposta' }
    ];
  }

  carregar(): void {
    this.carregando = true;
    this.analiseService.buscarDetalheAnalise(this.propostaId).subscribe({
      next: (proposta) => {
        this.proposta = proposta;
        this.configurarHeaderActions();
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        const msg = err?.error?.message || 'Erro ao carregar dados da proposta.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.router.navigate(['/propostas/analise']);
      }
    });
  }

  private configurarHeaderActions(): void {
    this.headerActions = [];

    if (!this.proposta) return;

    if (this.proposta.status === 'AGUARDANDO_ANALISE') {
      this.headerActions.push({
        label: 'Iniciar Análise',
        icon: 'pi pi-play',
        severity: 'primary',
        command: () => this.iniciarAnalise()
      });
    }

    if (this.proposta.status === 'EM_ANALISE') {
      this.headerActions.push({
        label: 'Aprovar',
        icon: 'pi pi-check',
        severity: 'success',
        command: () => this.confirmarAprovacao()
      });
      this.headerActions.push({
        label: 'Reprovar',
        icon: 'pi pi-times',
        severity: 'danger',
        command: () => this.abrirDialogReprovacao()
      });
    }
  }

  iniciarAnalise(): void {
    this.confirmationService.confirmCustom(
      'Iniciar Análise',
      `Deseja iniciar a análise da proposta <strong>${this.proposta?.numeroProposta}</strong>?`,
      { confirmLabel: 'Iniciar Análise', severity: 'info', icon: 'pi pi-play' }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.processando = true;
      this.analiseService.enviarParaAnalise(this.propostaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Análise Iniciada',
            detail: 'Análise iniciada com sucesso!'
          });
          this.processando = false;
          this.carregar();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erro ao iniciar análise. Tente novamente.';
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
          this.processando = false;
        }
      });
    });
  }

  confirmarAprovacao(): void {
    this.confirmationService.confirmCustom(
      'Aprovar Proposta',
      `Deseja realmente aprovar a proposta <strong>${this.proposta?.numeroProposta}</strong>?`,
      { confirmLabel: 'Aprovar', severity: 'success', icon: 'pi pi-check-circle' }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.processando = true;
      this.analiseService.aprovar(this.propostaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Proposta Aprovada',
            detail: 'Proposta aprovada com sucesso!'
          });
          this.processando = false;
          this.router.navigate(['/propostas/analise']);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erro ao aprovar proposta. Tente novamente.';
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
          this.processando = false;
        }
      });
    });
  }

  abrirDialogReprovacao(): void {
    this.motivoReprovacao = '';
    this.tentouSalvarReprovacao = false;
    this.exibirDialogReprovacao = true;
  }

  confirmarReprovacao(): void {
    this.tentouSalvarReprovacao = true;

    if (!this.motivoReprovacao?.trim()) {
      return;
    }

    this.processando = true;
    this.analiseService.reprovar(this.propostaId, { motivo: this.motivoReprovacao.trim() }).subscribe({
      next: () => {
        this.exibirDialogReprovacao = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Proposta Reprovada',
          detail: 'Proposta reprovada com sucesso.'
        });
        this.processando = false;
        this.router.navigate(['/propostas/analise']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao reprovar proposta. Tente novamente.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.processando = false;
      }
    });
  }

  cancelarReprovacao(): void {
    this.exibirDialogReprovacao = false;
    this.motivoReprovacao = '';
    this.tentouSalvarReprovacao = false;
  }

  voltar(): void {
    this.router.navigate(['/propostas/analise']);
  }

  /** Accessor não-nulo para uso no template (sempre chamado dentro de *ngIf proposta) */
  get p(): PropostaAnaliseDetalheDTO {
    return this.proposta!;
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

  getDiferenca(): number {
    if (!this.proposta?.comparacao) return 0;
    return this.proposta.comparacao.valorTabelaPadrao - this.proposta.comparacao.valorSimulacao;
  }
}
