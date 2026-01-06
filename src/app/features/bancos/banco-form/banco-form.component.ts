import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BancoService } from '../../../core/services/banco.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { MessageService } from 'primeng/api';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

/**
 * Componente de formulário de banco (criação/edição)
 * 
 * Funcionalidade: BANCO
 * Permissões: INCLUIR (criação) ou ALTERAR (edição)
 */
@Component({
  selector: 'app-banco-form',
  templateUrl: './banco-form.component.html',
  styleUrls: ['./banco-form.component.scss']
})
export class BancoFormComponent implements OnInit {
  carregando = false;
  salvando = false;
  tentouSalvar = false;
  modoEdicao = false;
  bancoId?: number;

  // Campos do formulário
  codigo = '';
  nome = '';

  // Valores originais para detectar alterações
  private codigoOriginal = '';
  private nomeOriginal = '';

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private bancoService: BancoService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.bancoId = this.route.snapshot.params['id'];
    this.modoEdicao = !!this.bancoId;

    const permissaoRequerida = this.modoEdicao ? Permissao.ALTERAR : Permissao.INCLUIR;
    if (!this.temPermissao(permissaoRequerida)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    this.scrollToTop();
    this.configurarBreadcrumb();

    if (this.modoEdicao && this.bancoId) {
      this.carregarBanco(this.bancoId);
    }
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Administração', icon: 'pi pi-cog' },
      { label: 'Bancos', url: '/bancos' },
      { label: this.modoEdicao ? 'Editar' : 'Novo' }
    ];
  }

  private carregarBanco(id: number): void {
    this.carregando = true;
    this.bancoService.buscarPorId(id).subscribe({
      next: (banco) => {
        this.codigo = banco.codigo;
        this.nome = banco.nome;
        // Salvar valores originais
        this.codigoOriginal = banco.codigo;
        this.nomeOriginal = banco.nome;
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao carregar banco'
        });
        this.cancelar();
      }
    });
  }

  salvar(): void {
    this.tentouSalvar = true;

    if (!this.formularioValido()) {
      let mensagemErro = 'Preencha todos os campos obrigatórios corretamente:';
      const erros: string[] = [];
      
      if (!this.codigoValido()) {
        erros.push('Código deve ter exatamente 3 dígitos numéricos (ex: 001, 237, 341)');
      }
      if (!this.nomeValido()) {
        erros.push('Nome deve ter entre 3 e 100 caracteres');
      }
      
      if (erros.length > 0) {
        mensagemErro += '\n• ' + erros.join('\n• ');
      }
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: mensagemErro,
        life: 6000
      });
      return;
    }

    this.salvando = true;
    const dados = {
      codigo: this.codigo,
      nome: this.nome
    };

    const operacao = this.modoEdicao && this.bancoId
      ? this.bancoService.atualizar(this.bancoId, dados)
      : this.bancoService.criar(dados);

    operacao.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Banco ${this.modoEdicao ? 'atualizado' : 'criado'} com sucesso`
        });
        this.router.navigate(['/bancos']);
      },
      error: (error) => {
        this.salvando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || `Erro ao ${this.modoEdicao ? 'atualizar' : 'criar'} banco`
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/bancos']);
  }

  limparTela(): void {
    if (this.modoEdicao) {
      // No modo edição, restaura valores originais
      this.codigo = this.codigoOriginal;
      this.nome = this.nomeOriginal;
    } else {
      // No modo criação, limpa os campos
      this.codigo = '';
      this.nome = '';
    }
    this.tentouSalvar = false;
  }

  get formularioAlterado(): boolean {
    if (this.modoEdicao) {
      return this.codigo !== this.codigoOriginal || this.nome !== this.nomeOriginal;
    }
    return !!(this.codigo || this.nome);
  }

  private scrollToTop(): void {
    const contentArea = document.querySelector('.content-area');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
    if (contentWrapper) {
      contentWrapper.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  private formularioValido(): boolean {
    return this.codigoValido() && this.nomeValido();
  }

  private codigoValido(): boolean {
    return !!this.codigo && /^\d{3}$/.test(this.codigo);
  }

  private nomeValido(): boolean {
    return !!this.nome && this.nome.trim().length >= 3 && this.nome.trim().length <= 100;
  }

  temPermissao(permissao: Permissao): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.BANCO, permissao);
  }

  get titulo(): string {
    return this.modoEdicao ? 'Editar Banco' : 'Novo Banco';
  }

  get subtitulo(): string {
    return this.modoEdicao 
      ? 'Atualize as informações do banco' 
      : 'Cadastre um novo banco no sistema';
  }
}
