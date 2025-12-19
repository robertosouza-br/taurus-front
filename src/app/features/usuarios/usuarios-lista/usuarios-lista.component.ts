import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UsuarioSaidaDTO } from '../../../core/models/usuario.model';
import { Page } from '../../../core/models/page.model';
import { PermissaoService, AuthService } from '../../../core/services';
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
    private confirmationService: ConfirmationService,
    private authService: AuthService
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
        severity: 'primary',
        command: () => this.novoUsuario()
      });
    }
  }

  private configurarTabela(): void {
    this.colunas = [
      { field: 'nome', header: 'Nome', sortable: true },
      { field: 'email', header: 'E-mail', sortable: true, align: 'center' },
      { field: 'cpf', header: 'CPF', sortable: true, template: 'cpf', align: 'center' },
      { field: 'dataExpiracao', header: 'Expiração', sortable: true, template: 'expiracao', align: 'center' },
      { field: 'perfil', header: 'Perfil', sortable: true, align: 'center' },
      { field: 'ativo', header: 'Status', sortable: true, template: 'status', align: 'center' }
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
    console.log('Iniciando carregamento de usuários...');
    this.usuarioService.listarUsuarios(0, 50, search).subscribe({
      next: (page: Page<UsuarioSaidaDTO>) => {
        console.log('Usuários carregados com sucesso:', page);
        this.usuarios = page.content.map((usuario: UsuarioSaidaDTO) => ({
          ...usuario,
          perfil: usuario.perfis && usuario.perfis.length > 0 ? usuario.perfis[0].nome : 'Sem perfil'
        }));
        this.totalRecords = page.totalElements;
        this.carregando = false;
      },
      error: (error) => {
        console.log('========== ERRO NO CARREGAMENTO ==========');
        console.log('Erro capturado no componente:', error);
        console.log('Status do erro:', error.status);
        console.log('Detalhes do erro:', error.error);
        console.log('==========================================');
        
        // Exibe mensagem específica para erro 403 e redireciona
        if (error.status === 403) {
          const mensagem = error.error?.detail || error.error?.message || 'Você não tem permissão para consultar usuários';
          console.log('Mensagem 403:', mensagem);
          this.messageService.add({
            severity: 'error',
            summary: 'Acesso Negado',
            detail: mensagem,
            life: 5000
          });
          
          // Redireciona para tela de acesso negado após mostrar o toast
          setTimeout(() => {
            this.router.navigate(['/acesso-negado']);
          }, 1500);
        } else {
          const mensagem = error.error?.message || error.error?.detail || 'Erro ao carregar usuários';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagem
          });
        }
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
    // Verificar se está tentando excluir o próprio usuário
    const usuarioLogado = this.authService.getUsuarioLogado();
    if (usuarioLogado?.email === usuario.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ação não permitida',
        detail: 'Você não pode excluir sua própria conta.'
      });
      return;
    }

    this.confirmationService.confirmDelete(usuario.nome)
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.usuarioService.removerUsuario(usuario.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: `Usuário "${usuario.nome}" excluído com sucesso.`,
              life: 3000
            });
            this.carregarUsuarios();
          },
          error: (error) => {
            // Erro 409 já tratado pelo interceptor
            if (error.status === 409) {
              return;
            }
            
            this.messageService.add({
              severity: 'error',
              summary: 'Erro ao excluir',
              detail: error.error?.message || 'Não foi possível excluir o usuário.',
              life: 5000
            });
          }
        });
      });
  }

  /**
   * Formata CPF para exibição (000.000.000-00)
   */
  formatarCPF(cpf: string): string {
    if (!cpf || cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
