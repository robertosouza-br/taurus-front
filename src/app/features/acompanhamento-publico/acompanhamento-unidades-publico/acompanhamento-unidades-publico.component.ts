import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  AcompanhamentoUnidadesPublicoSaidaDTO,
  UnidadeStatusPublicoSaidaDTO
} from '../../../core/models/acompanhamento-unidades-publico.model';
import { getStatusColors } from '../../../core/models/unidade.model';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';

@Component({
  selector: 'app-acompanhamento-unidades-publico',
  templateUrl: './acompanhamento-unidades-publico.component.html',
  styleUrls: ['./acompanhamento-unidades-publico.component.scss']
})
export class AcompanhamentoUnidadesPublicoComponent implements OnInit, OnDestroy {
  carregando = false;
  erro = '';
  acompanhamento: AcompanhamentoUnidadesPublicoSaidaDTO | null = null;
  empreendimentoId = '';
  bloco = '';
  parte = 1;
  ultimaAtualizacao = '';

  private readonly destroy$ = new Subject<void>();
  private autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empreendimentoService: EmpreendimentoService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => this.processarParametros(params));

    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    this.pararAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get unidades(): UnidadeStatusPublicoSaidaDTO[] {
    return this.acompanhamento?.unidades || [];
  }

  get partesDisponiveis(): number[] {
    const totalPartes = this.acompanhamento?.totalPartes || 0;
    return Array.from({ length: totalPartes }, (_, index) => index + 1);
  }

  get gradeStyles(): { [key: string]: string } {
    const quantidade = Math.max(this.unidades.length, 1);
    const colunasBase = Math.ceil(Math.sqrt(quantidade * 1.72));
    const colunas = Math.max(quantidade <= 4 ? quantidade : 1, Math.min(colunasBase, 18));
    const linhas = Math.ceil(quantidade / colunas);

    if (quantidade >= 121) {
      return {
        '--grid-columns': `${colunas}`,
        '--grid-rows': `${linhas}`,
        '--grid-gap': '0.3rem',
        '--card-padding': '0.35rem',
        '--card-radius': '12px',
        '--badge-size': '18px',
        '--badge-offset': '0.35rem',
        '--numero-size': 'clamp(0.95rem, 1.4vw, 1.35rem)',
        '--status-size': '0.52rem'
      };
    }

    if (quantidade >= 81) {
      return {
        '--grid-columns': `${colunas}`,
        '--grid-rows': `${linhas}`,
        '--grid-gap': '0.4rem',
        '--card-padding': '0.45rem',
        '--card-radius': '14px',
        '--badge-size': '20px',
        '--badge-offset': '0.4rem',
        '--numero-size': 'clamp(1.1rem, 1.6vw, 1.55rem)',
        '--status-size': '0.58rem'
      };
    }

    if (quantidade >= 41) {
      return {
        '--grid-columns': `${colunas}`,
        '--grid-rows': `${linhas}`,
        '--grid-gap': '0.55rem',
        '--card-padding': '0.6rem',
        '--card-radius': '16px',
        '--badge-size': '22px',
        '--badge-offset': '0.55rem',
        '--numero-size': 'clamp(1.3rem, 1.9vw, 1.8rem)',
        '--status-size': '0.68rem'
      };
    }

    return {
      '--grid-columns': `${Math.min(colunas, 8)}`,
      '--grid-rows': `${linhas}`,
      '--grid-gap': '0.8rem',
      '--card-padding': '0.9rem',
      '--card-radius': '22px',
      '--badge-size': '30px',
      '--badge-offset': '0.8rem',
      '--numero-size': 'clamp(2rem, 3vw, 2.8rem)',
      '--status-size': '0.92rem'
    };
  }

  recarregar(): void {
    this.carregar();
  }

  irParaParte(parte: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        empreendimentoId: this.empreendimentoId,
        bloco: this.bloco,
        parte
      }
    });
  }

  getStatusColor(codigoStatusUnidade: number): { bg: string; border: string; text: string; severity: string } {
    return getStatusColors(codigoStatusUnidade);
  }

  formatarNumeroUnidade(unidade: string): string {
    const valor = (unidade || '').trim();

    if (!valor) {
      return '';
    }

    if (/^\d+$/.test(valor)) {
      return valor.replace(/^0+/, '') || '0';
    }

    return valor.replace(/^0+(?=\d)/, '') || valor;
  }

  getClasseDensidade(): string {
    const quantidade = this.unidades.length;

    if (quantidade >= 121) {
      return 'densidade-ultra';
    }

    if (quantidade >= 81) {
      return 'densidade-alta';
    }

    if (quantidade >= 41) {
      return 'densidade-media';
    }

    return 'densidade-normal';
  }

  private processarParametros(params: ParamMap): void {
    this.empreendimentoId = (params.get('empreendimentoId') || '').trim();
    this.bloco = (params.get('bloco') || '').trim();
    const parteParam = Number(params.get('parte') || '1');
    this.parte = Number.isFinite(parteParam) && parteParam > 0 ? parteParam : 1;
    this.carregar();
  }

  private iniciarAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      this.carregar(true);
    }, 10000);
  }

  private pararAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  private atualizarHorario(): void {
    const agora = new Date();
    this.ultimaAtualizacao = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private carregar(silencioso: boolean = false): void {
    if (!this.empreendimentoId || !this.bloco) {
      this.acompanhamento = null;
      this.erro = 'Informe empreendimentoId e bloco na URL para visualizar o acompanhamento público.';
      return;
    }

    if (!silencioso) {
      this.carregando = true;
      this.acompanhamento = null;
    }

    this.erro = '';

    this.empreendimentoService.buscarAcompanhamentoUnidadesPublico(this.empreendimentoId, this.bloco, this.parte)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (!silencioso) {
            this.carregando = false;
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.acompanhamento = response;
          this.atualizarHorario();
        },
        error: (error) => {
          console.error('Erro ao carregar acompanhamento público de unidades:', error);
          this.erro = error?.error?.message || 'Não foi possível carregar o acompanhamento público das unidades.';

          if (!silencioso) {
            this.acompanhamento = null;
          }
        }
      });
  }
}