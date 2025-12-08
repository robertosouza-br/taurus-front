import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

/**
 * Componente para listar perfis
 */
@Component({
  selector: 'app-perfis-lista',
  templateUrl: './perfis-lista.component.html',
  styleUrls: ['./perfis-lista.component.scss']
})
export class PerfisListaComponent implements OnInit {
  perfis: PerfilDTO[] = [];
  carregando = false;
  
  // Controle de permissões
  podeIncluir = false;
  podeAlterar = false;
  podeExcluir = false;

  constructor(
    private router: Router,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    this.verificarPermissoes();
    this.carregarPerfis();
  }

  private verificarPermissoes(): void {
    this.podeIncluir = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.INCLUIR
    );
    this.podeAlterar = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.ALTERAR
    );
    this.podeExcluir = this.permissaoService.temPermissao(
      Funcionalidade.PERFIL,
      Permissao.EXCLUIR
    );
  }

  carregarPerfis(): void {
    this.carregando = true;
    this.funcionalidadeService.listarPerfis()
      .subscribe({
        next: (perfis) => {
          this.perfis = perfis;
          this.carregando = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar perfis'
          });
          this.carregando = false;
        }
      });
  }

  novoPerfil(): void {
    if (!this.podeIncluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para incluir perfis'
      });
      return;
    }
    this.router.navigate(['/admin/perfis/novo']);
  }

  editarPerfil(perfil: PerfilDTO): void {
    if (!this.podeAlterar) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar perfis'
      });
      return;
    }
    this.router.navigate(['/admin/perfis', perfil.id, 'configuracao']);
  }

  excluirPerfil(perfil: PerfilDTO): void {
    if (!this.podeExcluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para excluir perfis'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: `Deseja realmente excluir o perfil "${perfil.nome}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.funcionalidadeService.excluirPerfil(perfil.id)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Perfil excluído com sucesso'
              });
              this.carregarPerfis();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao excluir perfil'
              });
            }
          });
      }
    });
  }

  getTotalPermissoes(perfil: PerfilDTO): number {
    if (!perfil.permissoes) return 0;
    return Object.values(perfil.permissoes)
      .reduce((acc, perms) => acc + perms.length, 0);
  }

  getTotalFuncionalidades(perfil: PerfilDTO): number {
    if (!perfil.permissoes) return 0;
    return Object.keys(perfil.permissoes).length;
  }
}
