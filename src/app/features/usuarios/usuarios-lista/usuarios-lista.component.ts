import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService, Page } from '../../../core/services/usuario.service';
import { UsuarioSaidaDTO } from '../../../core/models/usuario.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { HeaderAction } from '../../../shared/components/page-header/page-header.component';
import { TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-usuarios-lista',
  templateUrl: './usuarios-lista.component.html',
  styleUrls: ['./usuarios-lista.component.scss']
})
export class UsuariosListaComponent implements OnInit {
  usuarios: UsuarioSaidaDTO[] = [];
  totalRecords = 0;
  carregando = false;

  breadcrumbItems: BreadcrumbItem[] = [];
  headerActions: HeaderAction[] = [];
  colunas: TableColumn[] = [];
  acoes: TableAction[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.configurarHeader();
    this.configurarTabela();
    this.carregarUsuarios();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Usuários' }
    ];
  }

  private configurarHeader(): void {
    this.headerActions = [];

    if (this.permissaoService.temPermissao(Funcionalidade.USUARIO, Permissao.INCLUIR)) {
      this.headerActions.push({
        label: 'Novo Usuário',
        icon: 'pi pi-plus',
        severity: 'success',
        command: () => this.novoUsuario()
      });
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nome', header: 'Nome', sortable: true },
      { field: 'email', header: 'E-mail', sortable: true },
      { field: 'perfil', header: 'Perfil', sortable: true },
      { field: 'ativo', header: 'Status', sortable: true, template: 'status' }
    ];

    this.acoes = [];

    if (this.permissaoService.temPermissao(Funcionalidade.USUARIO, Permissao.ALTERAR)) {
      this.acoes.push({
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        severity: 'info',
        command: (rowData: any) => this.editarUsuario(rowData.id)
      });
    }

    if (this.permissaoService.temPermissao(Funcionalidade.USUARIO, Permissao.EXCLUIR)) {
      this.acoes.push({
        icon: 'pi pi-trash',
        tooltip: 'Excluir',
        severity: 'danger',
        command: (rowData: any) => this.excluirUsuario(rowData)
      });
    }
  }

  onBuscar(termo: any): void {
    this.carregarUsuarios(termo as string);
  }

  carregarUsuarios(search: string = ''): void {
    this.carregando = true;
    this.usuarioService.listarUsuarios(0, 1000, search).subscribe({
      next: (page: Page<UsuarioSaidaDTO>) => {
        this.usuarios = page.content.map(usuario => ({
          ...usuario,
          perfil: usuario.perfis && usuario.perfis.length > 0 ? usuario.perfis[0].nome : 'Sem perfil'
        }));
        this.totalRecords = page.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar usuários'
        });
        this.carregando = false;
      }
    });
  }

  novoUsuario(): void {
    this.router.navigate(['/admin/usuarios/novo']);
  }

  editarUsuario(id: number): void {
    this.router.navigate(['/admin/usuarios/editar', id]);
  }

  excluirUsuario(usuario: UsuarioSaidaDTO): void {
    this.confirmationService.confirmDelete(usuario.nome)
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.usuarioService.removerUsuario(usuario.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: `Usuário "${usuario.nome}" excluído com sucesso.`
            });
            this.carregarUsuarios();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao excluir',
              detail: error.error?.message || 'Não foi possível excluir o usuário.'
            });
          }
        });
      });
  }
}
