import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { FuncionalidadeDTO, PerfilDTO, ConfiguracaoPermissaoDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';

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
  private perfilInicial: PerfilDTO | null = null;
  private permissoesIniciais: Record<string, string[]> = {};
  carregando = false;
  salvando = false;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];

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
    this.configurarBreadcrumb();
    this.configurarHeader();
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
      this.perfilInicial = this.perfil ? JSON.parse(JSON.stringify(this.perfil)) : null;
      this.permissoesIniciais = this.clonarPermissoes(this.permissoesConfiguradas);
      this.configurarBreadcrumb();
      this.configurarHeader();
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

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Perfis', url: '/admin/perfis' },
      { label: this.perfil?.nome || 'Configuração' }
    ];
  }

  private configurarHeader(): void {
    const title = this.perfil?.nome || 'Configuração de Perfil';
    const subtitle = this.perfil?.descricao || 'Defina permissões para cada funcionalidade';

    this.headerActions = [];
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

  voltar(): void {
    this.router.navigate(['/admin/perfis']);
  }

  cancelar(): void {
    this.router.navigate(['/admin/perfis']);
  }

  salvarPerfil(): void {
    if (!this.perfil) return;

    this.salvando = true;

    // Atualiza dados básicos do perfil
    const perfilAtualizado = {
      id: this.perfil.id,
      nome: this.perfil.nome,
      descricao: this.perfil.descricao,
      ativo: this.perfil.ativo
    };

    // Prepara todas as configurações de permissões
    const configuracoesPermissoes = Object.keys(this.permissoesConfiguradas).map(funcionalidade => ({
      perfilId: this.perfilId,
      funcionalidade: funcionalidade,
      permissoes: this.permissoesConfiguradas[funcionalidade] || []
    }));

    // Executa atualização do perfil e todas as permissões
    Promise.all([
      this.funcionalidadeService.atualizarPerfil(this.perfilId, perfilAtualizado).toPromise(),
      ...configuracoesPermissoes.map(config => 
        this.funcionalidadeService.configurarPermissoes(this.perfilId, config).toPromise()
      )
    ]).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Perfil e permissões atualizados com sucesso'
      });
        this.perfilInicial = this.perfil ? JSON.parse(JSON.stringify(this.perfil)) : null;
        this.permissoesIniciais = this.clonarPermissoes(this.permissoesConfiguradas);
      this.salvando = false;
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao atualizar perfil e permissões'
      });
      this.salvando = false;
    });
  }

  limparPermissoes(funcionalidade: string): void {
    this.permissoesConfiguradas[funcionalidade] = [];
  }

  selecionarTodas(funcionalidade: string, permissoes: string[]): void {
    this.permissoesConfiguradas[funcionalidade] = [...permissoes];
  }

  limparTela(): void {
    if (!this.perfilInicial) return;
    this.perfil = JSON.parse(JSON.stringify(this.perfilInicial));
    this.permissoesConfiguradas = this.clonarPermissoes(this.permissoesIniciais);
  }

  private clonarPermissoes(permissoes: Record<string, string[]>): Record<string, string[]> {
    const clone: Record<string, string[]> = {};
    Object.keys(permissoes || {}).forEach(key => {
      clone[key] = [...(permissoes[key] || [])];
    });
    return clone;
  }

  getNumeroPermissoes(funcionalidade: string): number {
    return this.permissoesConfiguradas[funcionalidade]?.length || 0;
  }
}
