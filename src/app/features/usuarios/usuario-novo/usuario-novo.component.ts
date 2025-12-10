import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { UsuarioEntradaDTO } from '../../../core/models/usuario.model';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-usuario-novo',
  templateUrl: './usuario-novo.component.html',
  styleUrls: ['./usuario-novo.component.scss']
})
export class UsuarioNovoComponent implements OnInit {
  // Dados do formulário
  nome: string = '';
  email: string = '';
  ativo: boolean = true;
  perfilSelecionado: PerfilDTO | null = null;

  // Controle de validação
  tentouSalvar: boolean = false;

  // Perfis disponíveis
  perfis: PerfilDTO[] = [];
  perfisFiltrados: PerfilDTO[] = [];

  carregando = false;
  salvando = false;
  senhaGerada: string | null = null;
  mostrarModalSenha = false;

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Verifica se tem permissão para incluir
    if (!this.permissaoService.temPermissao(Funcionalidade.USUARIO, Permissao.INCLUIR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para incluir usuários'
      });
      this.router.navigate(['/admin/usuarios']);
      return;
    }
    this.configurarBreadcrumb();
    this.carregarPerfis();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Usuários', url: '/admin/usuarios' },
      { label: 'Novo Usuário' }
    ];
  }

  carregarPerfis(): void {
    this.carregando = true;
    this.funcionalidadeService.listarPerfis(0, 200)
      .subscribe({
        next: (page) => {
          this.perfis = page.content.filter(p => p.ativo);
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

  filtrarPerfis(event: any): void {
    const query = event.query.toLowerCase();
    this.perfisFiltrados = this.perfis.filter(perfil => 
      perfil.nome.toLowerCase().includes(query) || 
      (perfil.descricao && perfil.descricao.toLowerCase().includes(query))
    );
  }

  criarUsuario(): void {
    // Marcar que tentou salvar
    this.tentouSalvar = true;

    // Validações
    const erros: string[] = [];
    let primeiroCampoInvalido: string | null = null;

    if (!this.nome || this.nome.trim().length === 0) {
      erros.push('Nome do usuário é obrigatório');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'nome';
    }

    if (!this.email || this.email.trim().length === 0) {
      erros.push('E-mail é obrigatório');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'email';
    } else if (!this.validarEmail(this.email)) {
      erros.push('E-mail inválido');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'email';
    }

    if (!this.perfilSelecionado) {
      erros.push('Selecione um perfil');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'perfil';
    }

    // Se houver erros, mostrar e focar no primeiro campo
    if (erros.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: erros.join('. ')
      });

      if (primeiroCampoInvalido) {
        setTimeout(() => {
          const elemento = document.getElementById(primeiroCampoInvalido!);
          if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (elemento instanceof HTMLInputElement || elemento instanceof HTMLTextAreaElement) {
              elemento.focus();
            }
          }
        }, 100);
      }
      return;
    }

    // Mostrar confirmação antes de criar
    this.confirmationService.confirmSave().subscribe((confirmed) => {
      if (confirmed) {
        this.executarCriacao();
      }
    });
  }

  private executarCriacao(): void {
    const novoUsuario: UsuarioEntradaDTO = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      ativo: this.ativo,
      perfilIds: [this.perfilSelecionado!.id] // Front garante envio de apenas 1 perfil
    };

    this.salvando = true;
    this.usuarioService.criarUsuario(novoUsuario)
      .subscribe({
        next: (usuario) => {
          this.salvando = false;

          // Se o backend retornou senha gerada, mostrar modal
          if (usuario.senhaGerada) {
            this.senhaGerada = usuario.senhaGerada;
            this.mostrarModalSenha = true;
          } else {
            // Caso contrário, apenas exibir mensagem de sucesso e redirecionar
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: `Usuário "${usuario.nome}" criado com sucesso. Senha enviada por e-mail.`
            });
            this.router.navigate(['/admin/usuarios']);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao criar usuário'
          });
          this.salvando = false;
        }
      });
  }

  fecharModalSenha(): void {
    this.mostrarModalSenha = false;
    this.senhaGerada = null;
    this.router.navigate(['/admin/usuarios']);
  }

  copiarSenha(): void {
    if (this.senhaGerada) {
      navigator.clipboard.writeText(this.senhaGerada).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copiado',
          detail: 'Senha copiada para a área de transferência'
        });
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  limparTela(): void {
    this.nome = '';
    this.email = '';
    this.ativo = true;
    this.perfilSelecionado = null;
    this.tentouSalvar = false;
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
