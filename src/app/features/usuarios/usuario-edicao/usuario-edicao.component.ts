import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { UsuarioSaidaDTO, UsuarioAtualizacaoDTO } from '../../../core/models/usuario.model';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService, AuthService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-usuario-edicao',
  templateUrl: './usuario-edicao.component.html',
  styleUrls: ['./usuario-edicao.component.scss']
})
export class UsuarioEdicaoComponent implements OnInit {
  usuarioId: number;
  usuario: UsuarioSaidaDTO | null = null;
  nome: string = '';
  email: string = '';
  ativo: boolean = true;
  perfilSelecionado: PerfilDTO | null = null;

  perfis: PerfilDTO[] = [];
  perfisFiltrados: PerfilDTO[] = [];
  carregando = false;
  salvando = false;
  tentouSalvar = false;
  editandoProprioUsuario = false;
  resetarSenha: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {
    this.usuarioId = +this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.USUARIO, Permissao.ALTERAR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar usuários'
      });
      this.router.navigate(['/admin/usuarios']);
      return;
    }
    this.configurarBreadcrumb();
    this.carregarDados();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Usuários', url: '/admin/usuarios' },
      { label: 'Editar Usuário' }
    ];
  }

  carregarDados(): void {
    this.carregando = true;

    // Verificar se está editando o próprio usuário
    const usuarioLogado = this.authService.getUsuarioLogado();

    Promise.all([
      this.usuarioService.obterUsuario(this.usuarioId).toPromise(),
      this.funcionalidadeService.listarPerfis(0, 200).toPromise()
    ]).then(([usuario, perfisPage]) => {
      this.usuario = usuario || null;
      this.perfis = perfisPage?.content.filter(p => p.ativo) || [];

      if (this.usuario) {
        this.nome = this.usuario.nome;
        this.email = this.usuario.email;
        this.ativo = this.usuario.ativo;
        this.perfilSelecionado = this.usuario.perfis && this.usuario.perfis.length > 0
          ? this.usuario.perfis[0]
          : null;
        
        // Verificar se o e-mail do usuário logado é o mesmo do usuário sendo editado
        this.editandoProprioUsuario = usuarioLogado?.email === this.usuario.email;
      }

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

  filtrarPerfis(event: any): void {
    const query = event.query.toLowerCase();
    this.perfisFiltrados = this.perfis.filter(perfil => 
      perfil.nome.toLowerCase().includes(query) || 
      (perfil.descricao && perfil.descricao.toLowerCase().includes(query))
    );
  }

  mostrarTodosPerfis(): void {
    this.perfisFiltrados = this.perfis;
  }

  salvarUsuario(): void {
    this.tentouSalvar = true;

    const erros: string[] = [];
    let primeiroCampoInvalido: string | null = null;

    if (!this.nome || this.nome.trim().length === 0) {
      erros.push('Nome é obrigatório');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'nome';
    }

    if (!this.email || this.email.trim().length === 0) {
      erros.push('E-mail é obrigatório');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'email';
    }

    if (!this.perfilSelecionado) {
      erros.push('Selecione um perfil');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'perfil';
    }

    if (erros.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: erros.join('. ')
      });
      return;
    }

    this.confirmationService.confirmSave('Deseja salvar as alterações?')
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.executarAtualizacao();
      });
  }

  private executarAtualizacao(): void {
    const dadosAtualizados: UsuarioAtualizacaoDTO = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      ativo: this.ativo,
      perfisIds: [this.perfilSelecionado!.id],
      resetarSenha: this.resetarSenha
    };

    this.salvando = true;

    this.usuarioService.atualizarUsuario(this.usuarioId, dadosAtualizados)
      .subscribe({
        next: () => {
          this.salvando = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: 'Usuário atualizado com sucesso.'
          });
          this.router.navigate(['/admin/usuarios']);
        },
        error: (error) => {
          this.salvando = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro ao salvar',
            detail: error.error?.message || 'Não foi possível salvar as alterações.'
          });
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  limparTela(): void {
    if (!this.usuario) return;
    this.nome = this.usuario.nome;
    this.email = this.usuario.email;
    this.ativo = this.usuario.ativo;
    this.perfilSelecionado = this.usuario.perfis && this.usuario.perfis.length > 0
      ? this.usuario.perfis[0]
      : null;
    this.tentouSalvar = false;
  }
}
