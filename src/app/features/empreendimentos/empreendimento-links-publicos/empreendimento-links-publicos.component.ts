import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import {
  LinkPublicoUnidadeTvSaidaDTO,
  LinksPublicosUnidadeBlocoPorTvSaidaDTO
} from '../../../core/models/acompanhamento-unidades-publico.model';
import { Unidade } from '../../../core/models/unidade.model';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-empreendimento-links-publicos',
  templateUrl: './empreendimento-links-publicos.component.html',
  styleUrls: ['./empreendimento-links-publicos.component.scss']
})
export class EmpreendimentoLinksPublicosComponent implements OnInit {
  codigoEmpreendimento = '';
  nomeEmpreendimento = '';
  carregando = false;
  blocosDisponiveis: Array<{ label: string; value: string }> = [];
  blocosFiltrados: Array<{ label: string; value: string }> = [];
  blocoSelecionado = '';
  quantidadeTvs = 1;
  linksGerados: LinksPublicosUnidadeBlocoPorTvSaidaDTO | null = null;
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empreendimentoService: EmpreendimentoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.codigoEmpreendimento = this.route.snapshot.paramMap.get('codigo') || '';

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    this.nomeEmpreendimento = state?.nomeEmpreendimento || '';

    this.configurarBreadcrumb();
    this.carregarBlocos();
  }

  get podeGerarLinks(): boolean {
    return !!this.blocoSelecionado && this.quantidadeTvs > 0;
  }

  filtrarBlocos(event: { query?: string }): void {
    const query = (event?.query || '').trim().toLowerCase();

    if (!query) {
      this.blocosFiltrados = [...this.blocosDisponiveis];
      return;
    }

    this.blocosFiltrados = this.blocosDisponiveis.filter((bloco) =>
      bloco.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosBlocos(): void {
    this.blocosFiltrados = [...this.blocosDisponiveis];
  }

  carregarBlocos(): void {
    if (!this.codigoEmpreendimento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código do empreendimento não informado.'
      });
      void this.router.navigate(['/empreendimentos']);
      return;
    }

    this.carregando = true;
    this.empreendimentoService.listarUnidades(this.codigoEmpreendimento)
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (unidades: Unidade[]) => {
          const blocos = Array.from(
            new Set(
              unidades
                .map((unidade) => (unidade.bloco || '').trim())
                .filter((bloco) => !!bloco)
            )
          ).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

          this.blocosDisponiveis = blocos.map((bloco) => ({ label: bloco, value: bloco }));
          this.blocosFiltrados = [...this.blocosDisponiveis];

          if (!this.blocoSelecionado && this.blocosDisponiveis.length > 0) {
            this.blocoSelecionado = this.blocosDisponiveis[0].value;
          }

          if (!this.nomeEmpreendimento && unidades.length > 0) {
            this.nomeEmpreendimento = unidades[0].empreendimento;
            this.configurarBreadcrumb();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar blocos do empreendimento:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Não foi possível carregar os blocos do empreendimento.'
          });
        }
      });
  }

  gerarLinks(): void {
    if (!this.podeGerarLinks) {
      return;
    }

    this.carregando = true;
    this.linksGerados = null;

    this.empreendimentoService.listarLinksPublicosUnidadesPorTv(
      this.codigoEmpreendimento,
      this.blocoSelecionado,
      this.quantidadeTvs
    )
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (response) => {
          this.linksGerados = response;

          if (!this.nomeEmpreendimento && response.empreendimento) {
            this.nomeEmpreendimento = response.empreendimento;
            this.configurarBreadcrumb();
          }
        },
        error: (error) => {
          console.error('Erro ao gerar links públicos por TV:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Não foi possível gerar os links públicos para o bloco informado.'
          });
        }
      });
  }

  abrirAcompanhamento(link: LinkPublicoUnidadeTvSaidaDTO): void {
    const rota = this.router.serializeUrl(
      this.router.createUrlTree(['/acompanhamento-publico/unidades'], {
        queryParams: {
          empreendimentoId: link.empreendimentoId,
          bloco: link.bloco,
          quantidadeTvs: link.totalTvs,
          tv: link.tv
        }
      })
    );

    window.open(`${window.location.origin}${rota}`, '_blank', 'noopener');
  }

  async copiarLink(link: LinkPublicoUnidadeTvSaidaDTO): Promise<void> {
    const rota = this.router.serializeUrl(
      this.router.createUrlTree(['/acompanhamento-publico/unidades'], {
        queryParams: {
          empreendimentoId: link.empreendimentoId,
          bloco: link.bloco,
          quantidadeTvs: link.totalTvs,
          tv: link.tv
        }
      })
    );

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${rota}`);
      this.messageService.add({
        severity: 'success',
        summary: 'Link copiado',
        detail: `O link público da TV ${link.tv} foi copiado para a área de transferência.`
      });
    } catch (error) {
      console.error('Erro ao copiar link público:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'Não foi possível copiar',
        detail: 'Copie manualmente o link exibido na tela.'
      });
    }
  }

  voltarParaMapaUnidades(): void {
    void this.router.navigate(['/empreendimentos', this.codigoEmpreendimento, 'unidades'], {
      state: { nomeEmpreendimento: this.nomeEmpreendimento }
    });
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/empreendimentos' },
      { label: this.nomeEmpreendimento || `Cód. ${this.codigoEmpreendimento}` },
      { label: 'Links Públicos de Unidades' }
    ];
  }
}