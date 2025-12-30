import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FuncionalidadeService } from '../../../core/services/funcionalidade.service';
import { UsuarioSaidaDTO, UsuarioAtualizacaoDTO } from '../../../core/models/usuario.model';
import { PerfilDTO } from '../../../core/models/funcionalidade.model';
import { PermissaoService, AuthService, AuthorizationService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { BaseFormComponent } from '../../../shared/base/base-form.component';

@Component({
  selector: 'app-usuario-edicao',
  templateUrl: './usuario-edicao.component.html',
  styleUrls: ['./usuario-edicao.component.scss']
})
export class UsuarioEdicaoComponent extends BaseFormComponent implements OnInit {
  usuarioId: number;
  usuario: UsuarioSaidaDTO | null = null;
  nome: string = '';
  email: string = '';
  cpf: string = '';
  telefone: string = '';
  apelido: string = '';
  dataExpiracao: Date | null = null;
  ativo: boolean = true;
  perfilSelecionado: PerfilDTO | null = null;

  perfis: PerfilDTO[] = [];
  perfisFiltrados: PerfilDTO[] = [];
  carregando = false;
  override salvando = false;
  override tentouSalvar = false;
  editandoProprioUsuario = false;
  usuarioLogadoEhAdministrador = false;
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
    private authService: AuthService,
    private authorizationService: AuthorizationService
  ) {
    super();
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
    
    // Verificar se o usuário logado tem perfil de ADMINISTRADOR
    this.usuarioLogadoEhAdministrador = this.authorizationService.isAdministrador();

    Promise.all([
      this.usuarioService.obterUsuario(this.usuarioId).toPromise(),
      this.funcionalidadeService.listarPerfis(0, 200).toPromise()
    ]).then(([usuario, perfisPage]) => {
      this.usuario = usuario || null;
      this.perfis = perfisPage?.content.filter(p => p.ativo) || [];

      if (this.usuario) {
        this.nome = this.usuario.nome;
        this.email = this.usuario.email;
        this.cpf = this.usuario.cpf;
        this.telefone = this.usuario.telefone || '';
        this.apelido = this.usuario.apelido || '';
        this.dataExpiracao = this.usuario.dataExpiracao ? this.parseDataAPI(this.usuario.dataExpiracao) : null;
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

  /**
   * Verifica se o campo perfil deve estar desabilitado
   */
  get perfilDesabilitado(): boolean {
    return this.editandoProprioUsuario || !this.usuarioLogadoEhAdministrador;
  }

  salvarUsuario(): void {
    // Validar formulário usando BaseFormComponent
    if (!this.validarFormulario()) {
      return;
    }

    // A confirmação é feita automaticamente pelo botão com actionType="save"
    this.executarAtualizacao();
  }

  private executarAtualizacao(): void {
    const cpfImutavel = (this.usuario?.cpf || this.cpf || '').replace(/\D/g, '');

    const dadosAtualizados: UsuarioAtualizacaoDTO = {
      nome: this.nome.trim(),
      email: this.email.trim(),
      cpf: cpfImutavel,
      telefone: this.telefone.trim() || null,
      apelido: this.apelido.trim() || null,
      dataExpiracao: this.dataExpiracao ? this.formatarDataParaAPI(this.dataExpiracao) : null,
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
    this.cpf = this.usuario.cpf;
    this.telefone = this.usuario.telefone || '';
    this.apelido = this.usuario.apelido || '';
    this.dataExpiracao = this.usuario.dataExpiracao ? this.parseDataAPI(this.usuario.dataExpiracao) : null;
    this.ativo = this.usuario.ativo;
    this.perfilSelecionado = this.usuario.perfis && this.usuario.perfis.length > 0
      ? this.usuario.perfis[0]
      : null;
    this.resetarSenha = false;
    this.tentouSalvar = false;
  }

  private validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
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

  private validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  private formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private parseDataAPI(dataStr: string): Date {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
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

  /**
   * Verifica se o formulário foi alterado comparando com valores originais
   */
  get formularioAlterado(): boolean {
    if (!this.usuario) return false;
    
    return this.nome !== this.usuario.nome ||
           this.email !== this.usuario.email ||
           this.cpf !== this.usuario.cpf ||
           this.telefone !== (this.usuario.telefone || '') ||
           this.apelido !== (this.usuario.apelido || '') ||
           this.dataExpiracao?.toDateString() !== (this.usuario.dataExpiracao ? this.parseDataAPI(this.usuario.dataExpiracao).toDateString() : null) ||
           this.ativo !== this.usuario.ativo ||
           this.perfilSelecionado?.id !== (this.usuario.perfis && this.usuario.perfis.length > 0 ? this.usuario.perfis[0].id : null) ||
           this.resetarSenha;
  }

  // Implementação do método abstrato
  protected override getCamposObrigatorios() {
    return [
      { id: 'nome', valor: this.nome, label: 'Nome' },
      { id: 'email', valor: this.email, label: 'E-mail', validacao: () => this.validarEmail(this.email) },
      { id: 'cpf', valor: this.cpf, label: 'CPF', validacao: () => this.validarCPF(this.cpf) },
      { id: 'perfil', valor: this.perfilSelecionado, label: 'Perfil' }
    ];
  }

  protected override exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios'
    });
  }
}
