import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MeusDadosService } from '../../../core/services/meus-dados.service';
import { MeusDadosDTO, AtualizarMeusDadosDTO, TrocarSenhaDTO } from '../../../core/models/meus-dados.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { FotoResponse } from '../../../shared/components/upload-foto/upload-foto.component';

@Component({
  selector: 'app-meus-dados',
  templateUrl: './meus-dados.component.html',
  styleUrls: ['./meus-dados.component.scss']
})
export class MeusDadosComponent implements OnInit {
  meusDados?: MeusDadosDTO;
  carregando = false;
  salvando = false;
  tentouSalvar = false;

  // Formulário de dados pessoais
  dadosForm: AtualizarMeusDadosDTO = {
    nome: '',
    email: '',
    telefone: '',
    apelido: ''
  };

  // Formulário de troca de senha
  senhaForm: TrocarSenhaDTO = {
    senhaAtual: '',
    novaSenha: '',
    confirmacaoNovaSenha: ''
  };
  exibirModalSenha = false;
  trocandoSenha = false;

  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private meusDadosService: MeusDadosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.carregarDados();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Meu Perfil', icon: 'pi pi-user' },
      { label: 'Meus Dados' }
    ];
  }

  carregarDados(): void {
    this.carregando = true;
    this.meusDadosService.buscarMeusDados().subscribe({
      next: (dados: MeusDadosDTO) => {
        this.meusDados = dados;
        this.preencherFormulario(dados);
        this.carregando = false;
      },
      error: (erro: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar seus dados'
        });
        this.carregando = false;
      }
    });
  }

  private preencherFormulario(dados: MeusDadosDTO): void {
    this.dadosForm = {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone || '',
      apelido: dados.apelido || ''
    };
  }

  salvarDados(): void {
    this.tentouSalvar = true;
    
    if (!this.validarFormulario()) {
      return;
    }

    this.salvando = true;
    this.meusDadosService.atualizarMeusDados(this.dadosForm).subscribe({
      next: (dados: MeusDadosDTO) => {
        this.meusDados = dados;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Seus dados foram atualizados com sucesso'
        });
        this.salvando = false;
      },
      error: (erro: any) => {
        const mensagem = erro.error?.message || 'Não foi possível atualizar seus dados';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
        this.salvando = false;
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.dadosForm.nome || this.dadosForm.nome.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O nome é obrigatório'
      });
      return false;
    }

    if (!this.dadosForm.email || this.dadosForm.email.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'O email é obrigatório'
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.dadosForm.email)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Email inválido'
      });
      return false;
    }

    return true;
  }

  cancelar(): void {
    if (this.meusDados) {
      this.preencherFormulario(this.meusDados);
      this.tentouSalvar = false;
      this.messageService.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'As alterações foram descartadas'
      });
    }
  }

  abrirModalSenha(): void {
    this.senhaForm = {
      senhaAtual: '',
      novaSenha: '',
      confirmacaoNovaSenha: ''
    };
    this.exibirModalSenha = true;
  }

  fecharModalSenha(): void {
    this.exibirModalSenha = false;
    this.senhaForm = {
      senhaAtual: '',
      novaSenha: '',
      confirmacaoNovaSenha: ''
    };
  }

  /**
   * Verifica se o formulário foi alterado comparando com valores originais
   */
  get formularioAlterado(): boolean {
    if (!this.meusDados) return false;
    
    return this.dadosForm.nome !== this.meusDados.nome ||
           this.dadosForm.email !== this.meusDados.email ||
           this.dadosForm.telefone !== (this.meusDados.telefone || '') ||
           this.dadosForm.apelido !== (this.meusDados.apelido || '');
  }

  trocarSenha(): void {
    if (!this.validarSenha()) {
      return;
    }

    this.trocandoSenha = true;
    this.meusDadosService.trocarSenha(this.senhaForm).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Senha alterada com sucesso'
        });
        this.fecharModalSenha();
        this.trocandoSenha = false;
      },
      error: (erro: any) => {
        const mensagem = erro.error?.message || 'Não foi possível alterar a senha';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
        this.trocandoSenha = false;
      }
    });
  }

  private validarSenha(): boolean {
    if (!this.senhaForm.senhaAtual || this.senhaForm.senhaAtual.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha atual é obrigatória'
      });
      return false;
    }

    if (!this.senhaForm.novaSenha || this.senhaForm.novaSenha.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A nova senha é obrigatória'
      });
      return false;
    }

    if (!this.senhaForm.confirmacaoNovaSenha || this.senhaForm.confirmacaoNovaSenha.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A confirmação da nova senha é obrigatória'
      });
      return false;
    }

    if (this.senhaForm.novaSenha !== this.senhaForm.confirmacaoNovaSenha) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A nova senha e a confirmação não coincidem'
      });
      return false;
    }

    // Validação de complexidade da senha
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!regexSenha.test(this.senhaForm.novaSenha)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'A senha deve conter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial (@$!%*?&#)'
      });
      return false;
    }

    return true;
  }

  formatarCPF(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatarTelefone(telefone?: string | null): string {
    if (!telefone) return 'Não informado';
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  formatarData(data?: string | null): string {
    if (!data) return 'Ilimitado';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  // ===== Métodos para Upload de Foto =====

  uploadFotoCallback = (arquivo: File): Promise<any> => {
    return this.meusDadosService.uploadFoto(arquivo).toPromise();
  };

  obterUrlCallback = async (): Promise<FotoResponse> => {
    const result = await this.meusDadosService.obterFotoUrl().toPromise();
    return result as FotoResponse;
  };

  removerCallback = (): Promise<any> => {
    return this.meusDadosService.removerFoto().toPromise();
  };

  onFotoAlterada(): void {
    // Callback quando foto é alterada ou removida
    console.log('Foto do perfil foi alterada');
  }
}
