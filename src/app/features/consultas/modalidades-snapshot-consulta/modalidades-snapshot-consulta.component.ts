import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { Empreendimento } from '../../../core/models/empreendimento.model';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-modalidades-snapshot-consulta',
  templateUrl: './modalidades-snapshot-consulta.component.html',
  styleUrls: ['./modalidades-snapshot-consulta.component.scss']
})
export class ModalidadesSnapshotConsultaComponent implements OnInit {
  breadcrumbItems: BreadcrumbItem[] = [];
  empreendimentoSelecionado: Empreendimento | null = null;
  empreendimentosSugeridos: Empreendimento[] = [];
  carregandoEmpreendimentos = false;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private empreendimentoService: EmpreendimentoService
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.PROPOSTA, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.breadcrumbItems = [
      { label: 'Consultas', icon: 'pi pi-search' },
      { label: 'Modalidade de empreendimentos' }
    ];
  }

  buscarEmpreendimentos(event: { query?: string }): void {
    const termo = event.query?.trim();

    this.carregandoEmpreendimentos = true;

    this.empreendimentoService.listarEmpreendimentos(0, 50, termo || undefined)
      .pipe(finalize(() => this.carregandoEmpreendimentos = false))
      .subscribe({
        next: (response) => {
          this.empreendimentosSugeridos = response.content;
        },
        error: (error) => {
          console.error('Erro ao buscar empreendimentos para consulta do snapshot:', error);
          this.empreendimentosSugeridos = [];
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Não foi possível carregar os empreendimentos para a consulta.'
          });
        }
      });
  }

  mostrarTodosEmpreendimentos(): void {
    this.buscarEmpreendimentos({ query: '' });
  }

  limpar(): void {
    this.empreendimentoSelecionado = null;
    this.empreendimentosSugeridos = [];
  }

  consultar(): void {
    if (!this.empreendimentoSelecionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empreendimento obrigatório',
        detail: 'Selecione um empreendimento para consultar a funcionalidade Modalidade de empreendimentos.'
      });
      return;
    }

    this.router.navigate(
      ['/empreendimentos', this.empreendimentoSelecionado.codEmpreendimento, 'modalidades-tabela-padrao-snapshot'],
      {
        queryParams: { origem: 'consulta' },
        state: { nomeEmpreendimento: this.empreendimentoSelecionado.nome }
      }
    );
  }
}