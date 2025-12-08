import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { FuncionalidadeDTO, PerfilDTO, ConfiguracaoPermissaoDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

/**
 * Componente para configurar permissões de um perfil
 */
@Component({
  selector: 'app-perfil-configuracao',
  templateUrl: './perfil-configuracao.component.html',
  styleUrls: ['./perfil-configuracao.component.scss']
})
export class PerfilConfiguracaoComponent implements OnInit {
  perfilId: number;
  perfil: PerfilDTO | null = null;
  funcionalidades: FuncionalidadeDTO[] = [];
  permissoesConfiguradas: Record<string, string[]> = {};
  carregando = false;
  salvando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private permissaoService: PermissaoService
  ) {
    this.perfilId = +this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    // Verifica se tem permissão para alterar
    if (!this.permissaoService.temPermissao(Funcionalidade.PERFIL, Permissao.ALTERAR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar perfis'
      });
      this.router.navigate(['/admin/perfis']);
      return;
    }
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;

    Promise.all([
      this.funcionalidadeService.listarFuncionalidades().toPromise(),
      this.funcionalidadeService.obterPerfil(this.perfilId).toPromise(),
      this.funcionalidadeService.obterPermissoesPerfil(this.perfilId).toPromise()
    ]).then(([funcionalidades, perfil, permissoes]) => {
      this.funcionalidades = funcionalidades || [];
      this.perfil = perfil || null;
      this.permissoesConfiguradas = permissoes || {};
      this.carregando = false;
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar dados'
      });
      this.carregando = false;
    });
  }

  isPermissaoSelecionada(funcionalidade: string, permissao: string): boolean {
    return this.permissoesConfiguradas[funcionalidade]?.includes(permissao) || false;
  }

  togglePermissao(funcionalidade: string, permissao: string): void {
    if (!this.permissoesConfiguradas[funcionalidade]) {
      this.permissoesConfiguradas[funcionalidade] = [];
    }

    const index = this.permissoesConfiguradas[funcionalidade].indexOf(permissao);
    if (index > -1) {
      this.permissoesConfiguradas[funcionalidade].splice(index, 1);
    } else {
      this.permissoesConfiguradas[funcionalidade].push(permissao);
    }
  }

  salvarPermissoes(funcionalidade: string): void {
    const config: ConfiguracaoPermissaoDTO = {
      perfilId: this.perfilId,
      funcionalidade: funcionalidade,
      permissoes: this.permissoesConfiguradas[funcionalidade] || []
    };

    this.salvando = true;
    this.funcionalidadeService.configurarPermissoes(this.perfilId, config)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Permissões atualizadas com sucesso'
          });
          this.salvando = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar permissões'
          });
          this.salvando = false;
        }
      });
  }

  removerFuncionalidade(funcionalidade: string): void {
    this.funcionalidadeService.removerFuncionalidade(this.perfilId, funcionalidade)
      .subscribe({
        next: () => {
          delete this.permissoesConfiguradas[funcionalidade];
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Funcionalidade removida do perfil'
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao remover funcionalidade'
          });
        }
      });
  }

  voltar(): void {
    this.router.navigate(['/admin/perfis']);
  }

  limparPermissoes(funcionalidade: string): void {
    this.permissoesConfiguradas[funcionalidade] = [];
  }

  selecionarTodas(funcionalidade: string, permissoes: string[]): void {
    this.permissoesConfiguradas[funcionalidade] = [...permissoes];
  }

  getNumeroPermissoes(funcionalidade: string): number {
    return this.permissoesConfiguradas[funcionalidade]?.length || 0;
  }
}
