import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService as PrimeConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteTotvsService } from '../../../core/services/cliente-totvs.service';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { ProfissionalService } from '../../../core/services/profissional.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { ReservaBloqueioService } from '../../../core/services/reserva-bloqueio.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { TelefoneUtilsService } from '../../../shared/services/telefone-utils.service';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer/countdown-timer.component';
import {
  ReservaDTO,
  ReservaCreateDTO,
  StatusReserva,
  TipoProfissional,
  TipoContato,
  TipoRelacionamentoSecundaria,
  FormaPagamento,
  STATUS_RESERVA_LABELS,
  TIPO_PROFISSIONAL_LABELS,
  TIPO_CONTATO_LABELS,
  TIPO_RELACIONAMENTO_SECUNDARIA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  ProfissionalReservaDTO,
  statusReservaToCodigo,
  codigoToStatusReserva
} from '../../../core/models/reserva.model';
import { Imobiliaria } from '../../../core/models/imobiliaria.model';
import { ProfissionalDTO } from '../../../core/models/profissional.model';
import { CodigoStatusUnidade } from '../../../core/models/unidade.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

interface ProfissionalForm {
  tipoProfissional: { label: string; value: TipoProfissional } | null;
  obrigatorio: boolean;
  profissional: ProfissionalDTO | null;
  profissionalId: number | null;
  profissionalTelefoneBusca: string;
  corretorId: number | null;
  corretorCpfBusca: string;
  corretorNomeManual: string;
  corretorCpfManual: string;
  corretorBuscando: boolean;
  ultimoTelefoneBuscado: string;
  corretorNaoEncontrado: boolean;
}

@Component({
  selector: 'app-reserva-edicao',
  templateUrl: './reserva-edicao.component.html',
  styleUrls: ['./reserva-edicao.component.scss']
})
export class ReservaEdicaoComponent extends BaseFormComponent implements OnInit, OnDestroy {

  // ─── Referência ao Countdown Timer ────────────────────────────────────────
  @ViewChild(CountdownTimerComponent) countdownTimer?: CountdownTimerComponent;

  reservaId!: number;
  reservaOriginal: ReservaDTO | null = null;
  carregando = false;
  modoVisualizacao = false;

  // ─── Dados da unidade (readonly) ─────────────────────────────────────────
  codEmpreendimento!: number;
  codColigadaEmpreendimento!: number;
  nomeEmpreendimento = '';
  bloco = '';
  unidade = '';
  tipoUnidade = '';
  tipologia = '';
  precoUnidade: number | null = null;
  codigoStatus: number | null = null; // Status (100=Disponível para Venda, 200=Reservado, etc.)

  // ─── Dados do cliente ─────────────────────────────────────────────────────
  cpfCnpjCliente = '';
  passaporteCliente = '';
  nomeCliente = '';
  clienteEstrangeiro = false;
  consultandoClienteTotvs = false;
  codigoClienteTotvs: string | null = null;
  mensagemClienteTotvs = '';
  documentoClienteTotvs = '';
  clienteTotvsValidado = false;
  ultimoDocumentoConsultadoTotvs = '';
  displayCadastroClienteTotvs = false;
  salvandoCadastroClienteTotvs = false;
  cadastroClienteTotvsCpfCnpj = '';
  cadastroClienteTotvsNome = '';
  private limparNomeAoFecharCadastroClienteTotvs = false;
  formaPagamento: { label: string; value: FormaPagamento } | null = null;
  formaPagamentoOptions: { label: string; value: FormaPagamento }[] = [];
  dataReserva: Date | null = null;
  dataVenda: Date | null = null;
  statusSelecionado: { label: string; value: StatusReserva } | null = null;

  // ─── Imobiliária Principal ─────────────────────────────────────────────────
  imobiliariaPrincipalSelecionada: Imobiliaria | null = null;
  imobiliariaPrincipalSugestoes: Imobiliaria[] = [];
  private imobiliariasCombo: Imobiliaria[] = [];
  tipoContatoPrincipalSelecionado: { label: string; value: TipoContato } | null = null;
  contatoPrincipal = '';
  profissionaisPrincipal: ProfissionalForm[] = [];

  // ─── Imobiliária Secundária ────────────────────────────────────────────────
  exibirSecundaria = false;
  imobiliariaSecundariaSelecionada: Imobiliaria | null = null;
  imobiliariaSecundariaSugestoes: Imobiliaria[] = [];
  tipoRelacionamentoSecundariaSelecionado: { label: string; value: TipoRelacionamentoSecundaria } | null = null;
  tiposRelacionamentoSecundariaOptions: { label: string; value: TipoRelacionamentoSecundaria }[] = [];
  tipoContatoSecundarioSelecionado: { label: string; value: TipoContato } | null = null;
  contatoSecundario = '';
  profissionaisSecundaria: ProfissionalForm[] = [];

  // ─── Observações ──────────────────────────────────────────────────────────
  observacoes = '';

  // ─── Cadastro rápido de profissional ──────────────────────────────────────
  displayCadastroRapido = false;
  cadastroRapidoNome = '';
  cadastroRapidoTelefone = '';
  cadastroRapidoMensagem = '';
  salvandoCadastroRapido = false;
  private cadastroRapidoProfissionalAtual: ProfissionalForm | null = null;

  // ─── Opções de select ─────────────────────────────────────────────────────
  statusOptions: { label: string; value: StatusReserva }[] = [];
  tiposContatoOptions: { label: string; value: TipoContato }[] = [];
  tiposProfissionalOptions: { label: string; value: TipoProfissional }[] = [];

  // ─── Sugestões para autocomplete ──────────────────────────────────────────
  statusSugestoes: { label: string; value: StatusReserva }[] = [];
  formaPagamentoSugestoes: { label: string; value: FormaPagamento }[] = [];
  tipoContatoPrincipalSugestoes: { label: string; value: TipoContato }[] = [];
  tipoRelacionamentoSecundariaSugestoes: { label: string; value: TipoRelacionamentoSecundaria }[] = [];
  tipoContatoSecundarioSugestoes: { label: string; value: TipoContato }[] = [];
  tiposProfissionalSugestoes: { label: string; value: TipoProfissional }[] = [];

  breadcrumbItems: BreadcrumbItem[] = [];

  private destroy$ = new Subject<void>();
  readonly Funcionalidade = Funcionalidade;
  readonly Permissao = Permissao;

  // ─── Controle de bloqueio da unidade ──────────────────────────────────────
  unidadeBloqueada = false;
  verificandoBloqueio = false;
  duracaoTimer = 300; // Duração inicial padrão (5 minutos)
  tempoRestanteBloqueio = 0; // Tempo restante em segundos (vindo do backend)
  alertaTempoExibido = false; // Flag para controlar se já exibimos o alerta de tempo crítico

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private clienteTotvsService: ClienteTotvsService,
    private imobiliariaService: ImobiliariaService,
    private profissionalService: ProfissionalService,
    private permissaoService: PermissaoService,
    private authorizationService: AuthorizationService,
    private confirmationService: PrimeConfirmationService,
    private appConfirmationService: AppConfirmationService,
    private messageService: MessageService,
    private reservaBloqueioService: ReservaBloqueioService,
    private loadingService: LoadingService,
    private telefoneUtilsService: TelefoneUtilsService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const state = window.history.state;
    const visualizacaoViaQuery = this.route.snapshot.queryParamMap.get('visualizacao') === 'true';
    this.modoVisualizacao = visualizacaoViaQuery || !this.temPermissaoAlterar();
    this.precoUnidade = Number(state?.preco ?? state?.precoUnidade) || null;

    this.reservaId = Number(this.route.snapshot.paramMap.get('id'));
    this.configurarOpcoes();
    this.carregarCombos();
    this.carregarReserva();
  }

  ngOnDestroy(): void {
    // Libera o bloqueio ao sair da tela
    this.liberarBloqueio();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Carregamento ─────────────────────────────────────────────────────────

  private configurarOpcoes(): void {
    this.statusOptions = Object.values(StatusReserva).map(v => ({
      label: STATUS_RESERVA_LABELS[v],
      value: v
    }));

    this.tiposContatoOptions = Object.values(TipoContato).map(v => ({
      label: TIPO_CONTATO_LABELS[v],
      value: v
    }));

    this.tiposRelacionamentoSecundariaOptions = Object.values(TipoRelacionamentoSecundaria).map(v => ({
      label: TIPO_RELACIONAMENTO_SECUNDARIA_LABELS[v],
      value: v
    }));

    this.formaPagamentoOptions = Object.values(FormaPagamento).map(v => ({
      label: FORMA_PAGAMENTO_LABELS[v],
      value: v
    }));

    this.tiposProfissionalOptions = Object.values(TipoProfissional).map(v => ({
      label: TIPO_PROFISSIONAL_LABELS[v],
      value: v
    }));
  }

  carregarReserva(): void {
    this.carregando = true;
    this.reservaService.buscarPorId(this.reservaId)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (reserva) => {
          this.reservaOriginal = reserva;
          this.preencherFormulario(reserva);
          
          // Verifica se existe bloqueio ativo e depois tenta bloquear a unidade
          // Importante: Ao dar refresh, verifica o tempo restante real do backend
          if (this.codEmpreendimento && this.bloco && this.unidade) {
            this.verificarEBloquearUnidade();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar a reserva.'
          });
          this.router.navigate(['/reservas']);
        }
      });
  }

  private carregarCombos(): void {
    this.imobiliariaService.listarCombo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => {
          this.imobiliariasCombo = (lista || []).map((i) => ({
            id: i.id,
            razaoSocial: i.razaoSocial,
            nomeFantasia: i.nomeFantasia,
            alias: i.alias,
            tipoImobiliaria: i.tipoImobiliaria as any,
            cnpj: '',
            cep: '',
            logradouro: '',
            bairro: '',
            cidade: '',
            uf: '' as any,
            emailContato: '',
            ativo: i.ativo
          }));
        },
        error: () => {
          this.imobiliariasCombo = [];
        }
      });

  }

  private preencherFormulario(r: ReservaDTO): void {
    // Dados da unidade
    this.codEmpreendimento = r.codEmpreendimento;
    this.codColigadaEmpreendimento = r.codColigadaEmpreendimento;
    this.nomeEmpreendimento = r.nomeEmpreendimento;
    this.bloco = r.bloco;
    this.unidade = r.unidade;
    this.tipoUnidade = r.tipoUnidade;
    this.tipologia = r.tipologia;
    this.codigoStatus = r.codigoStatus ?? null;

    // Dados do cliente
    this.cpfCnpjCliente = r.cpfCnpjCliente || '';
    this.passaporteCliente = r.passaporteCliente || '';
    this.nomeCliente = r.nomeCliente;
    this.clienteEstrangeiro = r.clienteEstrangeiro;
    this.codigoClienteTotvs = r.codigoClienteTotvs || null;
    this.documentoClienteTotvs = r.codigoClienteTotvs
      ? this.clienteTotvsService.sanitizarDocumento(r.cpfCnpjCliente || '')
      : '';
    this.mensagemClienteTotvs = r.codigoClienteTotvs ? 'Código TOTVS vinculado à reserva.' : '';
    this.clienteTotvsValidado = !!r.codigoClienteTotvs;
    this.ultimoDocumentoConsultadoTotvs = this.documentoClienteTotvs;
    this.formaPagamento = r.formaPagamento
      ? this.formaPagamentoOptions.find(o => o.value === r.formaPagamento) || null
      : null;
    this.dataReserva = r.dataReserva ? new Date(r.dataReserva) : null;
    this.dataVenda = r.dataVenda ? new Date(r.dataVenda) : null;
    
    // Converte codigoStatus (número) para StatusReserva (enum) para preencher o dropdown
    let statusParaDropdown: StatusReserva | null = r.status || null;
    if (!statusParaDropdown && r.codigoStatus) {
      const statusConvertido = codigoToStatusReserva(r.codigoStatus);
      if (statusConvertido) {
        statusParaDropdown = statusConvertido;
      }
    }
    this.statusSelecionado = statusParaDropdown 
      ? this.statusOptions.find(o => o.value === statusParaDropdown) || null
      : null;

    // Imobiliária principal
    if (r.imobiliariaPrincipalId) {
      this.imobiliariaPrincipalSelecionada = {
        id: r.imobiliariaPrincipalId,
        nomeFantasia: r.nomeImobiliariaPrincipal,
        razaoSocial: r.nomeImobiliariaPrincipal
      } as any;
    }
    this.tipoContatoPrincipalSelecionado = r.tipoContatoPrincipal
      ? this.tiposContatoOptions.find(o => o.value === r.tipoContatoPrincipal) || null
      : null;
    this.contatoPrincipal = r.contatoPrincipal || '';

    this.profissionaisPrincipal = (r.profissionaisPrincipal || []).map(p => ({
      tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === p.tipoProfissional) || null,
      obrigatorio: false,
      profissional: null,
      profissionalId: p.profissionalId || null,
      profissionalTelefoneBusca: this.normalizarTelefone(p.whatsapp || p.telefone || ''),
      corretorId: p.corretorId || null,
      corretorCpfBusca: p.cpfCorretor || '',
      corretorNomeManual: p.nomeCorretor,
      corretorCpfManual: p.cpfCorretor || '',
      corretorBuscando: false,
      ultimoTelefoneBuscado: '',
      corretorNaoEncontrado: false
    }));
    this.profissionaisPrincipal = this.garantirProfissionaisObrigatorios(this.profissionaisPrincipal);

    // Imobiliária secundária
    if (r.imobiliariaSecundariaId) {
      this.exibirSecundaria = true;
      this.imobiliariaSecundariaSelecionada = {
        id: r.imobiliariaSecundariaId,
        nomeFantasia: r.nomeImobiliariaSecundaria || '',
        razaoSocial: r.nomeImobiliariaSecundaria || ''
      } as any;

      this.tipoContatoSecundarioSelecionado = r.tipoContatoSecundario
        ? this.tiposContatoOptions.find(o => o.value === r.tipoContatoSecundario) || null
        : null;
      this.tipoRelacionamentoSecundariaSelecionado = r.tipoRelacionamentoSecundaria
        ? this.tiposRelacionamentoSecundariaOptions.find(o => o.value === r.tipoRelacionamentoSecundaria) || null
        : null;
      this.contatoSecundario = r.contatoSecundario || '';

      this.profissionaisSecundaria = (r.profissionaisSecundaria || []).map(p => ({
        tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === p.tipoProfissional) || null,
        obrigatorio: false,
        profissional: null,
        profissionalId: p.profissionalId || null,
        profissionalTelefoneBusca: this.normalizarTelefone(p.whatsapp || p.telefone || ''),
        corretorId: p.corretorId || null,
        corretorCpfBusca: p.cpfCorretor || '',
        corretorNomeManual: p.nomeCorretor,
        corretorCpfManual: p.cpfCorretor || '',
        corretorBuscando: false,
        ultimoTelefoneBuscado: '',
        corretorNaoEncontrado: false
      }));

      if (!this.profissionaisSecundaria.length) {
        this.profissionaisSecundaria = [this.criarProfissionalForm()];
      }
    }

    this.observacoes = r.observacoes || '';

    // Configura breadcrumb dinamicamente baseado na origem
    const state = window.history.state;
    if (state?.fromList) {
      // Navegação a partir da listagem de reservas
      this.breadcrumbItems = [
        { label: 'Reservas', icon: 'pi pi-bookmark' },
        { label: 'Listagem', url: '/reservas' },
        { label: `Editar ${r.bloco}/${r.unidade}` }
      ];
    } else {
      // Navegação a partir do mapa de unidades (fluxo padrão)
      this.breadcrumbItems = [
        { label: 'Imóveis', icon: 'pi pi-building' },
        { label: 'Empreendimentos', url: '/empreendimentos' },
        {
          label: r.nomeEmpreendimento || `Cód. ${r.codEmpreendimento}`,
        },
        {
          label: 'Mapa de Unidades',
          url: `/empreendimentos/${r.codEmpreendimento}/unidades`
        },
        { label: `Reserva — ${r.bloco}/${r.unidade}` }
      ];
    }
  }

  // ─── Bloqueio de Unidade ──────────────────────────────────────────────────

  /**
   * Verifica se a unidade pode ser bloqueada
   * Apenas unidades com status DISPONIVEL_PARA_VENDA (100) podem ser bloqueadas
   */
  get podeBloquerarUnidade(): boolean {
    return this.codigoStatus === CodigoStatusUnidade.DISPONIVEL_VENDA;
  }

  /**
   * Verifica se o usuário é administrador
   */
  get isAdmin(): boolean {
    return this.authorizationService.isAdministrador();
  }

  /**
   * Verifica se os campos devem estar desabilitados
   * Campos são desabilitados quando o status é diferente de DISPONIVEL_PARA_VENDA (100)
   */
  get camposDesabilitados(): boolean {
    return this.modoVisualizacao || !this.podeBloquerarUnidade;
  }

  /**
   * Verifica se o campo status deve estar desabilitado
   * Não-admin NUNCA pode alterar o status da reserva
   */
  get statusDesabilitado(): boolean {
    return this.modoVisualizacao || !this.isAdmin;
  }

  /**
   * Verifica se o botão salvar deve estar desabilitado
   * Admin pode salvar mesmo quando status ≠ 100
   */
  get salvarDesabilitado(): boolean {
    return this.modoVisualizacao || (this.camposDesabilitados && !this.isAdmin);
  }

  /**
   * Verifica se o campo data da venda deve estar desabilitado
   * Admin pode editar mesmo quando status ≠ 100
   */
  get dataVendaDesabilitada(): boolean {
    return this.modoVisualizacao || (this.camposDesabilitados && !this.isAdmin);
  }

  get exibirInfoClienteTotvs(): boolean {
    return !!this.codigoClienteTotvs
      && this.documentoClienteTotvs === this.documentoClienteAtualLimpo;
  }

  private get documentoClienteAtualLimpo(): string {
    return this.clienteTotvsService.normalizarDocumentoConsulta(
      this.clienteEstrangeiro ? this.passaporteCliente : this.cpfCnpjCliente,
      this.clienteEstrangeiro
    );
  }

  /**
   * Verifica se o campo observações deve estar desabilitado
   * Admin pode editar mesmo quando status ≠ 100
   */
  get observacoesDesabilitadas(): boolean {
    return this.modoVisualizacao || (this.camposDesabilitados && !this.isAdmin);
  }

  /**
   * Verifica se deve mostrar os botões de ação (Limpar e Salvar)
   * - Status 100: TODOS os perfis veem os botões
   * - Status ≠ 100: apenas ADMIN vê os botões, demais veem só Cancelar
   */
  get mostrarBotoesAcao(): boolean {
    if (this.modoVisualizacao) {
      return false;
    }

    // Se codigoStatus não foi carregado ainda, não mostra botões (segurança)
    if (this.codigoStatus === null || this.codigoStatus === undefined) {
      return false;
    }
    
    // Status 100 → TODOS veem os botões
    // Status ≠ 100 → apenas ADMIN vê os botões
    return this.codigoStatus === CodigoStatusUnidade.DISPONIVEL_VENDA || this.isAdmin;
  }

  /**
   * Retorna opções de status filtradas baseadas no perfil do usuário
   * - ADMIN: vê todos os 11 status
   * - Não-ADMIN: vê apenas RESERVADA (200)
   */
  get statusOptionsFiltered(): any[] {
    if (this.isAdmin) {
      return this.statusOptions;
    }
    
    // Não-admin pode ver apenas status 200 (Reservado para Venda)
    return this.statusOptions.filter(opt => 
      opt.value === StatusReserva.RESERVADA
    );
  }

  get tituloPagina(): string {
    return this.modoVisualizacao ? 'Visualizar Reserva' : 'Editar Reserva';
  }

  get mensagemTimerEdicao(): string {
    return this.modoVisualizacao ? 'Tempo para visualizar a reserva' : 'Tempo para finalizar a edição';
  }

  /**
   * Verifica se já existe bloqueio ativo e tenta bloquear a unidade
   * IMPORTANTE: Apenas executa se o status da unidade for DISPONIVEL_PARA_VENDA (100)
   * 
   * Fluxo:
   * 1. Verifica se já existe bloqueio (importante para refresh de página)
   * 2. Se bloqueada pelo usuário atual, retoma o contador com tempo restante real
   * 3. Se bloqueada por outro usuário, redireciona
   * 4. Se não bloqueada, tenta bloquear
   */
  private verificarEBloquearUnidade(): void {
    if (this.modoVisualizacao) {
      return;
    }

    // Verifica se a unidade pode ser bloqueada (apenas status 100)
    if (!this.podeBloquerarUnidade) {
      console.log(`Unidade com status ${this.codigoStatus} não pode ser bloqueada. Bloqueio disponível apenas para status 100 (Disponível para Venda).`);
      return;
    }
    
    // Proteção contra execuções concorrentes
    if (this.verificandoBloqueio) {
      console.log('Verificação de bloqueio já em andamento, ignorando chamada duplicada');
      return;
    }

    this.verificandoBloqueio = true;

    // Primeiro verifica se já existe bloqueio
    this.reservaBloqueioService.consultarStatus(
      this.codEmpreendimento,
      this.bloco,
      this.unidade
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.verificandoBloqueio = false))
    ).subscribe({
      next: (status) => {
        if (status.bloqueado && !status.bloqueadoPorOutroUsuario) {
          // Bloqueio existe e é do usuário atual - retoma contador
          this.unidadeBloqueada = true;
          this.tempoRestanteBloqueio = status.tempoRestanteSegundos;
          this.duracaoTimer = status.tempoRestanteSegundos;
          
          // Atualiza o timer manualmente com o tempo restante correto
          setTimeout(() => {
            if (this.countdownTimer) {
              // Para o timer se estiver rodando
              this.countdownTimer.pausar();
              // Atualiza diretamente as propriedades do timer
              this.countdownTimer.duracao = status.tempoRestanteSegundos;
              this.countdownTimer.tempoRestante = status.tempoRestanteSegundos;
              this.countdownTimer.percentualProgresso = 100;
              this.countdownTimer.iniciado = false; // Permite reiniciar
              this.countdownTimer.iniciar();
            }
          }, 0);
          
          this.messageService.add({
            severity: 'info',
            summary: 'Bloqueio Retomado',
            detail: `Você tem ${this.formatarTempo(status.tempoRestanteSegundos)} para concluir a edição.`,
            life: 4000
          });
        } else if (status.bloqueado && status.bloqueadoPorOutroUsuario) {
          // Bloqueada por outro usuário - exibe dialog e redireciona
          this.appConfirmationService.alert(
            'Unidade Indisponível',
            `Esta unidade está sendo editada por outro usuário. Tente novamente em ${this.formatarTempo(status.tempoRestanteSegundos)}.`,
            'danger',
            'pi pi-lock'
          ).subscribe(() => {
            this.voltar();
          });
        } else {
          // Não bloqueada - tenta bloquear SOMENTE se ainda não foi bloqueada antes
          // Isso evita renovar o bloqueio ao dar F5
          if (!this.unidadeBloqueada) {
            this.bloquearUnidade();
          } else {
            // Já estava bloqueada, mas backend retornou como não bloqueada
            // Provavelmente o tempo expirou - redireciona
            this.messageService.add({
              severity: 'warn',
              summary: 'Tempo Expirado',
              detail: 'O tempo para completar a edição expirou.',
              life: 4000
            });
            
            setTimeout(() => {
              this.voltar();
            }, 2000);
          }
        }
      },
      error: (error) => {
        console.error('Erro ao verificar bloqueio:', error);
        // NÃO tenta bloquear em caso de erro para evitar renovações indevidas
        // O usuário pode tentar novamente manualmente
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao Verificar Bloqueio',
          detail: 'Não foi possível verificar o status da unidade. Tente novamente.',
          life: 4000
        });
        
        setTimeout(() => {
          this.voltar();
        }, 2000);
      }
    });
  }

  /**
   * Tenta bloquear a unidade para o usuário atual
   */
  private bloquearUnidade(): void {
    if (this.modoVisualizacao) {
      return;
    }

    // Proteção: não tenta bloquear se já está bloqueada
    if (this.unidadeBloqueada) {
      console.log('Unidade já bloqueada, ignorando chamada duplicada');
      return;
    }

    this.reservaBloqueioService.bloquear({
      codEmpreendimento: this.codEmpreendimento,
      bloco: this.bloco,
      unidade: this.unidade
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Verifica se outro usuário bloqueou (mesmo com status 200)
        if (response.bloqueadoPorOutroUsuario) {
          this.appConfirmationService.alert(
            'Unidade Indisponível',
            `Esta unidade está sendo visualizada por outro usuário. Tente novamente em ${this.formatarTempo(response.tempoRestanteSegundos)}.`,
            'danger',
            'pi pi-lock'
          ).subscribe(() => {
            this.voltar();
          });
          return;
        }

        // Bloqueio concedido
        this.unidadeBloqueada = true;
        this.tempoRestanteBloqueio = response.tempoRestanteSegundos;
        this.duracaoTimer = response.tempoRestanteSegundos;

        // Inicia o timer explicitamente
        setTimeout(() => {
          if (this.countdownTimer) {
            this.countdownTimer.iniciar();
          }
        }, 0);

        this.messageService.add({
          severity: 'success',
          summary: 'Unidade Bloqueada',
          detail: `Você tem ${this.formatarTempo(response.tempoRestanteSegundos)} para completar a edição.`,
          life: 4000
        });
      },
      error: (error) => {
        console.error('Erro ao bloquear unidade:', error);

        // HTTP 409 = Unidade já bloqueada por outro usuário
        if (error.status === 409) {
          const tempoRestante = error.error?.tempoRestanteSegundos || 0;
          const mensagem = tempoRestante > 0 
            ? `Esta unidade não está disponível no momento. Tente novamente em ${this.formatarTempo(tempoRestante)}.`
            : 'Esta unidade não está disponível no momento.';
          
          this.appConfirmationService.alert(
            'Unidade Indisponível',
            mensagem,
            'danger',
            'pi pi-lock'
          ).subscribe(() => {
            this.voltar();
          });
        } else {
          // Outros erros - permite continuar mas com aviso
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Não foi possível bloquear a unidade. Continue com atenção.',
            life: 4000
          });
        }
      }
    });
  }

  /**
   * Libera o bloqueio da unidade
   * Chamado ao sair, salvar ou timeout
   */
  private liberarBloqueio(): void {
    if (!this.unidadeBloqueada || !this.codEmpreendimento || !this.bloco || !this.unidade) {
      return;
    }

    this.reservaBloqueioService.liberar(
      this.codEmpreendimento,
      this.bloco,
      this.unidade
    ).subscribe({
      next: () => {
        this.unidadeBloqueada = false;
        console.log('Bloqueio liberado com sucesso');
      },
      error: (error) => {
        console.error('Erro ao liberar bloqueio:', error);
        // Não mostra mensagem ao usuário pois pode estar saindo da página
      }
    });
  }

  /**
   * Renova o bloqueio por mais 5 minutos
   * Chamado quando o usuário solicita mais tempo
   * 


  /**
   * Callback executado a cada segundo pelo countdown timer
   * Alerta o usuário quando restar 30 segundos
   */
  onTimerTick(tempoRestante: number): void {
    // Alerta quando restar exatamente 30 segundos
    if (tempoRestante === 30 && !this.alertaTempoExibido && this.unidadeBloqueada) {
      this.alertaTempoExibido = true;
      this.alertarTempoCritico();
    }
  }

  /**
   * Alerta o usuário que o tempo está acabando
   */
  private alertarTempoCritico(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Tempo Acabando!',
      detail: 'Restam apenas 30 segundos para completar a edição!',
      life: 5000,
      sticky: false
    });
  }

  /**
   * Formata tempo em segundos para string legível
   */
  private formatarTempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    
    if (minutos > 0) {
      return segs > 0 ? `${minutos}min ${segs}s` : `${minutos}min`;
    }
    return `${segs}s`;
  }

  // ─── Profissionais ────────────────────────────────────────────────────────

  private getTiposProfissionaisObrigatorios(): TipoProfissional[] {
    return [
      TipoProfissional.CORRETOR,
      TipoProfissional.GERENTE,
      TipoProfissional.DIRETOR,
      TipoProfissional.DIRETOR_EQUIPE
    ];
  }

  private criarProfissionalForm(tipoProfissional?: TipoProfissional, obrigatorio: boolean = !!tipoProfissional): ProfissionalForm {
    return {
      tipoProfissional: tipoProfissional
        ? this.tiposProfissionalOptions.find(o => o.value === tipoProfissional) || null
        : null,
      obrigatorio,
      profissional: null,
      profissionalId: null,
      profissionalTelefoneBusca: '',
      corretorId: null,
      corretorCpfBusca: '',
      corretorNomeManual: '',
      corretorCpfManual: '',
      corretorBuscando: false,
      ultimoTelefoneBuscado: '',
      corretorNaoEncontrado: false
    };
  }

  private garantirProfissionaisObrigatorios(profissionais: ProfissionalForm[]): ProfissionalForm[] {
    const obrigatorios = this.getTiposProfissionaisObrigatorios();
    const existentes = [...(profissionais || [])].map(prof => ({ ...prof, obrigatorio: false }));
    const usados = new Set<number>();

    const obrigatoriosOrdenados = obrigatorios.map(tipo => {
      const indexExistente = existentes.findIndex((prof, index) => !usados.has(index) && prof.tipoProfissional?.value === tipo);

      if (indexExistente >= 0) {
        usados.add(indexExistente);
        return { ...existentes[indexExistente], obrigatorio: true };
      }

      return this.criarProfissionalForm(tipo, true);
    });

    const extras = existentes
      .filter((_, index) => !usados.has(index))
      .map(prof => ({ ...prof, obrigatorio: false }));

    return [...obrigatoriosOrdenados, ...extras];
  }

  isProfissionalObrigatorio(prof: ProfissionalForm): boolean {
    return prof.obrigatorio;
  }

  onImobiliariaSecundariaAlterada(): void {
    if (this.imobiliariaSecundariaSelecionada && this.profissionaisSecundaria.length === 0) {
      this.profissionaisSecundaria = [this.criarProfissionalForm()];
    }
  }

  adicionarProfissional(tipo: 'principal' | 'secundaria'): void {
    const novo = this.criarProfissionalForm();
    if (tipo === 'principal') {
      this.profissionaisPrincipal.push(novo);
    } else {
      this.profissionaisSecundaria.push(novo);
    }
  }

  removerProfissional(index: number, tipo: 'principal' | 'secundaria'): void {
    const lista = tipo === 'principal' ? this.profissionaisPrincipal : this.profissionaisSecundaria;
    const profissional = lista[index];

    if (!profissional || profissional.obrigatorio) {
      return;
    }

    lista.splice(index, 1);
  }

  /**
   * Verifica se o profissional é do tipo CORRETOR
   * @param prof - Formulário do profissional
   * @returns true se for CORRETOR, false caso contrário
   */
  isCorretor(prof: ProfissionalForm): boolean {
    return prof.tipoProfissional?.value === TipoProfissional.CORRETOR;
  }

  /**
   * Handler executado quando o tipo de profissional é alterado
   * Limpa os campos de CPF e nome conforme o tipo selecionado
   * @param prof - Formulário do profissional
   */
  onTipoProfissionalAlterado(prof: ProfissionalForm): void {
    prof.corretorNaoEncontrado = false;
  }

  buscarProfissionalPorTelefone(profForm: ProfissionalForm, opcoes?: { silencioso?: boolean; forcar?: boolean }): void {
    const silencioso = !!opcoes?.silencioso;
    const forcar = !!opcoes?.forcar;
    const telefone = this.normalizarTelefone(profForm.profissionalTelefoneBusca);

    if (telefone.length < 10 || telefone.length > 11) {
      profForm.corretorNaoEncontrado = false;
      if (!silencioso) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Telefone inválido',
          detail: 'Informe um telefone ou WhatsApp válido com DDD para buscar o profissional.'
        });
      }
      return;
    }

    if (!forcar && telefone === profForm.ultimoTelefoneBuscado) {
      return;
    }

    profForm.ultimoTelefoneBuscado = telefone;
    profForm.corretorBuscando = true;
    const deveExibirLoadingGlobal = !this.loadingService.isLoading;
    if (deveExibirLoadingGlobal) {
      this.loadingService.show('Buscando profissional...');
    }

    this.profissionalService.buscarPorTelefone(telefone)
      .pipe(finalize(() => {
        profForm.corretorBuscando = false;
        if (deveExibirLoadingGlobal) {
          this.loadingService.hide();
        }
      }))
      .subscribe({
        next: (profissional) => {
          this.aplicarProfissionalNoFormulario(profForm, profissional);
        },
        error: (err) => {
          this.limparProfissionalSelecionado(profForm);
          if (err?.status === 404) {
            profForm.corretorNaoEncontrado = true;
            const podeCadastrarCorretor = this.temPermissaoCadastroRapidoCorretor();

            if (podeCadastrarCorretor) {
              this.abrirCadastroRapido(
                profForm,
                'Nenhum profissional foi encontrado para este WhatsApp. Complete o cadastro rápido para continuar.'
              );
            }

            if (!silencioso) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Profissional não encontrado',
                detail: podeCadastrarCorretor
                  ? 'Nenhum profissional interno foi encontrado para o telefone informado. Você pode usar o cadastro rápido.'
                  : 'Nenhum profissional interno foi encontrado para o telefone informado.'
              });
            }
            return;
          }

          profForm.corretorNaoEncontrado = false;

          if (!silencioso) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro na busca',
              detail: err?.error?.message || 'Não foi possível buscar o profissional por telefone.'
            });
          }
        }
      });
  }

  onTelefoneProfissionalAlterado(profForm: ProfissionalForm): void {
    const telefone = this.normalizarTelefone(profForm.profissionalTelefoneBusca);

    if (profForm.profissional && telefone !== this.normalizarTelefone(profForm.profissional.telefone)) {
      this.limparProfissionalSelecionado(profForm);
    }

    if (telefone.length < 11) {
      profForm.ultimoTelefoneBuscado = '';
      profForm.corretorNaoEncontrado = false;
      return;
    }

    if (telefone.length === 11) {
      this.buscarProfissionalPorTelefone(profForm, { silencioso: true });
    }
  }

  onCpfCorretorAlterado(profForm: ProfissionalForm): void {
    profForm.corretorCpfManual = (profForm.corretorCpfBusca || '').replace(/\D/g, '');
  }

  limparProfissionalSelecionado(profForm: ProfissionalForm): void {
    profForm.profissional = null;
    profForm.profissionalId = null;
    profForm.corretorId = null;
    profForm.corretorNomeManual = '';
    profForm.corretorCpfManual = '';
    profForm.corretorCpfBusca = '';
    profForm.corretorNaoEncontrado = false;
  }

  abrirCadastroRapidoComTelefone(telefone: string, profForm?: ProfissionalForm): void {
    this.abrirCadastroRapido(profForm);
    this.cadastroRapidoTelefone = this.normalizarTelefone(telefone);
  }

  // ─── Autocomplete Imobiliária ─────────────────────────────────────────────

  temPermissaoCadastroRapidoCorretor(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.INCLUIR);
  }

  buscarImobiliarias(event: any, tipo: 'principal' | 'secundaria'): void {
    const query = (event.query || '').toString().toLowerCase().trim();
    const filtradas = (this.imobiliariasCombo || []).filter(i =>
      (i.nomeFantasia || '').toLowerCase().includes(query) ||
      (i.razaoSocial || '').toLowerCase().includes(query) ||
      (i.alias || '').toLowerCase().includes(query)
    );

    if (tipo === 'principal') {
      this.imobiliariaPrincipalSugestoes = filtradas;
    } else {
      this.imobiliariaSecundariaSugestoes = filtradas;
    }
  }

  onDropdownClickImobiliariaPrincipal(): void {
    this.imobiliariaPrincipalSugestoes = this.imobiliariasCombo || [];
  }

  onDropdownClickImobiliariaSecundaria(): void {
    this.imobiliariaSecundariaSugestoes = this.imobiliariasCombo || [];
  }

  getNomeImobiliaria(i: Imobiliaria): string {
    return i?.nomeFantasia || i?.razaoSocial || '';
  }

  // ─── Filtros de Autocomplete (Enums) ─────────────────────────────────────

  filtrarStatus(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    console.log('📝 [filtrarStatus] query:', query);
    console.log('📝 [filtrarStatus] statusOptionsFiltered disponíveis:', this.statusOptionsFiltered.length);
    
    if (!query) {
      this.statusSugestoes = this.statusOptionsFiltered;
    } else {
      this.statusSugestoes = this.statusOptionsFiltered.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
    
    console.log('📝 [filtrarStatus] statusSugestoes finais:', this.statusSugestoes);
  }

  filtrarFormaPagamento(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    if (!query) {
      this.formaPagamentoSugestoes = this.formaPagamentoOptions;
    } else {
      this.formaPagamentoSugestoes = this.formaPagamentoOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
  }

  filtrarTipoContatoPrincipal(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    if (!query) {
      this.tipoContatoPrincipalSugestoes = this.tiposContatoOptions;
    } else {
      this.tipoContatoPrincipalSugestoes = this.tiposContatoOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
  }

  filtrarTipoContatoSecundario(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    if (!query) {
      this.tipoContatoSecundarioSugestoes = this.tiposContatoOptions;
    } else {
      this.tipoContatoSecundarioSugestoes = this.tiposContatoOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
  }

  filtrarTipoRelacionamentoSecundaria(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    if (!query) {
      this.tipoRelacionamentoSecundariaSugestoes = this.tiposRelacionamentoSecundariaOptions;
    } else {
      this.tipoRelacionamentoSecundariaSugestoes = this.tiposRelacionamentoSecundariaOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
  }

  filtrarTiposProfissional(event: any): void {
    const query = (event.query || '').toString().toLowerCase();
    if (!query) {
      this.tiposProfissionalSugestoes = this.tiposProfissionalOptions;
    } else {
      this.tiposProfissionalSugestoes = this.tiposProfissionalOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
  }

  onDropdownClickStatus(): void {
    console.log('🔽 [onDropdownClickStatus] Dropdown clicado');
    console.log('🔽 [onDropdownClickStatus] statusOptionsFiltered disponíveis:', this.statusOptionsFiltered.length);
    this.statusSugestoes = this.statusOptionsFiltered;
    console.log('🔽 [onDropdownClickStatus] statusSugestoes setadas:', this.statusSugestoes);
  }

  onDropdownClickFormaPagamento(): void {
    this.formaPagamentoSugestoes = this.formaPagamentoOptions;
  }

  onDropdownClickTipoContatoPrincipal(): void {
    this.tipoContatoPrincipalSugestoes = this.tiposContatoOptions;
  }

  onTipoContatoPrincipalAlterado(): void {
    this.contatoPrincipal = '';
  }

  onDropdownClickTipoContatoSecundario(): void {
    this.tipoContatoSecundarioSugestoes = this.tiposContatoOptions;
  }

  onTipoContatoSecundarioAlterado(): void {
    this.contatoSecundario = '';
  }

  removerImobiliariaSecundaria(): void {
    this.imobiliariaSecundariaSelecionada = null;
    this.tipoRelacionamentoSecundariaSelecionado = null;
    this.tipoContatoSecundarioSelecionado = null;
    this.contatoSecundario = '';
    this.profissionaisSecundaria = [];
    this.imobiliariaSecundariaSugestoes = [];
    this.exibirSecundaria = false;
  }

  onDropdownClickTipoRelacionamentoSecundaria(): void {
    this.tipoRelacionamentoSecundariaSugestoes = this.tiposRelacionamentoSecundariaOptions;
  }

  onDropdownClickTiposProfissional(): void {
    this.tiposProfissionalSugestoes = this.tiposProfissionalOptions;
  }

  isContatoTelefoneOuWhatsapp(tipo?: TipoContato | null): boolean {
    return tipo === TipoContato.TELEFONE || tipo === TipoContato.WHATSAPP;
  }

  isContatoEmail(tipo?: TipoContato | null): boolean {
    return tipo === TipoContato.EMAIL;
  }

  // ─── Cadastro Rápido ──────────────────────────────────────────────────────

  abrirCadastroRapido(profForm?: ProfissionalForm, mensagem?: string): void {
    if (!this.temPermissaoCadastroRapidoCorretor()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sem permissão',
        detail: 'Você não possui permissão para realizar o cadastro rápido de profissional.'
      });
      return;
    }

    this.cadastroRapidoProfissionalAtual = profForm || null;
    this.cadastroRapidoNome = '';
    this.cadastroRapidoTelefone = this.normalizarTelefone(profForm?.profissionalTelefoneBusca || '');
    this.cadastroRapidoMensagem = mensagem || '';
    this.displayCadastroRapido = true;
  }

  fecharCadastroRapido(limparProfissional: boolean = true): void {
    if (limparProfissional && this.cadastroRapidoProfissionalAtual) {
      this.limparProfissionalSelecionado(this.cadastroRapidoProfissionalAtual);
      this.cadastroRapidoProfissionalAtual.profissionalTelefoneBusca = '';
      this.cadastroRapidoProfissionalAtual.ultimoTelefoneBuscado = '';
    }

    this.displayCadastroRapido = false;
    this.cadastroRapidoProfissionalAtual = null;
    this.cadastroRapidoNome = '';
    this.cadastroRapidoTelefone = '';
    this.cadastroRapidoMensagem = '';
  }

  salvarCadastroRapido(): void {
    const telefone = this.normalizarTelefone(this.cadastroRapidoTelefone);

    if (!this.cadastroRapidoNome.trim() || !telefone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Nome e telefone são obrigatórios.'
      });
      return;
    }

    if (!this.telefoneUtilsService.validarTelefoneBR(telefone)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Telefone inválido',
        detail: 'Informe um telefone ou WhatsApp válido para continuar.'
      });
      return;
    }

    this.salvandoCadastroRapido = true;
    const tipoProfissional = this.cadastroRapidoProfissionalAtual?.tipoProfissional?.value;
    this.profissionalService.cadastroRapido({
      nome: this.cadastroRapidoNome.trim(),
      telefone,
      tipoProfissional
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.salvandoCadastroRapido = false))
      )
      .subscribe({
        next: (profissional) => {
          if (this.cadastroRapidoProfissionalAtual) {
            this.aplicarProfissionalNoFormulario(this.cadastroRapidoProfissionalAtual, profissional);
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Profissional vinculado!',
            detail: `${profissional.nome} foi localizado ou cadastrado com sucesso.`
          });
          this.fecharCadastroRapido(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: err?.error?.message || 'Não foi possível realizar o cadastro rápido do profissional.'
          });
        }
      });
  }

  private aplicarProfissionalNoFormulario(profForm: ProfissionalForm, profissional: ProfissionalDTO): void {
    const tipoProfissional = profForm.obrigatorio
      ? profForm.tipoProfissional?.value || null
      : profissional.tipoProfissional || profForm.tipoProfissional?.value || null;

    profForm.profissional = profissional;
    profForm.profissionalId = profissional.id;
    profForm.profissionalTelefoneBusca = this.normalizarTelefone(profissional.telefone);
    profForm.corretorNomeManual = profissional.nome || '';
    profForm.corretorCpfManual = (profissional.cpf || '').replace(/\D/g, '');
    profForm.corretorCpfBusca = (profissional.cpf || '').replace(/\D/g, '');
    profForm.corretorNaoEncontrado = false;

    if (tipoProfissional) {
      profForm.tipoProfissional = this.tiposProfissionalOptions.find(o => o.value === tipoProfissional) || profForm.tipoProfissional;
    }
  }

  private normalizarTelefone(telefone: string): string {
    return this.telefoneUtilsService.removerDDI(telefone || '').replace(/\D/g, '');
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

  // ─── Excluir ──────────────────────────────────────────────────────────────

  excluir(): void {
    if (this.modoVisualizacao) {
      return;
    }

    this.confirmationService.confirm({
      message: `Deseja excluir a reserva do bloco ${this.bloco}, unidade ${this.unidade}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.reservaService.excluir(this.reservaId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Excluída',
              detail: 'Reserva excluída com sucesso.'
            });
            this.router.navigate(['/empreendimentos', this.codEmpreendimento, 'unidades'], {
              state: { nomeEmpreendimento: this.nomeEmpreendimento }
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível excluir a reserva.'
            });
          }
        });
      }
    });
  }

  // ─── Validação e Salvamento ───────────────────────────────────────────────

  protected getCamposObrigatorios() {
    const campos = [
      { id: 'cpfCnpjCliente', valor: this.cpfCnpjCliente, label: 'CPF / CNPJ do Cliente' },
      { id: 'nomeCliente', valor: this.nomeCliente, label: 'Nome do Cliente' },
      { id: 'imobiliariaPrincipal', valor: this.imobiliariaPrincipalSelecionada, label: 'Imobiliária Principal' },
      { id: 'dataReserva', valor: this.dataReserva, label: 'Data da Reserva' }
    ];

    if (this.clienteEstrangeiro) {
      campos[0] = { id: 'passaporteCliente', valor: this.passaporteCliente, label: 'Passaporte do Cliente' };
    }

    if (this.imobiliariaSecundariaSelecionada) {
      campos.push({
        id: 'tipoRelacionamentoSecundaria',
        valor: this.tipoRelacionamentoSecundariaSelecionado?.value || '',
        label: 'Relacionamento da Imobiliária Secundária'
      });
    }

    return campos;
  }

  salvar(): void {
    if (this.modoVisualizacao) {
      return;
    }

    if (!this.validarFormulario()) return;
    if (!this.validarDatas()) return;
    if (!this.validarContatosTelefoneWhatsapp()) return;
    if (!this.validarProfissionaisObrigatorios()) return;

    this.appConfirmationService.confirmSave()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }
        this.executarSalvar();
      });
  }

  private validarProfissionaisObrigatorios(): boolean {
    if (this.clienteEstrangeiro) {
      this.cpfCnpjCliente = '';
      if (!this.passaporteCliente?.trim()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Passaporte obrigatório',
          detail: 'Para cliente estrangeiro, informe o passaporte.'
        });
        return false;
      }
    } else {
      this.passaporteCliente = '';
      if (!this.cpfCnpjCliente?.trim()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'CPF/CNPJ obrigatório',
          detail: 'Para cliente brasileiro, informe CPF/CNPJ.'
        });
        return false;
      }
    }

    if (!this.profissionaisPrincipal.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional obrigatório',
        detail: 'Informe pelo menos um profissional na Imobiliária Principal.'
      });
      return false;
    }

    if (!this.validarTiposProfissionaisObrigatorios(this.profissionaisPrincipal, 'principal')) {
      return false;
    }

    for (let i = 0; i < this.profissionaisPrincipal.length; i++) {
      if (!this.validarLinhaProfissional(this.profissionaisPrincipal[i], i, 'principal')) {
        return false;
      }
    }

    if (this.imobiliariaSecundariaSelecionada) {
      if (!this.profissionaisSecundaria.length) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Profissional obrigatório',
          detail: 'Informe pelo menos um profissional na Imobiliária Secundária.'
        });
        return false;
      }

      for (let i = 0; i < this.profissionaisSecundaria.length; i++) {
        if (!this.validarLinhaProfissional(this.profissionaisSecundaria[i], i, 'secundaria')) {
          return false;
        }
      }
    }

    return true;
  }

  private validarTiposProfissionaisObrigatorios(
    profissionais: ProfissionalForm[],
    tipo: 'principal' | 'secundaria'
  ): boolean {
    const faltantes = this.getTiposProfissionaisObrigatorios().filter(tipoObrigatorio =>
      !profissionais.some(prof => prof.tipoProfissional?.value === tipoObrigatorio)
    );

    if (!faltantes.length) {
      return true;
    }

    const contexto = tipo === 'principal' ? 'Principal' : 'Secundária';
    const nomes = faltantes
      .map(tipoObrigatorio => TIPO_PROFISSIONAL_LABELS[tipoObrigatorio])
      .join(', ');

    this.messageService.add({
      severity: 'warn',
      summary: 'Profissionais obrigatórios',
      detail: `Informe todos os profissionais obrigatórios da Imobiliária ${contexto}: ${nomes}.`
    });

    return false;
  }

  consultarClienteTotvs(exibirMensagemSucesso: boolean = true, aoFinalizar?: () => void): void {
    if (!this.deveSincronizarClienteTotvs()) {
      aoFinalizar?.();
      return;
    }

    const documento = this.documentoClienteAtualLimpo;
    if (documento === this.ultimoDocumentoConsultadoTotvs && this.clienteTotvsValidado) {
      aoFinalizar?.();
      return;
    }

    this.consultandoClienteTotvs = true;
    this.ultimoDocumentoConsultadoTotvs = documento;
    const deveExibirLoadingGlobal = !this.loadingService.isLoading;
    if (deveExibirLoadingGlobal) {
      this.loadingService.show('Consultando cliente...');
    }

    this.clienteTotvsService.consultarPorDocumento(documento, 0, this.clienteEstrangeiro)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.consultandoClienteTotvs = false;
          if (deveExibirLoadingGlobal) {
            this.loadingService.hide();
          }
        })
      )
      .subscribe({
        next: (response) => {
          this.processarRetornoClienteTotvs(response, exibirMensagemSucesso);
          aoFinalizar?.();
        },
        error: (error) => {
          this.tratarFalhaClienteTotvs(error);
          aoFinalizar?.();
        }
      });
  }

  private validarLinhaProfissional(
    prof: ProfissionalForm,
    index: number,
    tipo: 'principal' | 'secundaria'
  ): boolean {
    const sufixo = tipo === 'principal' ? 'Principal' : 'Secundária';
    const idTipo = tipo === 'principal' ? `tipoProfissionalPrincipal_${index}` : `tipoProfissionalSecundaria_${index}`;
    const idTelefone = tipo === 'principal' ? `telefoneProfissionalPrincipal_${index}` : `telefoneProfissionalSecundaria_${index}`;
    const idNome = tipo === 'principal' ? `nomeProfissionalPrincipal_${index}` : `nomeProfissionalSecundaria_${index}`;

    if (!prof.tipoProfissional) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional incompleto',
        detail: `Selecione o tipo do profissional (${sufixo}) na linha ${index + 1}.`
      });
      this.focarCampo(idTipo);
      return false;
    }

    const isCorretor = prof.tipoProfissional.value === TipoProfissional.CORRETOR;
    const nomeManual = (prof.corretorNomeManual || '').trim();
    const profissionalId = prof.profissionalId || prof.profissional?.id || null;

    if (!nomeManual) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional incompleto',
        detail: `Informe o nome do profissional (${sufixo}) na linha ${index + 1}.`
      });
      this.focarCampo(idNome);
      return false;
    }

    if (isCorretor && !profissionalId) {
      const telefone = this.normalizarTelefone(prof.profissionalTelefoneBusca);
      const cpf = (prof.corretorCpfManual || prof.corretorCpfBusca || '').replace(/\D/g, '');

      if (!telefone) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Profissional incompleto',
          detail: `Informe o telefone ou WhatsApp do corretor (${sufixo}) na linha ${index + 1}.`
        });
        this.focarCampo(idTelefone);
        return false;
      }

      if (!cpf) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Profissional incompleto',
          detail: `Localize ou cadastre o corretor pelo WhatsApp (${sufixo}) na linha ${index + 1} antes de salvar.`
        });
        this.focarCampo(idTelefone);
        return false;
      }

      if (!this.validarCPF(cpf)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'CPF inválido',
          detail: `O cadastro histórico do corretor (${sufixo}) está inconsistente na linha ${index + 1}. Localize ou cadastre o profissional novamente pelo WhatsApp.`
        });
        this.focarCampo(idTelefone);
        return false;
      }
    }

    return true;
  }

  private validarContatosTelefoneWhatsapp(): boolean {
    const validarContato = (contato: string, fieldId: string, contexto: string): boolean => {
      const numeros = (contato || '').replace(/\D/g, '');
      if (!numeros) {
        return true;
      }

      if (numeros.length < 10 || numeros.length > 11) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Contato inválido',
          detail: `${contexto}: informe um telefone/WhatsApp válido com DDD.`
        });
        this.focarCampo(fieldId);
        return false;
      }

      return true;
    };

    if (this.isContatoTelefoneOuWhatsapp(this.tipoContatoPrincipalSelecionado?.value)) {
      if (!validarContato(this.contatoPrincipal, 'contatoPrincipal', 'Contato da Imobiliária Principal')) {
        return false;
      }
    }

    if (this.imobiliariaSecundariaSelecionada && this.isContatoTelefoneOuWhatsapp(this.tipoContatoSecundarioSelecionado?.value)) {
      if (!validarContato(this.contatoSecundario, 'contatoSecundario', 'Contato da Imobiliária Secundária')) {
        return false;
      }
    }

    return true;
  }

  private deveSincronizarClienteTotvs(): boolean {
    if (this.clienteEstrangeiro) {
      return !!this.documentoClienteAtualLimpo;
    }

    return this.documentoClienteAtualLimpo.length === 11 || this.documentoClienteAtualLimpo.length === 14;
  }

  onCpfCnpjClienteChange(valor: string): void {
    const documento = this.clienteTotvsService.normalizarDocumentoConsulta(valor, this.clienteEstrangeiro);

    if (documento === this.documentoClienteTotvs || documento === this.ultimoDocumentoConsultadoTotvs) {
      return;
    }

    this.limparInformacoesClienteTotvs(true);
  }

  onCpfCnpjClienteBlur(): void {
    if (!this.deveSincronizarClienteTotvs()) {
      return;
    }

    this.consultarClienteTotvs();
  }

  private processarRetornoClienteTotvs(response: any, exibirMensagemSucesso: boolean): void {
    if (!response?.sucesso) {
      this.fecharCadastroClienteTotvs();
      this.clienteTotvsValidado = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Falha ao integrar cliente',
        detail: this.clienteTotvsService.obterMensagemErro(
          { error: response },
          this.clienteEstrangeiro
            ? 'Não foi possível consultar o cliente no TOTVS. A reserva continuará com o passaporte informado.'
            : 'Não foi possível consultar o cliente no TOTVS. A reserva continuará com o CPF/CNPJ informado.'
        )
      });
      return;
    }

    if (!response.encontrado) {
      this.clienteTotvsValidado = false;
      if (this.clienteEstrangeiro) {
        this.fecharCadastroClienteTotvs();
        if (exibirMensagemSucesso) {
          this.messageService.add({
            severity: 'info',
            summary: 'Cliente não encontrado',
            detail: response.mensagem || 'Cliente estrangeiro não encontrado no TOTVS pelo passaporte informado.'
          });
        }
        return;
      }

      this.abrirCadastroClienteTotvs();
      if (exibirMensagemSucesso) {
        this.messageService.add({
          severity: 'info',
          summary: 'Cliente não encontrado',
          detail: response.mensagem || 'Cliente não encontrado no TOTVS. Complete o cadastro no modal para continuar.'
        });
      }
      return;
    }

    const codigoCliente = response.codigoCliente || null;

    this.fecharCadastroClienteTotvs();
    if (response.dados?.nome) {
      this.nomeCliente = response.dados.nome;
    }

    if (!codigoCliente) {
      this.clienteTotvsValidado = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Cliente sem código TOTVS',
        detail: 'O TOTVS processou a solicitação sem retornar código do cliente. A reserva continuará com o CPF/CNPJ informado.'
      });
      return;
    }

    const mensagem = response.mensagem || 'Cliente localizado no TOTVS.';

    this.registrarClienteTotvs(codigoCliente, mensagem);
    this.clienteTotvsValidado = true;

    if (!exibirMensagemSucesso) {
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Cliente localizado',
      detail: `${mensagem} Código: ${codigoCliente}`
    });
  }

  private tratarFalhaClienteTotvs(error: any): void {
    this.fecharCadastroClienteTotvs();
    this.clienteTotvsValidado = false;
    this.messageService.add({
      severity: 'warn',
      summary: 'Integração com TOTVS indisponível',
      detail: this.clienteTotvsService.obterMensagemErro(
        error,
        this.clienteEstrangeiro
          ? 'Não foi possível consultar o cliente no TOTVS. A reserva continuará com o passaporte informado.'
          : 'Não foi possível consultar o cliente no TOTVS. A reserva continuará com o CPF/CNPJ informado.'
      )
    });
  }

  abrirCadastroClienteTotvs(): void {
    this.cadastroClienteTotvsCpfCnpj = this.clienteEstrangeiro ? this.passaporteCliente : this.cpfCnpjCliente;
    this.cadastroClienteTotvsNome = this.nomeCliente;
    this.limparNomeAoFecharCadastroClienteTotvs = false;
    this.displayCadastroClienteTotvs = true;
  }

  fecharCadastroClienteTotvs(limparNomeCliente: boolean = false): void {
    this.limparNomeAoFecharCadastroClienteTotvs = limparNomeCliente;
    this.displayCadastroClienteTotvs = false;
    this.resetarCadastroClienteTotvs();
  }

  onCadastroClienteTotvsHide(): void {
    this.resetarCadastroClienteTotvs();
  }

  private resetarCadastroClienteTotvs(): void {
    this.salvandoCadastroClienteTotvs = false;
    this.cadastroClienteTotvsCpfCnpj = '';
    this.cadastroClienteTotvsNome = '';

    if (this.limparNomeAoFecharCadastroClienteTotvs) {
      this.nomeCliente = '';
    }

    this.limparNomeAoFecharCadastroClienteTotvs = false;
  }

  cadastrarClienteTotvsBasico(): void {
    if (!this.documentoClienteAtualLimpo) {
      this.messageService.add({
        severity: 'warn',
        summary: this.clienteEstrangeiro ? 'Passaporte obrigatório' : 'CPF/CNPJ obrigatório',
        detail: this.clienteEstrangeiro
          ? 'Informe o passaporte antes de cadastrar o cliente no TOTVS.'
          : 'Informe o CPF/CNPJ antes de cadastrar o cliente no TOTVS.'
      });
      return;
    }

    if (!this.cadastroClienteTotvsNome.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nome obrigatório',
        detail: 'Informe o nome do cliente para concluir o cadastro no TOTVS.'
      });
      return;
    }

    this.salvandoCadastroClienteTotvs = true;

    this.clienteTotvsService.cadastrarBasico(
      this.clienteTotvsService.criarPayloadCadastroBasico(
        this.cadastroClienteTotvsNome,
        this.cadastroClienteTotvsCpfCnpj,
        this.clienteEstrangeiro
      )
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.salvandoCadastroClienteTotvs = false)
      )
      .subscribe({
        next: (response) => {
          if (!response?.sucesso || !response.codigoCliente) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro no cadastro',
              detail: this.clienteTotvsService.obterMensagemErro(
                { error: response },
                'Não foi possível cadastrar o cliente no TOTVS.'
              )
            });
            return;
          }

          this.nomeCliente = this.cadastroClienteTotvsNome.trim();
          this.registrarClienteTotvs(response.codigoCliente, response.mensagem || 'Cliente cadastrado com sucesso no TOTVS.');
          this.clienteTotvsValidado = true;
          this.fecharCadastroClienteTotvs();
          this.messageService.add({
            severity: 'success',
            summary: 'Cliente cadastrado',
            detail: `${response.mensagem || 'Cliente cadastrado com sucesso.'} Código: ${response.codigoCliente}`
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro no cadastro',
            detail: this.clienteTotvsService.obterMensagemErro(
              error,
              'Não foi possível cadastrar o cliente no TOTVS.'
            )
          });
        }
      });
  }

  private registrarClienteTotvs(codigoCliente?: string | null, mensagem: string = ''): void {
    this.codigoClienteTotvs = codigoCliente || null;
    this.mensagemClienteTotvs = mensagem;
    this.documentoClienteTotvs = this.documentoClienteAtualLimpo;
  }

  private limparInformacoesClienteTotvs(limparNomeCliente: boolean = false): void {
    this.codigoClienteTotvs = null;
    this.mensagemClienteTotvs = '';
    this.documentoClienteTotvs = '';
    this.clienteTotvsValidado = false;
    this.ultimoDocumentoConsultadoTotvs = '';
    this.displayCadastroClienteTotvs = false;
    this.limparNomeAoFecharCadastroClienteTotvs = limparNomeCliente;
    this.resetarCadastroClienteTotvs();
  }

  /**
   * Valida se a data da reserva não é maior que a data da venda
   */
  private validarDatas(): boolean {
    if (this.dataReserva && this.dataVenda) {
      const dataReservaTime = new Date(this.dataReserva).setHours(0, 0, 0, 0);
      const dataVendaTime = new Date(this.dataVenda).setHours(0, 0, 0, 0);
      
      if (dataReservaTime > dataVendaTime) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Data inválida',
          detail: 'A Data da Reserva não pode ser maior que a Data da Venda.'
        });
        this.focarCampo('dataReservaField');
        return false;
      }
    }
    return true;
  }

  private executarSalvar(): void {
    if (this.salvando) {
      return;
    }

    this.salvando = true;
    this.loadingService.show('Salvando reserva...');

    const payload = this.montarPayload();

    this.reservaService.atualizar(this.reservaId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.salvando = false;
          this.loadingService.hide();
        })
      )
      .subscribe({
        next: () => {
          // Libera o bloqueio após salvar com sucesso
          this.liberarBloqueio();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Atualizado!',
            detail: 'Reserva atualizada com sucesso.'
          });
          this.router.navigate(['/empreendimentos', this.codEmpreendimento, 'unidades'], {
            state: {
              nomeEmpreendimento: this.nomeEmpreendimento,
              preco: this.precoUnidade
            }
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: err?.error?.message || 'Não foi possível atualizar a reserva.'
          });
        }
      });
  }

  private montarProfissionaisPayload(
    profs: ProfissionalForm[],
    imobiliaria: Imobiliaria | null
  ): Omit<ProfissionalReservaDTO, 'id'>[] {
    return profs
      .filter(p => {
        // Valida se tem tipo preenchido
        if (p.tipoProfissional === null) {
          return false;
        }

        return !!(p.corretorNomeManual || p.profissionalId || p.profissional?.id);
      })
      .map(p => {
        const isCorretor = p.tipoProfissional!.value === TipoProfissional.CORRETOR;
        const profissionalId = p.profissionalId || p.profissional?.id || null;
        const nomeCorretor = (p.profissional?.nome || p.corretorNomeManual || '').trim();
        
        if (isCorretor) {
          const cpfCorretor = (p.profissional?.cpf || p.corretorCpfManual || p.corretorCpfBusca || '').replace(/\D/g, '');

          return {
            tipoProfissional: p.tipoProfissional!.value,
            profissionalId,
            corretorId: p.corretorId || null,
            cpfCorretor: cpfCorretor || null,
            nomeCorretor
          };
        } else {
          return {
            tipoProfissional: p.tipoProfissional!.value,
            profissionalId,
            corretorId: null,
            cpfCorretor: null,
            nomeCorretor
          };
        }
      });
  }

  private montarPayload(): ReservaCreateDTO {
    // Converte StatusReserva (enum) para código numérico
    const codigoStatus = this.statusSelecionado?.value 
      ? statusReservaToCodigo(this.statusSelecionado.value)
      : 200; // Default: Reservado para Venda

    return {
      codEmpreendimento: this.codEmpreendimento,
      codColigadaEmpreendimento: this.codColigadaEmpreendimento,
      nomeEmpreendimento: this.nomeEmpreendimento,
      bloco: this.bloco,
      unidade: this.unidade,
      tipoUnidade: this.tipoUnidade,
      tipologia: this.tipologia,
      codigoStatus: codigoStatus,
      cpfCnpjCliente: this.clienteEstrangeiro ? null : this.cpfCnpjCliente,
      codigoClienteTotvs: this.codigoClienteTotvs || null,
      passaporteCliente: this.clienteEstrangeiro ? this.passaporteCliente : null,
      imobiliariaPrincipalId: this.imobiliariaPrincipalSelecionada!.id,
      nomeImobiliariaPrincipal: this.getNomeImobiliaria(this.imobiliariaPrincipalSelecionada!),
      tipoContatoPrincipal: this.tipoContatoPrincipalSelecionado?.value,
      contatoPrincipal: this.contatoPrincipal || undefined,
      profissionaisPrincipal: this.montarProfissionaisPayload(
        this.profissionaisPrincipal,
        this.imobiliariaPrincipalSelecionada
      ),
      imobiliariaSecundariaId: this.imobiliariaSecundariaSelecionada?.id || null,
      nomeImobiliariaSecundaria: this.imobiliariaSecundariaSelecionada ? this.getNomeImobiliaria(this.imobiliariaSecundariaSelecionada) : null,
      tipoRelacionamentoSecundaria: this.imobiliariaSecundariaSelecionada
        ? (this.tipoRelacionamentoSecundariaSelecionado?.value || null)
        : null,
      tipoContatoSecundario: this.tipoContatoSecundarioSelecionado?.value || null,
      contatoSecundario: this.contatoSecundario || null,
      profissionaisSecundaria: this.imobiliariaSecundariaSelecionada
        ? this.montarProfissionaisPayload(this.profissionaisSecundaria, this.imobiliariaSecundariaSelecionada)
        : [],
      nomeCliente: this.nomeCliente,
      clienteEstrangeiro: this.clienteEstrangeiro,
      formaPagamento: this.formaPagamento?.value || undefined,
      dataReserva: this.dataReserva ? this.dataReserva.toISOString() : new Date().toISOString(),
      dataVenda: this.dataVenda ? this.dataVenda.toISOString() : null,
      observacoes: this.observacoes || undefined
    };
  }

  limparTela(): void {
    if (this.modoVisualizacao) {
      return;
    }

    if (!this.reservaOriginal) {
      return;
    }

    this.preencherFormulario(this.reservaOriginal);
    this.fecharCadastroClienteTotvs();
    this.resetarFormulario();

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  voltar(): void {
    // Libera o bloqueio antes de sair
    this.liberarBloqueio();

    const state = window.history.state;
    if (state?.fromList) {
      this.router.navigate(['/reservas']);
      return;
    }
    
    if (this.codEmpreendimento) {
      this.router.navigate(
        ['/empreendimentos', this.codEmpreendimento, 'unidades'],
        { state: { nomeEmpreendimento: this.nomeEmpreendimento } }
      );
    } else {
      this.router.navigate(['/reservas']);
    }
  }

  /**
   * Tratamento de timeout do countdown timer
   * Volta para a tela anterior descartando todas as alterações
   */
  handleTimeout(): void {
    // Libera o bloqueio quando o tempo esgotar
    this.liberarBloqueio();
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Tempo Esgotado',
      detail: 'O tempo para finalizar a edição acabou. Retornando à tela anterior.',
      life: 5000
    });
    
    // Descarta dados e volta
    setTimeout(() => {
      this.voltar();
    }, 1000);
  }

  temPermissaoExcluir(): boolean {
    return !this.modoVisualizacao && this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.EXCLUIR);
  }

  temPermissaoAlterar(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.ALTERAR);
  }

  formatarPreco(preco: number | null): string {
    if (!preco) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }
}
