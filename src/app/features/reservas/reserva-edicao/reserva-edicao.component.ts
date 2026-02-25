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
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { CorretorService } from '../../../core/services/corretor.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ReservaBloqueioService } from '../../../core/services/reserva-bloqueio.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
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
import { CorretorSaidaDTO } from '../../../core/models/corretor.model';
import { CodigoStatusUnidade } from '../../../core/models/unidade.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

interface ProfissionalForm {
  tipoProfissional: { label: string; value: TipoProfissional } | null;
  corretor: CorretorSaidaDTO | null;
  corretorCpfBusca: string;
  corretorNomeManual: string;
  corretorCpfManual: string;
  corretorBuscando: boolean;
  ultimoCpfBuscado: string;
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

  // ─── Cadastro rápido de corretor ──────────────────────────────────────────
  displayCadastroRapido = false;
  cadastroRapidoCpf = '';
  cadastroRapidoNome = '';
  cadastroRapidoEmail = '';
  cadastroRapidoTelefone = '';
  salvandoCadastroRapido = false;
  cpfCadastroRapidoJaCadastrado = false;
  cpfCadastroRapidoInvalido = false;
  validandoCpfCadastroRapido = false;
  mensagemValidacaoCpfCadastroRapido = '';
  cpfCadastroRapidoPodeCadastrar = false;
  camposCadastroRapidoHabilitados = false;
  private ultimoCpfValidadoCadastroRapido = '';

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
    private imobiliariaService: ImobiliariaService,
    private corretorService: CorretorService,
    private usuarioService: UsuarioService,
    private permissaoService: PermissaoService,
    private authorizationService: AuthorizationService,
    private confirmationService: PrimeConfirmationService,
    private appConfirmationService: AppConfirmationService,
    private messageService: MessageService,
    private reservaBloqueioService: ReservaBloqueioService,
    private loadingService: LoadingService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.ALTERAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const state = window.history.state;
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
      corretor: null,
      corretorCpfBusca: p.cpfCorretor || '',
      corretorNomeManual: p.nomeCorretor,
      corretorCpfManual: p.cpfCorretor || '',
      corretorBuscando: false,
      ultimoCpfBuscado: p.cpfCorretor || '',
      corretorNaoEncontrado: false
    }));

    if (this.profissionaisPrincipal.length === 0) {
      this.adicionarProfissional('principal');
    }

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
        corretor: null,
        corretorCpfBusca: p.cpfCorretor || '',
        corretorNomeManual: p.nomeCorretor,
        corretorCpfManual: p.cpfCorretor || '',
        corretorBuscando: false,
        ultimoCpfBuscado: p.cpfCorretor || '',
        corretorNaoEncontrado: false
      }));
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
    return !this.podeBloquerarUnidade;
  }

  /**
   * Verifica se o campo status deve estar desabilitado
   * Não-admin NUNCA pode alterar o status da reserva
   */
  get statusDesabilitado(): boolean {
    return !this.isAdmin;
  }

  /**
   * Verifica se o botão salvar deve estar desabilitado
   * Admin pode salvar mesmo quando status ≠ 100
   */
  get salvarDesabilitado(): boolean {
    return this.camposDesabilitados && !this.isAdmin;
  }

  /**
   * Verifica se o campo data da venda deve estar desabilitado
   * Admin pode editar mesmo quando status ≠ 100
   */
  get dataVendaDesabilitada(): boolean {
    return this.camposDesabilitados && !this.isAdmin;
  }

  /**
   * Verifica se o campo observações deve estar desabilitado
   * Admin pode editar mesmo quando status ≠ 100
   */
  get observacoesDesabilitadas(): boolean {
    return this.camposDesabilitados && !this.isAdmin;
  }

  /**
   * Verifica se deve mostrar os botões de ação (Limpar e Salvar)
   * - Status 100: TODOS os perfis veem os botões
   * - Status ≠ 100: apenas ADMIN vê os botões, demais veem só Cancelar
   */
  get mostrarBotoesAcao(): boolean {
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

  adicionarProfissional(tipo: 'principal' | 'secundaria'): void {
    const novo: ProfissionalForm = {
      tipoProfissional: null, // Usuário deve selecionar o tipo
      corretor: null,
      corretorCpfBusca: '',
      corretorNomeManual: '',
      corretorCpfManual: '',
      corretorBuscando: false,
      ultimoCpfBuscado: '',
      corretorNaoEncontrado: false
    };
    if (tipo === 'principal') {
      this.profissionaisPrincipal.push(novo);
    } else {
      this.profissionaisSecundaria.push(novo);
    }
  }

  removerProfissional(index: number, tipo: 'principal' | 'secundaria'): void {
    if (tipo === 'principal') {
      this.profissionaisPrincipal.splice(index, 1);
    } else {
      this.profissionaisSecundaria.splice(index, 1);
    }
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
    // Limpa todos os campos quando mudar o tipo
    prof.corretor = null;
    prof.corretorCpfBusca = '';
    prof.corretorNomeManual = '';
    prof.corretorCpfManual = '';
    prof.corretorBuscando = false;
    prof.ultimoCpfBuscado = '';
    prof.corretorNaoEncontrado = false;
  }

  buscarCorretorPorCpf(profForm: ProfissionalForm, opcoes?: { silencioso?: boolean; forcar?: boolean }): void {
    const silencioso = !!opcoes?.silencioso;
    const forcar = !!opcoes?.forcar;
    const cpf = (profForm.corretorCpfBusca || '').replace(/\D/g, '');

    if (cpf.length !== 11) {
      profForm.corretorNaoEncontrado = false;
      if (!silencioso) {
        this.messageService.add({
          severity: 'warn',
          summary: 'CPF inválido',
          detail: 'Informe um CPF válido com 11 dígitos para buscar o corretor.'
        });
      }
      return;
    }

    if (!this.validarCPF(cpf)) {
      profForm.corretorNaoEncontrado = false;
      if (!silencioso) {
        this.messageService.add({
          severity: 'warn',
          summary: 'CPF inválido',
          detail: 'Informe um CPF válido para buscar o corretor.'
        });
      }
      return;
    }

    if (!forcar && cpf === profForm.ultimoCpfBuscado) {
      return;
    }

    profForm.ultimoCpfBuscado = cpf;
    profForm.corretorBuscando = true;
    this.corretorService.buscarPorCpfReserva(cpf)
      .pipe(finalize(() => (profForm.corretorBuscando = false)))
      .subscribe({
        next: (corretor) => {
          profForm.corretor = corretor;
          profForm.corretorNomeManual = corretor?.nome || '';
          profForm.corretorCpfManual = corretor?.cpf || '';
          profForm.corretorCpfBusca = corretor?.cpf || cpf;
          profForm.corretorNaoEncontrado = false;
        },
        error: (err) => {
          profForm.corretor = null;
          if (err?.status === 404) {
            profForm.corretorNaoEncontrado = true;
            if (!silencioso) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Corretor não encontrado',
                detail: 'Corretor não encontrado para o CPF informado. Você pode usar o cadastro rápido.'
              });
              this.abrirCadastroRapidoComCpf(cpf);
            }
            return;
          }

          profForm.corretorNaoEncontrado = false;

          if (!silencioso) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro na busca',
              detail: err?.error?.message || 'Não foi possível buscar o corretor por CPF.'
            });
          }
        }
      });
  }

  onCpfCorretorAlterado(profForm: ProfissionalForm): void {
    this.limparCorretorSelecionado(profForm);
    const cpf = (profForm.corretorCpfBusca || '').replace(/\D/g, '');

    if (cpf.length < 11) {
      profForm.ultimoCpfBuscado = '';
    }
  }

  onCpfCorretorBlur(profForm: ProfissionalForm): void {
    this.buscarCorretorPorCpf(profForm, { silencioso: true });
  }

  limparCorretorSelecionado(profForm: ProfissionalForm): void {
    profForm.corretor = null;
    profForm.corretorNomeManual = '';
    profForm.corretorCpfManual = '';
    profForm.corretorNaoEncontrado = false;
  }

  abrirCadastroRapidoComCpf(cpf: string): void {
    this.abrirCadastroRapido();
    this.cadastroRapidoCpf = cpf;
    this.onCadastroRapidoCpfChange();
  }

  // ─── Autocomplete Imobiliária ─────────────────────────────────────────────

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

  abrirCadastroRapido(): void {
    this.cadastroRapidoCpf = '';
    this.cadastroRapidoNome = '';
    this.cadastroRapidoEmail = '';
    this.cadastroRapidoTelefone = '';
    this.limparEstadoValidacaoCpfCadastroRapido();
    this.displayCadastroRapido = true;
  }

  onCadastroRapidoCpfChange(): void {
    const cpfLimpo = (this.cadastroRapidoCpf || '').replace(/\D/g, '');

    this.cpfCadastroRapidoJaCadastrado = false;
    this.cpfCadastroRapidoInvalido = false;
    this.cpfCadastroRapidoPodeCadastrar = false;
    this.camposCadastroRapidoHabilitados = false;
    this.validandoCpfCadastroRapido = false;
    this.mensagemValidacaoCpfCadastroRapido = '';

    if (!cpfLimpo) {
      this.ultimoCpfValidadoCadastroRapido = '';
      return;
    }

    if (cpfLimpo.length < 11) {
      this.ultimoCpfValidadoCadastroRapido = '';
      return;
    }

    if (!this.validarCPF(cpfLimpo)) {
      this.cpfCadastroRapidoInvalido = true;
      this.mensagemValidacaoCpfCadastroRapido = 'CPF inválido. Verifique o número digitado.';
      this.camposCadastroRapidoHabilitados = false;
      return;
    }

    if (this.ultimoCpfValidadoCadastroRapido === cpfLimpo) {
      return;
    }

    this.validarCpfCadastroRapidoNoBackend(cpfLimpo);
  }

  private validarCpfCadastroRapidoNoBackend(cpfLimpo: string): void {
    this.validandoCpfCadastroRapido = true;
    this.mensagemValidacaoCpfCadastroRapido = '';
    this.ultimoCpfValidadoCadastroRapido = cpfLimpo;

    this.usuarioService.validarCpf(this.formatarCpf(cpfLimpo))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.validandoCpfCadastroRapido = false))
      )
      .subscribe({
        next: (response) => {
          this.cpfCadastroRapidoJaCadastrado = response.cpfCadastrado;
          this.cpfCadastroRapidoInvalido = false;
          this.cpfCadastroRapidoPodeCadastrar = !response.cpfCadastrado;
          this.camposCadastroRapidoHabilitados = !response.cpfCadastrado;
          this.mensagemValidacaoCpfCadastroRapido = this.normalizarMensagemValidacaoCpfCadastroRapido(response.mensagem || '');
        },
        error: (error) => {
          this.cpfCadastroRapidoPodeCadastrar = false;
          this.cpfCadastroRapidoJaCadastrado = false;
          this.camposCadastroRapidoHabilitados = false;
          this.cpfCadastroRapidoInvalido = error?.status === 400;
          this.mensagemValidacaoCpfCadastroRapido =
            error?.status === 400
              ? 'CPF inválido. Verifique o número digitado.'
              : 'Erro ao validar CPF. Tente novamente.';
        }
      });
  }

  private formatarCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private limparEstadoValidacaoCpfCadastroRapido(): void {
    this.cpfCadastroRapidoJaCadastrado = false;
    this.cpfCadastroRapidoInvalido = false;
    this.validandoCpfCadastroRapido = false;
    this.cpfCadastroRapidoPodeCadastrar = false;
    this.camposCadastroRapidoHabilitados = false;
    this.mensagemValidacaoCpfCadastroRapido = '';
    this.ultimoCpfValidadoCadastroRapido = '';
  }

  private normalizarMensagemValidacaoCpfCadastroRapido(mensagem: string): string {
    return (mensagem || '')
      .replace(/\s*Utilize a opção\s*['“”\"]?Esqueci minha senha['“”\"]?\s*para recuperar o acesso\.?/gi, '')
      .trim();
  }

  salvarCadastroRapido(): void {
    if (!this.cadastroRapidoCpf || !this.cadastroRapidoNome) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'CPF e Nome são obrigatórios.'
      });
      return;
    }

    // Validação de CPF
    const cpfLimpo = this.cadastroRapidoCpf.replace(/\D/g, '');
    if (!this.validarCPF(cpfLimpo)) {
      this.messageService.add({
        severity: 'error',
        summary: 'CPF inválido',
        detail: 'Por favor, informe um CPF válido.'
      });
      return;
    }

    if (this.cpfCadastroRapidoJaCadastrado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Este CPF já está cadastrado no sistema.'
      });
      return;
    }

    if (this.cpfCadastroRapidoInvalido || !this.cpfCadastroRapidoPodeCadastrar) {
      this.messageService.add({
        severity: 'warn',
        summary: 'CPF inválido',
        detail: 'Informe um CPF válido para continuar o cadastro rápido.'
      });
      return;
    }

    this.salvandoCadastroRapido = true;
    this.corretorService.cadastroRapido({
      cpf: this.cadastroRapidoCpf.replace(/\D/g, ''),
      nome: this.cadastroRapidoNome,
      email: this.cadastroRapidoEmail,
      telefone: this.cadastroRapidoTelefone
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.salvandoCadastroRapido = false))
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cadastrado!',
            detail: `${this.cadastroRapidoNome} foi cadastrado com sucesso.`
          });
          this.displayCadastroRapido = false;
        },
        error: (err) => {
          const msg = err?.error?.message || '';
          if (msg.toLowerCase().includes('cpf') || msg.toLowerCase().includes('já cadastrado')) {
            this.cpfCadastroRapidoJaCadastrado = true;
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível realizar o cadastro rápido.'
            });
          }
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

  // ─── Excluir ──────────────────────────────────────────────────────────────

  excluir(): void {
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

  private validarLinhaProfissional(
    prof: ProfissionalForm,
    index: number,
    tipo: 'principal' | 'secundaria'
  ): boolean {
    const sufixo = tipo === 'principal' ? 'Principal' : 'Secundária';
    const idTipo = tipo === 'principal' ? `tipoProfissionalPrincipal_${index}` : `tipoProfissionalSecundaria_${index}`;
    const idCpf = tipo === 'principal' ? `cpfCorretorPrincipal_${index}` : `cpfCorretorSecundaria_${index}`;
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

    if (isCorretor) {
      const cpf = (prof.corretor?.cpf || prof.corretorCpfManual || prof.corretorCpfBusca || '').replace(/\D/g, '');
      if (!cpf) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Profissional incompleto',
          detail: `Informe o CPF do corretor (${sufixo}) na linha ${index + 1}.`
        });
        this.focarCampo(idCpf);
        return false;
      }

      if (!this.validarCPF(cpf)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'CPF inválido',
          detail: `Corrija o CPF do corretor (${sufixo}) na linha ${index + 1}.`
        });
        this.focarCampo(idCpf);
        return false;
      }

      return true;
    }

    const nomeManual = (prof.corretorNomeManual || '').trim();
    if (!nomeManual) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional incompleto',
        detail: `Informe o nome do profissional (${sufixo}) na linha ${index + 1}.`
      });
      this.focarCampo(idNome);
      return false;
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
        // CORRETOR: Requer CPF informado (via busca ou manual)
        if (p.tipoProfissional.value === TipoProfissional.CORRETOR) {
          return p.corretorCpfBusca || p.corretorCpfManual;
        }
        // Outros tipos: Requer nome manual informado
        return p.corretorNomeManual;
      })
      .map(p => {
        const isCorretor = p.tipoProfissional!.value === TipoProfissional.CORRETOR;
        
        if (isCorretor) {
          // CORRETOR: Envia apenas CPF (11 dígitos), backend preenche o nome
          return {
            tipoProfissional: p.tipoProfissional!.value,
            corretorId: Number(p.corretor?.idExterno) || 0,
            cpfCorretor: (p.corretor?.cpf || p.corretorCpfManual || p.corretorCpfBusca || '').replace(/\D/g, ''),
            nomeCorretor: '' // Vazio - backend preenche
          };
        } else {
          // GERENTE/DIRETOR/PARCEIRO: Envia apenas nome (texto livre)
          return {
            tipoProfissional: p.tipoProfissional!.value,
            corretorId: 0, // Sempre 0 para não-corretores
            cpfCorretor: '', // Vazio - não aplica
            nomeCorretor: p.corretorNomeManual || ''
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
    if (!this.reservaOriginal) {
      return;
    }

    this.preencherFormulario(this.reservaOriginal);
    this.resetarFormulario();

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  voltar(): void {
    // Libera o bloqueio antes de sair
    this.liberarBloqueio();
    
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
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.EXCLUIR);
  }

  formatarPreco(preco: number | null): string {
    if (!preco) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }
}
