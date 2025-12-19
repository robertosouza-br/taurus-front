import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { UsuarioEntradaDTO } from '../../../core/models/usuario.model';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService, AuthService, AuthorizationService } from '../../../core/services';
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
  cpf: string = '';
  telefone: string = '';
  apelido: string = '';
  dataExpiracao: Date | null = null;
  ativo: boolean = true;
  perfilSelecionado: PerfilDTO | null = null;

  // Controle de validação
  tentouSalvar: boolean = false;

  // Perfis disponíveis
  perfis: PerfilDTO[] = [];
  perfisFiltrados: PerfilDTO[] = [];

  carregando = false;
  salvando = false;
  usuarioLogadoEhAdministrador = false;
  senhaGerada: string | null = null;
  mostrarModalSenha = false;

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private funcionalidadeService: FuncionalidadeService,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private authorizationService: AuthorizationService
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
    
    // Verificar se o usuário logado tem perfil de ADMINISTRADOR
    this.usuarioLogadoEhAdministrador = this.authorizationService.isAdministrador();
    
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
          
          // Se não for administrador, definir perfil CORRETOR automaticamente
          if (!this.usuarioLogadoEhAdministrador) {
            const perfilCorretor = this.perfis.find(p => p.nome === 'CORRETOR');
            if (perfilCorretor) {
              this.perfilSelecionado = perfilCorretor;
            }
          }
          
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

  mostrarTodosPerfis(): void {
    this.perfisFiltrados = this.perfis;
  }

  salvarUsuario(): void {
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

    if (!this.cpf || this.cpf.trim().length === 0) {
      erros.push('CPF é obrigatório');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'cpf';
    } else if (!this.validarCPF(this.cpf)) {
      erros.push('CPF inválido');
      if (!primeiroCampoInvalido) primeiroCampoInvalido = 'cpf';
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
      cpf: this.cpf.replace(/\D/g, ''), // Remove formatação
      telefone: this.telefone.trim() || null,
      apelido: this.apelido.trim() || null,
      dataExpiracao: this.dataExpiracao ? this.formatarDataParaAPI(this.dataExpiracao) : null,
      ativo: this.ativo,
      perfisIds: [this.perfilSelecionado!.id]
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
          this.salvando = false;
          
          // Tratamento específico para CPF duplicado
          if (error.status === 500 && error.error?.message === 'CPF ja cadastrado') {
            this.messageService.add({
              severity: 'error',
              summary: 'CPF Duplicado',
              detail: 'Este CPF já está cadastrado no sistema.'
            });
            // Focar no campo CPF
            setTimeout(() => {
              const cpfElement = document.getElementById('cpf');
              if (cpfElement) {
                cpfElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cpfElement.focus();
              }
            }, 100);
            return;
          }
          
          // Tratamento específico para Email duplicado
          if (error.status === 500 && error.error?.message === 'Email ja cadastrado') {
            this.messageService.add({
              severity: 'error',
              summary: 'Email Duplicado',
              detail: 'Este email já está cadastrado no sistema.'
            });
            // Focar no campo email
            setTimeout(() => {
              const emailElement = document.getElementById('email');
              if (emailElement) {
                emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                emailElement.focus();
              }
            }, 100);
            return;
          }
          
          // Erro genérico
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao criar usuário'
          });
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
    this.cpf = '';
    this.telefone = '';
    this.apelido = '';
    this.dataExpiracao = null;
    this.ativo = true;
    this.perfilSelecionado = null;
    this.tentouSalvar = false;
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private validarCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  private formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  formatarCPF(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }
    
    this.cpf = valor;
  }
}
