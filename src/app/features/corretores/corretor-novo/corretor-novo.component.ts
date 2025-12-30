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
    private messageService: MessageService
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

    // Definir apenas o cargo padrão (PIX é opcional)
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === CorretorCargo.CORRETOR) || null;

    // Carregar lista de bancos
    this.bancoService.listar().subscribe({
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
      if (cpf && cpf.length === 11) {
        // Valida o CPF antes de chamar o backend
        if (!this.validarCPF(cpf)) {
          this.validandoCpf = false;
          this.cpfJaCadastrado = false;
          this.cpfInvalido = true;
          this.mensagemValidacaoCpf = 'CPF inválido. Verifique o número digitado.';
          return;
        }
        this.cpfInvalido = false;
        this.validarCpfNoBackend(cpf);
      } else {
        this.limparValidacaoCpf();
      }
    });
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

    this.usuarioService.validarCpf(cpf).subscribe({
      next: (response) => {
        this.validandoCpf = false;
        this.cpfJaCadastrado = response.cpfCadastrado;
        this.mensagemValidacaoCpf = response.mensagem;
        
        // Log detalhado para debug (pode ser removido em produção)
        console.log('Validação CPF:', {
          cpfCadastrado: response.cpfCadastrado,
          existeUsuarioLocal: response.existeUsuarioLocal,
          existeCorretorExterno: response.existeCorretorExterno,
          mensagem: response.mensagem
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
      }
    });
  }

  private limparValidacaoCpf(): void {
    this.cpfJaCadastrado = false;
    this.cpfInvalido = false;
    this.mensagemValidacaoCpf = '';
    this.validandoCpf = false;
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

    const corretor: CorretorDTO = {
      nome: this.nome,
      cpf: this.cpf.replace(/\D/g, ''),
      email: this.email,
      cargo: this.cargoSelecionado!.value,
      ativo: this.ativo
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (this.nomeGuerra) corretor.nomeGuerra = this.nomeGuerra;
    if (this.telefone) corretor.telefone = this.telefone.replace(/\D/g, '');
    if (this.numeroCreci) corretor.numeroCreci = this.numeroCreci;
    if (this.bancoSelecionado) corretor.numeroBanco = this.bancoSelecionado.value; // Envia apenas o código
    if (this.numeroAgencia) corretor.numeroAgencia = this.numeroAgencia;
    if (this.numeroContaCorrente) corretor.numeroContaCorrente = this.numeroContaCorrente;
    if (this.tipoConta) corretor.tipoConta = this.tipoConta;
    if (this.tipoChavePixSelecionado) corretor.tipoChavePix = this.tipoChavePixSelecionado.value;
    if (this.chavePix) corretor.chavePix = this.chavePix;

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
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'CPF já cadastrado ou dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
      }
    });
  }

  limparTela(): void {
    this.nome = '';
    this.cpf = '';
    this.email = '';
    this.nomeGuerra = '';
    this.telefone = '';
    this.numeroCreci = '';
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === CorretorCargo.CORRETOR) || null;
    this.numeroBanco = '';
    this.numeroAgencia = '';
    this.numeroContaCorrente = '';
    this.tipoConta = '';
    this.tipoChavePixSelecionado = null;
    this.chavePix = '';
    this.ativo = true;
    this.tentouSalvar = false;
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
           !this.ativo; // Se desativou, considera alterado
  }

  cancelar(): void {
    this.router.navigate(['/cadastros/corretores']);
  }

  /**
   * Implementação do método abstrato da classe base
   * Define os campos obrigatórios do formulário
   */
  protected override getCamposObrigatorios() {
    return [
      { id: 'nome', valor: this.nome, label: 'Nome Completo' },
      { id: 'cpf', valor: this.cpf, label: 'CPF' },
      { id: 'email', valor: this.email, label: 'E-mail' },
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
