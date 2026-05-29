import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorPublicoService } from '../../../core/services/corretor-publico.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { BancoService } from '../../../core/services/banco.service';
import {
  TipoContaBancariaProfissional,
  TIPO_CONTA_BANCARIA_PROFISSIONAL_LABELS
} from '../../../core/models/profissional.model';
import { TelefoneUtilsService } from '../../../shared/services/telefone-utils.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { Banco } from '../../../core/models/banco.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-corretor-cadastro-publico',
  templateUrl: './corretor-cadastro-publico.component.html',
  styleUrls: ['./corretor-cadastro-publico.component.scss']
})
export class CorretorCadastroPublicoComponent implements OnInit, OnDestroy {
  // Campos do formulário
  nome = '';
  cpf = '';
  email = '';
  emails: string[] = []; // Array para múltiplos emails
  nomeGuerra = '';
  telefone = '';
  numeroCreci = '';
  cargo: CorretorCargo = CorretorCargo.CORRETOR;
  cargoSelecionado: { label: string; value: CorretorCargo } | null = null;
  numeroBanco = '';
  bancoSelecionado: { label: string; value: string; banco: Banco } | null = null;
  numeroAgencia = '';
  numeroContaCorrente = '';
  digitoConta = '';
  tipoContaSelecionado: { label: string; value: TipoContaBancariaProfissional } | null = null;
  tipoChavePix: TipoChavePix = TipoChavePix.CPF;
  tipoChavePixSelecionado: { label: string; value: TipoChavePix } | null = null;
  chavePix = '';
  
  salvando = false;
  tentouSalvar = false;
  
  // Opções para autocompletes
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  cargosFiltrados: { label: string; value: CorretorCargo }[] = [];
  bancosOptions: { label: string; value: string; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: string; banco: Banco }[] = [];
  tiposContaOptions: { label: string; value: TipoContaBancariaProfissional }[] = [];
  tiposContaFiltrados: { label: string; value: TipoContaBancariaProfissional }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  
  // Controle de validação de CPF
  cpfJaCadastrado = false;
  cpfInvalido = false;
  mensagemValidacaoCpf = '';
  validandoCpf = false;
  camposHabilitados = false;
  camposDoUsuarioLocal = false; // Se os dados vieram do usuário local (campos devem ficar travados)
  existeUsuarioLocal = false; // Se corretor tem usuário no sistema interno
  
  // Mensagem do loading
  mensagemLoading = 'Salvando cadastro...';
  
  // Subject para validação reativa do CPF
  private cpfSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private corretorPublicoService: CorretorPublicoService,
    private usuarioService: UsuarioService,
    private bancoService: BancoService,
    private router: Router,
    private messageService: MessageService,
    private telefoneUtils: TelefoneUtilsService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarOpcoes();
    this.configurarValidacaoCpf();
    // Inicializar cargo selecionado como CORRETOR
    this.cargoSelecionado = {
      label: CARGO_LABELS[CorretorCargo.CORRETOR],
      value: CorretorCargo.CORRETOR
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarOpcoes(): void {
    // Cargos
    this.cargosOptions = Object.keys(CorretorCargo).map(key => ({
      label: CARGO_LABELS[key as CorretorCargo],
      value: key as CorretorCargo
    }));
    this.cargosFiltrados = [...this.cargosOptions];

    // Tipos de Chave PIX
    this.tiposChavePixOptions = Object.keys(TipoChavePix).map(key => ({
      label: TIPO_CHAVE_PIX_LABELS[key as TipoChavePix],
      value: key as TipoChavePix
    }));
    this.tiposChavePixFiltrados = [...this.tiposChavePixOptions];

    // Tipos de Conta
    this.tiposContaOptions = Object.values(TipoContaBancariaProfissional).map(tipo => ({
      label: TIPO_CONTA_BANCARIA_PROFISSIONAL_LABELS[tipo],
      value: tipo
    }));
    this.tiposContaFiltrados = [...this.tiposContaOptions];

    // Carregar bancos
    this.bancoService.listarTodos().subscribe({
      next: (bancos) => {
        this.bancosOptions = bancos.map(banco => ({
          label: `${banco.codigo} - ${banco.nome}`,
          value: banco.codigo,
          banco: banco
        }));
        this.bancosFiltrados = [...this.bancosOptions];
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Não foi possível carregar a lista de bancos'
        });
      }
    });
  }

  // CPF mudou - disparar validação reativa
  onCpfChange(): void {
    this.cpfSubject.next(this.cpf);
  }

  private configurarValidacaoCpf(): void {
    this.cpfSubject.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(cpf => {
      // Remove máscara para validação
      const cpfSemMascara = cpf.replace(/\D/g, '');
      
      if (cpfSemMascara && cpfSemMascara.length === 11) {
        // Valida o CPF antes de chamar o backend
        if (!this.validarCPF(cpfSemMascara)) {
          this.validandoCpf = false;
          this.cpfJaCadastrado = false;
          this.cpfInvalido = true;
          this.mensagemValidacaoCpf = 'CPF inválido. Verifique o número digitado.';
          return;
        }
        this.cpfInvalido = false;
        
        // Formatar CPF para enviar à API: 000.000.000-00
        const cpfFormatado = this.formatarCpf(cpfSemMascara);
        this.validarCpfNoBackend(cpfFormatado);
      } else {
        this.limparValidacaoCpf();
      }
    });
  }

  /**
   * Formata CPF no padrão 000.000.000-00
   */
  private formatarCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Remove DDI (55) do telefone se presente
   */
  private removerDDI(telefone: string): string {
    return this.telefoneUtils.removerDDI(telefone);
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

  private validarCpfNoBackend(cpf: string): void {
    this.validandoCpf = true;
    this.mensagemValidacaoCpf = '';
    this.camposHabilitados = false;
    this.existeUsuarioLocal = false;

    this.usuarioService.validarCpf(cpf).subscribe({
      next: (response) => {
        this.validandoCpf = false;
        this.cpfJaCadastrado = response.cpfCadastrado;
        this.existeUsuarioLocal = response.existeUsuarioLocal;
        this.mensagemValidacaoCpf = response.mensagem;
        
        // Se o CPF já está consolidado internamente, bloqueia novo onboarding.
        if (response.cpfCadastrado) {
          this.camposHabilitados = false;
        } else {
          // CPF disponível para onboarding - habilitar campos.
          this.camposHabilitados = true;
          
          // Se existe usuário local, reaproveitar os dados retornados.
          if (response.existeUsuarioLocal && response.dadosUsuarioLocal) {
            this.preencherCamposComDadosUsuarioLocal(response.dadosUsuarioLocal);
          }
        }
        
        console.log('Validação CPF:', {
          cpfCadastrado: response.cpfCadastrado,
          existeUsuarioLocal: response.existeUsuarioLocal,
          existeProfissionalLocal: response.existeProfissionalLocal,
          mensagem: response.mensagem,
          camposHabilitados: this.camposHabilitados,
          dadosUsuarioLocal: !!response.dadosUsuarioLocal
        });
      },
      error: (error) => {
        this.validandoCpf = false;
        console.error('Erro ao validar CPF:', error);
        
        if (error.status === 400) {
          this.mensagemValidacaoCpf = 'CPF inválido. Verifique o número digitado.';
        } else {
          this.mensagemValidacaoCpf = 'Erro ao validar CPF. Tente novamente mais tarde.';
        }
        this.cpfJaCadastrado = false;
        this.camposHabilitados = false;
      }
    });
  }

  /**
   * Preenche os campos do formulário com os dados do usuário local
   */
  private preencherCamposComDadosUsuarioLocal(dados: { nome: string; email: string; telefone: string; cpf: string }): void {
    this.nome = dados.nome || '';
    this.email = dados.email || '';
    // Preencher array de emails
    this.emails = dados.email ? dados.email.split(';').map((e: string) => e.trim()).filter((e: string) => e) : [];
    this.telefone = dados.telefone ? this.removerDDI(dados.telefone) : '';
    
    // Marcar que esses campos vieram do usuário local e devem ficar travados
    this.camposDoUsuarioLocal = true;
    
    console.log('Campos preenchidos com dados do usuário local:', {
      nome: this.nome,
      email: this.email,
      emails: this.emails,
      telefone: this.telefone,
      camposDoUsuarioLocal: this.camposDoUsuarioLocal
    });
    
    this.messageService.add({
      severity: 'info',
      summary: 'Dados Preenchidos',
      detail: 'Este CPF já pertence a um usuário do sistema. Se necessário, recupere a senha para realizar o login.',
      life: 5000
    });
  }

  private limparValidacaoCpf(): void {
    this.cpfJaCadastrado = false;
    this.cpfInvalido = false;
    this.mensagemValidacaoCpf = '';
    this.validandoCpf = false;
    this.camposHabilitados = false;
    this.existeUsuarioLocal = false;
    this.camposDoUsuarioLocal = false; // Resetar também os campos do usuário local
  }

  /**
   * Redireciona para tela de recuperar senha
   */
  recuperarSenha(): void {
    this.router.navigate(['/auth/recuperar-senha'], {
      queryParams: { cpf: this.cpf }
    });
  }

  // Métodos dos autocompletes
  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    this.cargosFiltrados = this.cargosOptions.filter(cargo =>
      cargo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosCargos(): void {
    this.cargosFiltrados = [...this.cargosOptions];
  }

  filtrarBancos(event: any): void {
    const query = event.query.toLowerCase();
    this.bancosFiltrados = this.bancosOptions.filter(banco =>
      banco.label.toLowerCase().includes(query) ||
      banco.value.includes(query)
    );
  }

  mostrarTodosBancos(): void {
    this.bancosFiltrados = [...this.bancosOptions];
  }

  filtrarTiposConta(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposContaFiltrados = this.tiposContaOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosTiposConta(): void {
    this.tiposContaFiltrados = [...this.tiposContaOptions];
  }

  filtrarTiposChavePix(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposChavePixFiltrados = this.tiposChavePixOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosTiposChavePix(): void {
    this.tiposChavePixFiltrados = [...this.tiposChavePixOptions];
  }

  salvarCorretor(): void {
    this.tentouSalvar = true;

    // Impede cadastro se CPF já existe
    if (this.cpfJaCadastrado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Este CPF já possui cadastro consolidado no sistema. Se necessário, utilize a opção "Recuperar Senha".'
      });
      return;
    }

    // Impede cadastro se CPF é inválido
    if (this.cpfInvalido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'CPF inválido. Verifique o número digitado.'
      });
      return;
    }

    // Valida campos obrigatórios
    console.log('Validando campos:', {
      nome: this.nome,
      cpf: this.cpf,
      email: this.email,
      emails: this.emails,
      emailsLength: this.emails?.length
    });
    
    if (!this.nome || !this.cpf || !this.emails || this.emails.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios: Nome, CPF e E-mail'
      });
      return;
    }

    // Diálogo de confirmação
    this.confirmationService.confirm({
      action: 'custom' as any,
      title: 'Confirmar Cadastro',
      message: 'Deseja confirmar o cadastro? Você receberá um e-mail com suas credenciais de acesso.',
      icon: 'pi pi-question-circle',
      severity: 'info',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      showCancel: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.executarCadastro();
      }
    });
  }

  private executarCadastro(): void {
    this.salvando = true;

    const corretor: CorretorDTO = {
      cpf: this.cpf.replace(/\D/g, ''),
      nome: this.nome,
      cargo: CorretorCargo.CORRETOR, // Sempre CORRETOR no cadastro público
      ativo: true // Sempre ativo no cadastro público
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (this.emails && this.emails.length > 0) {
      corretor.email = this.emails.filter(e => e.trim()).join(';');
    }

    if (this.nomeGuerra) {
      corretor.nomeGuerra = this.nomeGuerra;
    }

    if (this.telefone) {
      const telefoneSemMascara = this.telefone.replace(/\D/g, '');
      corretor.telefone = this.removerDDI(telefoneSemMascara);
    }

    if (this.numeroCreci) {
      corretor.numeroCreci = this.numeroCreci;
    }

    // Dados bancários
    if (this.bancoSelecionado) {
      corretor.numeroBanco = this.bancoSelecionado.value;
    }

    if (this.numeroAgencia) {
      corretor.numeroAgencia = this.numeroAgencia;
    }

    if (this.numeroContaCorrente) {
      corretor.numeroContaCorrente = this.numeroContaCorrente;
    }

    if (this.digitoConta) {
      corretor.digitoConta = this.digitoConta;
    }

    if (this.tipoContaSelecionado) {
      corretor.tipoConta = this.tipoContaSelecionado.value;
    }

    // Dados PIX
    if (this.tipoChavePixSelecionado) {
      corretor.tipoChavePix = this.tipoChavePixSelecionado.value;
    }

    if (this.chavePix) {
      corretor.chavePix = this.chavePix;
    }

    console.log('Enviando corretor:', corretor);

    this.corretorPublicoService.cadastrar(corretor).subscribe({
      next: (response) => {
        // Mudar mensagem do loading para sucesso
        this.mensagemLoading = 'Cadastro realizado com sucesso! Redirecionando...';

        const identidadeReaproveitada = response.profissionalCriado === false || response.usuarioCriado === false;
        const acessoHabilitado = response.acessoHabilitado !== false;
        const detail = !acessoHabilitado
          ? 'Cadastro concluído, mas o acesso ainda não foi habilitado. Tente recuperar a senha ou contate o suporte.'
          : identidadeReaproveitada
            ? 'Seu cadastro foi consolidado com dados já existentes no sistema. Você já pode acessar a plataforma.'
            : 'Cadastro realizado com sucesso. Você já pode acessar a plataforma.';
        
        this.messageService.add({
          severity: 'success',
          summary: 'Cadastro Realizado!',
          detail,
          life: 4000
        });
        
        // Redirecionar após 4 segundos (tempo suficiente para ver a mensagem)
        setTimeout(() => {
          this.salvando = false;
          this.router.navigate(['/auth/login']);
        }, 4000);
      },
      error: (error) => {
        this.salvando = false;
        let mensagem = 'Erro ao realizar cadastro';
        let severity: 'error' | 'warn' = 'error';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (error.status === 409) {
          // Conflito - CPF ou Email duplicado
          mensagem = error.error?.message || 'CPF ou e-mail já cadastrado no sistema';
          severity = 'warn';
        } else if (error.status === 422) {
          mensagem = error.error?.message || 'Erro de validação ao concluir o cadastro';
        } else if (error.status >= 500) {
          mensagem = 'Erro no servidor. Tente novamente mais tarde.';
        }
        
        this.messageService.add({
          severity: severity,
          summary: severity === 'warn' ? 'Atenção' : 'Erro',
          detail: mensagem,
          life: 6000
        });
        
        console.error('Erro ao cadastrar corretor:', error);
      }
    });
  }

  voltarLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
