import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import {
  LinkPublicoUnidadeBlocoSaidaDTO,
  LinksPublicosUnidadeBlocoAgrupadoSaidaDTO
} from '../../../core/models/acompanhamento-unidades-publico.model';
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
  grupos: LinksPublicosUnidadeBlocoAgrupadoSaidaDTO[] = [];
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
    this.carregar();
  }

  carregar(): void {
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
    this.empreendimentoService.listarLinksPublicosUnidadesAgrupados(this.codigoEmpreendimento)
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (grupos) => {
          this.grupos = grupos;

          if (!this.nomeEmpreendimento && grupos.length > 0) {
            this.nomeEmpreendimento = grupos[0].empreendimento;
            this.configurarBreadcrumb();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar links públicos de unidades:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Não foi possível carregar os links públicos do empreendimento.'
          });
        }
      });
  }

  abrirAcompanhamento(link: LinkPublicoUnidadeBlocoSaidaDTO): void {
    const rota = this.router.serializeUrl(
      this.router.createUrlTree(['/acompanhamento-publico/unidades'], {
        queryParams: {
          empreendimentoId: link.empreendimentoId,
          bloco: link.bloco,
          parte: link.parte
        }
      })
    );

    window.open(`${window.location.origin}${rota}`, '_blank', 'noopener');
  }

  async copiarLink(link: LinkPublicoUnidadeBlocoSaidaDTO): Promise<void> {
    const rota = this.router.serializeUrl(
      this.router.createUrlTree(['/acompanhamento-publico/unidades'], {
        queryParams: {
          empreendimentoId: link.empreendimentoId,
          bloco: link.bloco,
          parte: link.parte
        }
      })
    );

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${rota}`);
      this.messageService.add({
        severity: 'success',
        summary: 'Link copiado',
        detail: `O link público da parte ${link.parte} foi copiado para a área de transferência.`
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