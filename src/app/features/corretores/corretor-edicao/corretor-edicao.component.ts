import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { BancoService } from '../../../core/services/banco.service';
import { CorretorSaidaDTO, CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { Banco } from '../../../core/models/banco.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { TelefoneUtilsService } from '../../../shared/services/telefone-utils.service';

@Component({
  selector: 'app-corretor-edicao',
  templateUrl: './corretor-edicao.component.html',
  styleUrls: ['./corretor-edicao.component.scss']
})
export class CorretorEdicaoComponent extends BaseFormComponent implements OnInit {
  codcfoCorretor!: string;
  
  // Campos do formulário
  nome = '';
  cpf = '';
  email = '';
  emails: string[] = []; // Array para p-chips
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
  
  carregando = false;
  // salvando e tentouSalvar herdados de BaseFormComponent
  corretor: CorretorSaidaDTO | null = null;
  
  // Informações sobre o usuário do sistema
  existeUsuarioLocal = true; // Por padrão assume que existe
  veioDeInclusao = false; // Indica se veio da tela de inclusão
  exibirMensagemUsuario = false; // Controla exibição da mensagem
  
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  cargosFiltrados: { label: string; value: CorretorCargo }[] = [];
  bancosOptions: { label: string; value: string; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: string; banco: Banco }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private corretorService: CorretorService,
    private bancoService: BancoService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService,
    private confirmationService: ConfirmationService,
    private telefoneUtils: TelefoneUtilsService
  ) {
    super(); // Chama construtor da classe base
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.ALTERAR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar corretores'
      });
      this.router.navigate(['/cadastros/corretores']);
      return;
    }

    // Captura informações do router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (window.history.state || {});
    
    if (state['existeUsuarioLocal'] !== undefined) {
      this.existeUsuarioLocal = state['existeUsuarioLocal'];
      this.veioDeInclusao = state['origem'] === 'inclusao';
      this.exibirMensagemUsuario = this.veioDeInclusao;
    }

    this.codcfoCorretor = this.route.snapshot.params['codcfo'];
    this.configurarBreadcrumb();
    this.carregarOpcoes();
    this.carregarCorretor();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores', url: '/cadastros/corretores' },
      { label: 'Editar Corretor' }
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

  private carregarCorretor(): void {
    this.carregando = true;
    this.corretorService.buscarPorCodigo(this.codcfoCorretor).subscribe({
      next: (corretor) => {
        this.corretor = corretor;
        debugger
        this.preencherFormulario(corretor);
        this.carregando = false;
        debugger
      },
      error: (error) => {
        this.carregando = false;
        let mensagem = 'Erro ao carregar dados do corretor';
        if (error.status === 404) {
          mensagem = 'Corretor não encontrado';
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
        this.router.navigate(['/cadastros/corretores']);
      }
    });
  }

  /**
   * Remove DDI (55) do telefone se presente
   * Exemplo: "5521998954455" -> "21998954455"
   */
  private removerDDI(telefone: string): string {
    return this.telefoneUtils.removerDDI(telefone);
  }

  private preencherFormulario(corretor: CorretorSaidaDTO): void {
    this.nome = corretor.nome || '';
    this.cpf = corretor.cpf || '';
    this.email = corretor.email || '';
    // Converte string "email1@gmail.com;email2@gmail.com" em array
    this.emails = corretor.email ? corretor.email.split(';').map(e => e.trim()).filter(e => e) : [];
    this.nomeGuerra = corretor.nomeGuerra || '';
    this.telefone = corretor.telefone ? this.removerDDI(corretor.telefone) : '';
    this.numeroCreci = corretor.numeroCreci || '';
    this.cargo = corretor.cargo || CorretorCargo.CORRETOR;
    this.ativo = corretor.ativo ?? true;

    // Dados bancários - backend pode usar 'agencia' ao invés de 'numeroAgencia'
    const agencia = (corretor as any).agencia || corretor.numeroAgencia || '';
    const contaCorrente = (corretor as any).contaCorrente || corretor.numeroContaCorrente || '';
    
    this.numeroBanco = corretor.numeroBanco || '';
    this.numeroAgencia = agencia;
    this.numeroContaCorrente = contaCorrente;
    this.tipoConta = corretor.tipoConta || '';

    // Dados PIX - backend pode enviar tipoChavePix como número
    const tipoChavePixValue = corretor.tipoChavePix;
    if (typeof tipoChavePixValue === 'number') {
      // Converte número para enum (1=CPF, 2=CELULAR, 3=EMAIL, 4=CHAVE_ALEATORIA)
      const tipoChaveMap: Record<number, TipoChavePix> = {
        1: TipoChavePix.CPF,
        2: TipoChavePix.CELULAR,
        3: TipoChavePix.EMAIL,
        4: TipoChavePix.CHAVE_ALEATORIA
      };
      this.tipoChavePix = tipoChaveMap[tipoChavePixValue] || TipoChavePix.CPF;
    } else {
      this.tipoChavePix = tipoChavePixValue || TipoChavePix.CPF;
    }
    this.chavePix = corretor.chavePix || '';

    // Preencher autocompletes
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === this.cargo) || null;
    
    // Preencher banco se houver numeroBanco
    if (this.numeroBanco) {
      this.bancoSelecionado = this.bancosOptions.find(b => b.value === this.numeroBanco) || null;
    }
    
    // Preencher tipo chave PIX
    this.tipoChavePixSelecionado = this.tiposChavePixOptions.find(t => t.value === this.tipoChavePix) || null;
  }

  // Métodos para Autocomplete de Cargo
  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    this.cargosFiltrados = this.cargosOptions.filter(cargo =>
      cargo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosCargos(): void {
    this.cargosFiltrados = [...this.cargosOptions];
  }

  // Métodos para Autocomplete de Tipo Chave PIX
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

  /**
   * Valida o formulário antes de solicitar confirmação
   * Chamado pelo botão com actionType="none" para controle manual
   */
  validarESalvar(): void {
    // Valida primeiro
    if (!this.validarFormulario()) {
      return;
    }
    
    // Se validou, mostra confirmação e depois salva
    this.confirmationService.confirmSave('Deseja realmente salvar as alterações do corretor?').subscribe(confirmed => {
      if (confirmed) {
        this.salvarCorretor();
      }
    });
  }

  salvarCorretor(): void {
    this.salvando = true;

    // Extrair valor do cargo se for objeto
    const cargoValue = this.cargoSelecionado ? this.cargoSelecionado.value : this.cargo;
    const tipoChavePixValue = this.tipoChavePixSelecionado ? this.tipoChavePixSelecionado.value : this.tipoChavePix;

    const corretorAtualizado: CorretorDTO = {
      nome: this.nome,
      cpf: this.cpf,
      email: this.emails.length > 0 ? this.emails.join(';') : '', // Converte array em string
      nomeGuerra: this.nomeGuerra,
      telefone: this.telefone,
      numeroCreci: this.numeroCreci,
      cargo: cargoValue,
      numeroBanco: this.bancoSelecionado ? this.bancoSelecionado.value : '', // Envia string vazia se não selecionado
      numeroAgencia: this.numeroAgencia,
      numeroContaCorrente: this.numeroContaCorrente,
      tipoConta: this.tipoConta,
      tipoChavePix: tipoChavePixValue,
      chavePix: this.chavePix,
      ativo: this.ativo
    };

    // Usa o CPF do corretor como identificador para atualização (endpoint PATCH /cpf/{cpf})
    this.corretorService.atualizar(this.cpf, corretorAtualizado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Corretor atualizado com sucesso!'
        });
        this.router.navigate(['/cadastros/corretores']);
      },
      error: (error) => {
        this.salvando = false;
        let mensagem = 'Erro ao atualizar corretor';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'Dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
      }
    });
  }

  /**
   * Verifica se o formulário foi alterado comparando com valores originais
   */
  get formularioAlterado(): boolean {
    if (!this.corretor) return false;
    
    return this.nome !== this.corretor.nome ||
           this.cpf !== this.corretor.cpf ||
           this.email !== (this.corretor.email || '') ||
           this.nomeGuerra !== (this.corretor.nomeGuerra || '') ||
           this.telefone !== (this.corretor.telefone || '') ||
           this.numeroCreci !== (this.corretor.numeroCreci || '') ||
           (this.cargoSelecionado?.value || this.cargo) !== this.corretor.cargo ||
           (this.bancoSelecionado?.value || this.numeroBanco) !== (this.corretor.numeroBanco || '') ||
           this.numeroAgencia !== (this.corretor.numeroAgencia || '') ||
           this.numeroContaCorrente !== (this.corretor.numeroContaCorrente || '') ||
           this.tipoConta !== (this.corretor.tipoConta || '') ||
           (this.tipoChavePixSelecionado?.value || this.tipoChavePix) !== (this.corretor.tipoChavePix || TipoChavePix.CPF) ||
           this.chavePix !== (this.corretor.chavePix || '') ||
           this.ativo !== this.corretor.ativo;
  }

  limparTela(): void {
    if (this.corretor) {
      this.preencherFormulario(this.corretor);
      this.tentouSalvar = false;
    }
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
      { id: 'email', valor: this.emails.length > 0 ? this.emails.join(';') : '', label: 'E-mail' }
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
