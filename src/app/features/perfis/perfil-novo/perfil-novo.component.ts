import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { FuncionalidadeDTO, PerfilEntradaDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';

/**
 * Componente para criar novo perfil
 */
@Component({
  selector: 'app-perfil-novo',
  templateUrl: './perfil-novo.component.html',
  styleUrls: ['./perfil-novo.component.scss']
})
export class PerfilNovoComponent implements OnInit {
  // Dados do formulário
  nome: string = '';
  descricao: string = '';
  ativo: boolean = true;

  // Funcionalidades e permissões
  funcionalidades: FuncionalidadeDTO[] = [];
  permissoesSelecionadas: Record<string, Set<string>> = {};
  
  carregando = false;
  salvando = false;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];

  constructor(
    private router: Router,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    // Verifica se tem permissão para incluir
    if (!this.permissaoService.temPermissao(Funcionalidade.PERFIL, Permissao.INCLUIR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para incluir perfis'
      });
      this.router.navigate(['/admin/perfis']);
      return;
    }
    this.configurarBreadcrumb();
    this.configurarHeader();
    this.carregarFuncionalidades();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Perfis', url: '/admin/perfis' },
      { label: 'Novo Perfil' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [
      {
        label: 'Voltar',
        icon: 'pi pi-arrow-left',
        severity: 'secondary',
        action: () => this.cancelar(),
        visible: true
      },
      {
        label: 'Criar Perfil',
        icon: 'pi pi-save',
        severity: 'success',
        action: () => this.criarPerfil(),
        visible: true
      }
    ];
  }

  carregarFuncionalidades(): void {
    this.carregando = true;
    this.funcionalidadeService.listarFuncionalidades()
      .subscribe({
        next: (funcionalidades) => {
          this.funcionalidades = funcionalidades;
          // Inicializar Sets vazios para cada funcionalidade
          funcionalidades.forEach(f => {
            this.permissoesSelecionadas[f.codigo] = new Set<string>();
          });
          this.carregando = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar funcionalidades'
          });
          this.carregando = false;
        }
      });
  }

  isPermissaoSelecionada(funcionalidade: string, permissao: string): boolean {
    return this.permissoesSelecionadas[funcionalidade]?.has(permissao) || false;
  }

  togglePermissao(funcionalidade: string, permissao: string): void {
    const set = this.permissoesSelecionadas[funcionalidade];
    if (set.has(permissao)) {
      set.delete(permissao);
    } else {
      set.add(permissao);
    }
  }

  criarPerfil(): void {
    // Validações
    if (!this.nome || this.nome.trim().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nome do perfil é obrigatório'
      });
      return;
    }

    // Converter Sets para Arrays
    const permissoes: Record<string, string[]> = {};
    Object.keys(this.permissoesSelecionadas).forEach(func => {
      const perms = Array.from(this.permissoesSelecionadas[func]);
      if (perms.length > 0) {
        permissoes[func] = perms;
      }
    });

    // Validar se há pelo menos uma permissão
    if (Object.keys(permissoes).length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Selecione pelo menos uma permissão'
      });
      return;
    }

    // Criar perfil
    const novoPerfil: PerfilEntradaDTO = {
      nome: this.nome.trim(),
      descricao: this.descricao?.trim(),
      ativo: this.ativo,
      permissoes: permissoes
    };

    this.salvando = true;
    this.funcionalidadeService.criarPerfil(novoPerfil)
      .subscribe({
        next: (perfil) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Perfil "${perfil.nome}" criado com sucesso`
          });
          this.salvando = false;
          // Redirecionar para configuração do perfil
          this.router.navigate(['/admin/perfis', perfil.id, 'configuracao']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao criar perfil'
          });
          this.salvando = false;
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/admin/perfis']);
  }

  limparPermissoes(funcionalidade: string): void {
    this.permissoesSelecionadas[funcionalidade].clear();
  }

  selecionarTodas(funcionalidade: string, permissoes: string[]): void {
    permissoes.forEach(p => {
      this.permissoesSelecionadas[funcionalidade].add(p);
    });
  }

  getNumeroPermissoes(funcionalidade: string): number {
    return this.permissoesSelecionadas[funcionalidade]?.size || 0;
  }
}
