import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { BancoService } from '../../../core/services/banco.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { Banco } from '../../../core/models/banco.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { TelefoneUtilsService } from '../../../shared/services/telefone-utils.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-corretor-novo',
  templateUrl: './corretor-novo.component.html',
  styleUrls: ['./corretor-novo.component.scss']
})
export class CorretorNovoComponent extends BaseFormComponent implements OnInit, OnDestroy {
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
  ativo = true;

  // Controle do formulário (herdado de BaseFormComponent: tentouSalvar, salvando)

  // Controle de validação de CPF
  cpfJaCadastrado = false;
  cpfInvalido = false;
  mensagemValidacaoCpf = '';
  validandoCpf = false;
  camposHabilitados = false; // Controla se os campos estão habilitados
  camposDoUsuarioLocal = false; // Se os dados vieram do usuário local (campos devem ficar travados)
  codcfoCorretorExistente: string | null = null; // CODCFO se corretor já existe
  existeUsuarioLocal = false; // Se corretor tem usuário no sistema interno
  private cpfSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Opções
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  cargosFiltrados: { label: string; value: CorretorCargo }[] = [];
  bancosOptions: { label: string; value: string; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: string; banco: Banco }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private corretorService: CorretorService,
    private bancoService: BancoService,
    private usuarioService: UsuarioService,
    private router: Router,
    private messageService: MessageService,
    private telefoneUtils: TelefoneUtilsService
  ) {
    super(); // Chama construtor da classe base
  }

  ngOnInit(): void {
    this.configurarBreadcrumb();
    this.carregarOpcoes();
    this.configurarValidacaoCpf();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores', url: '/cadastros/corretores' },
      { label: 'Novo Corretor' }
    ];
  }

  private carregarOpcoes(): void {
    this.cargosOptions = Object.keys(CorretorCargo).map(key => ({
      label: CARGO_LABELS[key as CorretorCargo],
      value: key as CorretorCargo
    }));

    this.tiposChavePixOptions = Object.keys(TipoChavePix).map(key => ({
      label: TIPO_CHAVE_PIX_LABELS[key as TipoChavePix],
      value: key as TipoChavePix
    }));

    // Definir cargo padrão
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === CorretorCargo.CORRETOR) || null;

    // Carregar lista de bancos
    this.bancoService.listarTodos().subscribe({
      next: (bancos) => {
        this.bancosOptions = bancos.map(banco => ({
          label: `${banco.codigo} - ${banco.nome}`,
          value: banco.codigo,
          banco: banco
        }));
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
   * Exemplo: "5521998954455" -> "21998954455"
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
    this.codcfoCorretorExistente = null;
    this.existeUsuarioLocal = false;

    this.usuarioService.validarCpf(cpf).subscribe({
      next: (response) => {
        this.validandoCpf = false;
        this.cpfJaCadastrado = response.cpfCadastrado;
        this.existeUsuarioLocal = response.existeUsuarioLocal;
        
        // Se o CPF já existe no sistema externo, buscar o corretor para redirecionar
        if (response.existeCorretorExterno) {
          // Não mostrar mensagem, apenas redirecionar
          this.mensagemValidacaoCpf = '';
          this.buscarCorretorExistente(cpf);
        } else if (!response.cpfCadastrado) {
          // CPF não existe, pode criar - habilitar campos
          this.mensagemValidacaoCpf = response.mensagem;
          this.camposHabilitados = true;
          
          // Se existe apenas no sistema local, preencher os campos com os dados retornados
          if (response.existeUsuarioLocal && response.dadosUsuarioLocal) {
            this.preencherCamposComDadosUsuarioLocal(response.dadosUsuarioLocal);
          }
        } else {
          // CPF já cadastrado e não vai redirecionar - mostrar mensagem
          this.mensagemValidacaoCpf = response.mensagem;
        }
        
        console.log('Validação CPF:', {
          cpfCadastrado: response.cpfCadastrado,
          existeUsuarioLocal: response.existeUsuarioLocal,
          existeCorretorExterno: response.existeCorretorExterno,
          mensagem: response.mensagem,
          camposHabilitados: this.camposHabilitados,
          dadosPreenchidos: !!response.dadosUsuarioLocal
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

  private limparValidacaoCpf(): void {
    this.cpfJaCadastrado = false;
    this.cpfInvalido = false;
    this.mensagemValidacaoCpf = '';
    this.validandoCpf = false;
    this.camposHabilitados = false;
    this.codcfoCorretorExistente = null;
    this.existeUsuarioLocal = false;
    this.camposDoUsuarioLocal = false; // Resetar também os campos do usuário local
  }

  /**
   * Preenche os campos do formulário com os dados do usuário local
   */
  private preencherCamposComDadosUsuarioLocal(dados: { nome: string; email: string; telefone: string; cpf: string }): void {
    this.nome = dados.nome || '';
    this.email = dados.email || '';
    // Preencher array de emails
    this.emails = dados.email ? dados.email.split(';').map(e => e.trim()).filter(e => e) : [];
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
      detail: 'Os dados do usuário foram preenchidos automaticamente. Você pode alterá-los se necessário.',
      life: 5000
    });
  }

  /**
   * Busca corretor existente por CPF e redireciona para edição
   */
  private buscarCorretorExistente(cpf: string): void {
    this.corretorService.buscarPorCpf(cpf).subscribe({
      next: (corretor) => {
        // Se encontrou o corretor, armazenar CODCFO e redirecionar diretamente
        this.codcfoCorretorExistente = (corretor as any).codcfo || (corretor as any).id;
        
        // Redirecionar imediatamente
        this.redirecionarParaEdicao();
      },
      error: (error) => {
        console.error('Erro ao buscar corretor:', error);
        // Se não encontrou por algum motivo, apenas bloqueia
        this.cpfJaCadastrado = true;
        this.mensagemValidacaoCpf = 'CPF já cadastrado, mas não foi possível carregar os dados.';
      }
    });
  }

  /**
   * Redireciona para tela de edição do corretor
   * Passa informações sobre status do usuário no sistema
   */
  private redirecionarParaEdicao(): void {
    if (this.codcfoCorretorExistente) {
      this.router.navigate(['/cadastros/corretores/editar', this.codcfoCorretorExistente], {
        state: {
          existeUsuarioLocal: this.existeUsuarioLocal,
          origem: 'inclusao'
        }
      });
    }
  }

  onCpfChange(): void {
    this.cpfSubject.next(this.cpf);
  }

  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    this.cargosFiltrados = this.cargosOptions.filter(cargo =>
      cargo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosCargos(): void {
    this.cargosFiltrados = [...this.cargosOptions];
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

  // Métodos para Autocomplete de Banco
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

  // Métodos para Autocomplete de Cargo

  salvarCorretor(): void {
    // Usa validação da classe base (já marca tentouSalvar, foca no erro e exibe mensagem)
    if (!this.validarFormulario()) {
      return;
    }

    if (this.cpfJaCadastrado) {
      // Foca no campo CPF quando já cadastrado
      this.focarCampo('cpf');
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Este CPF já está cadastrado no sistema'
      });
      return;
    }

    this.salvando = true;

    // Construir DTO com APENAS os campos permitidos na inclusão conforme API
    const corretor: CorretorDTO = {
      cpf: this.cpf.replace(/\D/g, ''),
      nome: this.nome,
      cargo: this.cargoSelecionado!.value,
      ativo: true // Sempre true na inclusão
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (this.nomeGuerra) {
      corretor.nomeGuerra = this.nomeGuerra;
    }
    
    if (this.telefone) {
      // Remove máscara e DDI (55) se presente
      const telefoneSemMascara = this.telefone.replace(/\D/g, '');
      corretor.telefone = this.removerDDI(telefoneSemMascara);
    }
    
    if (this.emails && this.emails.length > 0) {
      corretor.email = this.emails.filter(e => e.trim()).join(';');
    }

    this.corretorService.cadastrar(corretor).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Corretor cadastrado com sucesso!'
        });
        this.router.navigate(['/cadastros/corretores']);
      },
      error: (error) => {
        this.salvando = false;
        let mensagem = 'Erro ao cadastrar corretor';
        let severity: 'error' | 'warn' = 'error';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (error.status === 409) {
          // Conflito - CPF ou Email duplicado
          mensagem = error.error?.message || 'CPF ou e-mail já cadastrado no sistema';
          severity = 'warn';
        } else if (error.status === 422) {
          // Erro de validação do sistema externo (Totvs)
          mensagem = error.error?.message || 'Erro de validação no sistema externo';
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

  limparTela(): void {
    this.nome = '';
    this.cpf = '';
    this.cpfSubject.next(''); // Resetar o Subject para permitir revalidação do mesmo CPF
    this.email = '';
    this.emails = []; // Limpar array de emails
    this.nomeGuerra = '';
    this.telefone = '';
    this.numeroCreci = '';
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === CorretorCargo.CORRETOR) || null;
    this.bancoSelecionado = null;
    this.numeroBanco = '';
    this.numeroAgencia = '';
    this.numeroContaCorrente = '';
    this.tipoConta = '';
    this.tipoChavePixSelecionado = null;
    this.chavePix = '';
    this.ativo = true;
    this.tentouSalvar = false;
    this.camposHabilitados = false;
    this.camposDoUsuarioLocal = false; // Resetar flag de campos do usuário local
    this.existeUsuarioLocal = false; // Resetar flag de usuário local
    this.codcfoCorretorExistente = null; // Resetar código do corretor existente
    this.limparValidacaoCpf();
  }

  /**
   * Verifica se o formulário foi alterado (algum campo foi preenchido)
   */
  get formularioAlterado(): boolean {
    return this.nome.trim() !== '' ||
           this.cpf.trim() !== '' ||
           this.email.trim() !== '' ||
           this.nomeGuerra.trim() !== '' ||
           this.telefone.trim() !== '' ||
           this.numeroCreci.trim() !== '' ||
           this.cargoSelecionado !== null ||
           this.bancoSelecionado !== null ||
           this.numeroAgencia.trim() !== '' ||
           this.numeroContaCorrente.trim() !== '' ||
           this.tipoConta.trim() !== '' ||
           this.tipoChavePixSelecionado !== null ||
           this.chavePix.trim() !== '' ||
           !this.ativo;
  }

  cancelar(): void {
    this.router.navigate(['/cadastros/corretores']);
  }

  /**
   * Implementação do método abstrato da classe base
   * Define os campos obrigatórios do formulário
   * Conforme documentação da API: nome, cpf e cargo são obrigatórios na inclusão
   */
  protected override getCamposObrigatorios() {
    return [
      { id: 'nome', valor: this.nome, label: 'Nome Completo' },
      { id: 'cpf', valor: this.cpf, label: 'CPF' },
      { id: 'cargo', valor: this.cargoSelecionado, label: 'Cargo' }
    ];
  }

  /**
   * Sobrescreve o método da classe base para exibir mensagem com MessageService
   */
  protected override exibirMensagemCampoObrigatorio(campo: { id: string; valor: any; label?: string }): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios'
    });
  }
}
