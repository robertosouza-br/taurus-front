import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorPublicoService } from '../../../core/services/corretor-publico.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { BancoService } from '../../../core/services/banco.service';
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
  tipoConta = '';
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
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  
  // Controle de validação de CPF
  cpfJaCadastrado = false;
  cpfInvalido = false;
  mensagemValidacaoCpf = '';
  validandoCpf = false;
  camposHabilitados = false;
  
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

    this.usuarioService.validarCpf(cpf).subscribe({
      next: (response) => {
        this.validandoCpf = false;
        this.cpfJaCadastrado = response.cpfCadastrado;
        this.mensagemValidacaoCpf = response.mensagem;
        
        // Se CPF já está cadastrado em ambos os sistemas, bloqueia cadastro
        if (response.cpfCadastrado) {
          this.camposHabilitados = false;
        } else {
          // CPF não existe, pode criar - habilitar campos
          this.camposHabilitados = true;
          
          // Se existe apenas no sistema local, preencher os campos com os dados retornados
          if (response.existeUsuarioLocal && response.dadosUsuarioLocal) {
            this.preencherCamposComDadosUsuarioLocal(response.dadosUsuarioLocal);
          }
          
          // Se existe apenas no sistema externo, preencher os campos com os dados retornados
          if (response.existeCorretorExterno && (response as any).dadosCorretorExterno) {
            this.preencherCamposComDadosCorretorExterno((response as any).dadosCorretorExterno);
          }
        }
        
        console.log('Validação CPF:', {
          cpfCadastrado: response.cpfCadastrado,
          existeUsuarioLocal: response.existeUsuarioLocal,
          existeCorretorExterno: response.existeCorretorExterno,
          mensagem: response.mensagem,
          camposHabilitados: this.camposHabilitados,
          dadosUsuarioLocal: !!response.dadosUsuarioLocal,
          dadosCorretorExterno: !!(response as any).dadosCorretorExterno
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
    
    console.log('Campos preenchidos com dados do usuário local:', {
      nome: this.nome,
      email: this.email,
      emails: this.emails,
      telefone: this.telefone
    });
    
    this.messageService.add({
      severity: 'info',
      summary: 'Dados Preenchidos',
      detail: 'Os dados do usuário foram preenchidos automaticamente. Você pode alterá-los se necessário.',
      life: 5000
    });
  }

  /**
   * Preenche os campos do formulário com dados do corretor externo
   */
  private preencherCamposComDadosCorretorExterno(dados: any): void {
    this.nome = dados.nome || '';
    this.email = dados.email || '';
    // Preencher array de emails
    this.emails = dados.email ? dados.email.split(';').map((e: string) => e.trim()).filter((e: string) => e) : [];
    this.telefone = dados.telefone ? this.removerDDI(dados.telefone) : '';
    this.nomeGuerra = dados.nomeGuerra || '';
    this.numeroCreci = dados.numeroCreci || '';
    
    // Preencher dados bancários se existirem
    if (dados.banco) {
      const banco = this.bancosOptions.find(b => b.value === dados.banco);
      if (banco) {
        this.bancoSelecionado = banco;
      }
    }
    if (dados.agencia) {
      this.numeroAgencia = dados.agencia;
    }
    if (dados.contaCorrente) {
      this.numeroContaCorrente = dados.contaCorrente;
    }
    if (dados.tipoConta) {
      this.tipoConta = dados.tipoConta;
    }
    
    // Preencher dados PIX se existirem
    if (dados.tipoChavePix) {
      const tipoPix = this.tiposChavePixOptions.find(
        t => t.label === dados.tipoChavePix || t.value === dados.tipoChavePix
      );
      if (tipoPix) {
        this.tipoChavePixSelecionado = tipoPix;
      }
    }
    if (dados.chavePix) {
      this.chavePix = dados.chavePix;
    }
    
    console.log('Campos preenchidos com dados do corretor externo:', {
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      numeroCreci: this.numeroCreci,
      nomeGuerra: this.nomeGuerra
    });
    
    this.messageService.add({
      severity: 'info',
      summary: 'Dados Preenchidos',
      detail: 'Os dados do corretor externo foram preenchidos automaticamente. Você pode alterá-los se necessário.',
      life: 5000
    });
  }

  private limparValidacaoCpf(): void {
    this.cpfJaCadastrado = false;
    this.cpfInvalido = false;
    this.mensagemValidacaoCpf = '';
    this.validandoCpf = false;
    this.camposHabilitados = false;
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
        detail: 'Este CPF já está cadastrado. Utilize a opção "Recuperar Senha".'
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
    if (!this.nome || !this.cpf || !this.email) {
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

    if (this.tipoConta) {
      corretor.tipoConta = this.tipoConta;
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
      next: () => {
        // Mudar mensagem do loading para sucesso
        this.mensagemLoading = 'Cadastro realizado com sucesso! Redirecionando...';
        
        this.messageService.add({
          severity: 'success',
          summary: 'Cadastro Realizado!',
          detail: 'Em breve você receberá um e-mail com suas credenciais de acesso.',
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
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'CPF já cadastrado ou dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
        
        console.error('Erro ao cadastrar corretor:', error);
      }
    });
  }

  voltarLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
