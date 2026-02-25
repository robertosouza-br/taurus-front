import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { CorretorService } from '../../../core/services/corretor.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ReservaBloqueioService } from '../../../core/services/reserva-bloqueio.service';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer/countdown-timer.component';
import {
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
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

/** Estado de um profissional no formulário */
interface ProfissionalForm {
  tipoProfissional: { label: string; value: TipoProfissional } | null;
  corretor: CorretorSaidaDTO | null;
  corretorCpfBusca: string;
  corretorSugestoes: CorretorSaidaDTO[];
  corretorBuscando: boolean;
  ultimoCpfBuscado: string;
  corretorNaoEncontrado: boolean;
}

@Component({
  selector: 'app-reserva-nova',
  templateUrl: './reserva-nova.component.html',
  styleUrls: ['./reserva-nova.component.scss']
})
export class ReservaNovaComponent extends BaseFormComponent implements OnInit, OnDestroy {

  // ─── Referência ao Countdown Timer ────────────────────────────────────────
  @ViewChild(CountdownTimerComponent) countdownTimer?: CountdownTimerComponent;

  // ─── Dados da unidade (pré-preenchidos / somente leitura) ─────────────────
  codEmpreendimento!: number;
  codColigadaEmpreendimento!: number;
  nomeEmpreendimento = '';
  bloco = '';
  unidade = '';
  tipoUnidade = '';
  tipologia = '';
  precoUnidade: number | null = null;
  statusUnidadeOrigem: string | number = '';

  // ─── Dados do cliente ─────────────────────────────────────────────────────
  cpfCnpjCliente = '';
  passaporteCliente = '';
  nomeCliente = '';
  clienteEstrangeiro = false;
  formaPagamento: { label: string; value: FormaPagamento } | null = null;
  formaPagamentoOptions: { label: string; value: FormaPagamento }[] = [];
  dataReserva: Date | null = new Date();
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

  // ─── Verificação de reserva existente ─────────────────────────────────────
  verificandoReserva = false;
  reservaExistente: any = null;

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
  renovacaoOferecida = false; // Flag para controlar se já oferecemos renovação

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private imobiliariaService: ImobiliariaService,
    private corretorService: CorretorService,
    private usuarioService: UsuarioService,
    private permissaoService: PermissaoService,
    private appConfirmationService: AppConfirmationService,
    private messageService: MessageService,
    private reservaBloqueioService: ReservaBloqueioService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.INCLUIR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // Lê dados da unidade dos parâmetros de rota e do state
    this.lerDadosRota();

    // Configura opções dos selects
    this.configurarOpcoes();

    // Configura breadcrumb
    this.configurarBreadcrumb();

    this.carregarCombos();

    // Verifica reserva existente
    if (this.codEmpreendimento && this.bloco && this.unidade) {
      this.verificarReservaExistente();
    }

    // Verifica se existe bloqueio ativo e depois tenta bloquear
    // Importante: Ao dar refresh, verifica o tempo restante real do backend
    if (this.codEmpreendimento && this.bloco && this.unidade) {
      this.verificarEBloquearUnidade();
    }

    // Define data da reserva como hoje por padrão
    this.dataReserva = new Date();

    // Inicializa com 1 profissional vazio na principal
    this.adicionarProfissional('principal');
  }

  ngOnDestroy(): void {
    // Libera o bloqueio ao sair da tela
    this.liberarBloqueio();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Libera bloqueio ao fechar a aba/navegador
   * Chama o método liberarBloqueio para garantir que a requisição seja enviada
   */
  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    if (this.unidadeBloqueada && this.codEmpreendimento && this.bloco && this.unidade) {
      // O navegador tentará completar a requisição DELETE mesmo ao fechar
      this.liberarBloqueio();
    }
  }

  // ─── Inicialização ────────────────────────────────────────────────────────

  private lerDadosRota(): void {
    const params = this.route.snapshot.paramMap;
    const state = window.history.state;

    this.codEmpreendimento = Number(params.get('codEmpreendimento')) || 0;
    this.bloco = params.get('bloco') || '';
    this.unidade = params.get('unidade') || '';

    // Dados do state (passados via router navigate)
    this.nomeEmpreendimento = state?.nomeEmpreendimento || '';
    this.codColigadaEmpreendimento = Number(state?.codColigadaEmpreendimento) || 0;
    // Prioriza codigoStatusUnidade (number) sobre statusUnidade (string) para integração TOTVS RM
    this.statusUnidadeOrigem = state?.codigoStatusUnidade ?? state?.statusUnidade ?? '';
    this.tipoUnidade = state?.tipoUnidade || '';
    this.tipologia = state?.tipologia || '';
    this.precoUnidade = state?.preco || null;
  }

  /**
   * Mapeia código de status da unidade (retornado pelo backend) para StatusReserva
   * Atualizado: 23/02/2026 - Integração com códigos numéricos TOTVS RM
   * @param statusUnidade - Pode ser código numérico ou descrição textual (compatibilidade)
   */
  private mapearStatusUnidadeParaReserva(statusUnidade: string | number): StatusReserva | null {
    // Converte para número se for string numérica
    const codigoNumerico = typeof statusUnidade === 'number' 
      ? statusUnidade 
      : parseInt(statusUnidade, 10);

    // Se for um número válido, usa mapeamento por código
    if (!isNaN(codigoNumerico)) {
      const mapeamentoCodigo: Record<number, StatusReserva> = {
        100: StatusReserva.NAO_VENDIDA,           // Disponível para Venda
        102: StatusReserva.PROCESSO_FINALIZADO,   // Quitado
        103: StatusReserva.NAO_VENDIDA,           // Outros
        200: StatusReserva.RESERVADA,             // Reservado para Venda
        250: StatusReserva.FORA_DE_VENDA,         // Bloqueado
        251: StatusReserva.FORA_DE_VENDA,         // Não disponível
        301: StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA, // Sinal Creditado/Cont.Assinado
        441: StatusReserva.RESERVADA,             // Contrato em assinatura
        600: StatusReserva.FORA_DE_VENDA,         // Bloqueado Juridicamente
        801: StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA, // Sinal Creditado/Cont.Andamento
        802: StatusReserva.SINAL_A_CREDITAR_DOC_CALPER, // Sinal a Creditar/Cont.Andament
        803: StatusReserva.ASSINADO_SINAL_A_CREDITAR, // Sinal a Creditar/Cont.Assinado
        804: StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA, // Sinal Pago, Doc na Imobiliária
        805: StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC, // Sinal Pago, Pendência Documento
        820: StatusReserva.FORA_DE_VENDA,         // Fora de venda
        900: StatusReserva.PROCESSO_FINALIZADO    // Sinal Creditado/Cont.Finaliza
      };
      
      return mapeamentoCodigo[codigoNumerico] ?? null;
    }

    // Fallback: Mapeamento por LABEL (compatibilidade com sistemas legados)
    // Atualizado: 23/02/2026 - Alinhado com labels oficiais da documentação
    const status = String(statusUnidade || '').trim();
    const mapeamentoLabel: Record<string, StatusReserva> = {
      // Labels oficiais TOTVS RM (conforme unidade.model.ts)
      'Disponível para Venda': StatusReserva.NAO_VENDIDA,
      'Quitado': StatusReserva.PROCESSO_FINALIZADO,
      'Outros': StatusReserva.NAO_VENDIDA,
      'Reservado para Venda': StatusReserva.RESERVADA,
      'Bloqueado': StatusReserva.FORA_DE_VENDA,
      'Não disponível': StatusReserva.FORA_DE_VENDA,
      'Sinal Creditado/Cont.Assinado': StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA,
      'Contrato em assinatura': StatusReserva.RESERVADA,
      'Bloqueado Juridicamente': StatusReserva.FORA_DE_VENDA,
      'Sinal Creditado/Cont.Andamento': StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA,
      'Sinal a Creditar/Cont.Andament': StatusReserva.SINAL_A_CREDITAR_DOC_CALPER,
      'Sinal a Creditar/Cont.Assinado': StatusReserva.ASSINADO_SINAL_A_CREDITAR,
      'Sinal Pago, Doc na Imobiliária': StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA,
      'Sinal Pago,Pendência Documento': StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC,
      'Fora de venda': StatusReserva.FORA_DE_VENDA,
      'Sinal Creditado/ Cont.Finaliza': StatusReserva.PROCESSO_FINALIZADO,
      
      // Labels legados (compatibilidade retroativa - serão descontinuados)
      'Não Vendida': StatusReserva.NAO_VENDIDA,
      'Em Negociação': StatusReserva.EM_NEGOCIACAO,
      'Reservada / Assinatura dos instrumentos aquisitivos': StatusReserva.RESERVADA,
      'Reservada/ Assinatura dos instrumentos aquisitivos': StatusReserva.RESERVADA,
      'Assinado, com Sinal a creditar e documentos na imobiliária': StatusReserva.ASSINADO_SINAL_A_CREDITAR,
      'Sinal Creditado, mas com todos os documentos na imobiliária': StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA,
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': StatusReserva.SINAL_A_CREDITAR_DOC_CALPER,
      'Sinal Creditado, mas com pendência de documentos': StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC,
      'Sinal Creditado e sem pendência de documentos': StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA,
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': StatusReserva.PROCESSO_FINALIZADO,
      'Sinal creditado, mas cliente pediu distrato': StatusReserva.DISTRATO
    };

    return mapeamentoLabel[status] ?? null;
  }

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

    const statusMapeado = this.mapearStatusUnidadeParaReserva(this.statusUnidadeOrigem);
    const statusInicial = statusMapeado || StatusReserva.RESERVADA;
    this.statusSelecionado = this.statusOptions.find(o => o.value === statusInicial) || null;
  }

  private configurarBreadcrumb(): void {
    const breadcrumb: BreadcrumbItem[] = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/empreendimentos' }
    ];

    if (this.codEmpreendimento) {
      breadcrumb.push({
        label: this.nomeEmpreendimento || `Cód. ${this.codEmpreendimento}`,
      });
      breadcrumb.push({
        label: 'Mapa de Unidades',
        url: `/empreendimentos/${this.codEmpreendimento}/unidades`
      });
    }

    breadcrumb.push({ label: 'Nova Reserva' });
    this.breadcrumbItems = breadcrumb;
  }

  private verificarReservaExistente(): void {
    this.verificandoReserva = true;
    this.reservaService.buscarPorUnidade(this.codEmpreendimento, this.bloco, this.unidade)
      .pipe(finalize(() => (this.verificandoReserva = false)))
      .subscribe({
        next: (reserva) => {
          if (reserva) {
            this.reservaExistente = reserva;
            
            // Carrega o status real da reserva existente (converte codigoStatus se necessário)
            let statusReserva = reserva.status;
            if (!statusReserva && reserva.codigoStatus) {
              const statusConvertido = codigoToStatusReserva(reserva.codigoStatus);
              if (statusConvertido) {
                statusReserva = statusConvertido;
              }
            }
            this.statusSelecionado = statusReserva 
              ? this.statusOptions.find(o => o.value === statusReserva) || null
              : null;

            this.router.navigate(['/reservas', reserva.id, 'editar'], {
              replaceUrl: true,
              state: {
                nomeEmpreendimento: this.nomeEmpreendimento,
                preco: this.precoUnidade
              }
            });
          }
        },
        error: () => {
          // 404 = sem reserva, pode continuar normalmente
        }
      });
  }

  /**
   * Verifica se já existe bloqueio ativo e tenta bloquear a unidade
   * 
   * Fluxo:
   * 1. Verifica se já existe bloqueio (importante para refresh de página)
   * 2. Se bloqueada pelo usuário atual, retoma o contador com tempo restante real
   * 3. Se bloqueada por outro usuário, redireciona
   * 4. Se não bloqueada, tenta bloquear
   */
  private verificarEBloquearUnidade(): void {
    this.verificandoBloqueio = true;

    // Primeiro verifica se já existe bloqueio
    this.reservaBloqueioService.consultarStatus(
      this.codEmpreendimento,
      this.bloco,
      this.unidade
    ).pipe(
      finalize(() => (this.verificandoBloqueio = false))
    ).subscribe({
      next: (status) => {
        if (status.bloqueado && status.bloqueadoPorMim) {
          // Bloqueio existe e é do usuário atual - retoma contador
          this.unidadeBloqueada = true;
          this.tempoRestanteBloqueio = status.tempoRestanteSegundos;
          this.duracaoTimer = status.tempoRestanteSegundos;
          
          this.messageService.add({
            severity: 'info',
            summary: 'Bloqueio Retomado',
            detail: `Você tem ${this.formatarTempo(status.tempoRestanteSegundos)} para concluir a reserva.`,
            life: 4000
          });
        } else if (status.bloqueado && !status.bloqueadoPorMim) {
          // Bloqueada por outro usuário - redireciona
          this.messageService.add({
            severity: 'error',
            summary: 'Unidade Indisponível',
            detail: `Esta unidade está sendo editada por outro usuário. Tempo restante: ${this.formatarTempo(status.tempoRestanteSegundos)}.`,
            life: 6000
          });

          setTimeout(() => {
            this.voltar();
          }, 2000);
        } else {
          // Não bloqueada - tenta bloquear
          this.bloquearUnidade();
        }
      },
      error: (error) => {
        console.error('Erro ao verificar bloqueio:', error);
        // Em caso de erro, tenta bloquear mesmo assim
        this.bloquearUnidade();
      }
    });
  }

  /**
   * Tenta bloquear a unidade para o usuário atual
   */
  private bloquearUnidade(): void {
    this.verificandoBloqueio = true;

    this.reservaBloqueioService.bloquear({
      codEmpreendimento: this.codEmpreendimento,
      bloco: this.bloco,
      unidade: this.unidade
    }).pipe(
      finalize(() => (this.verificandoBloqueio = false))
    ).subscribe({
      next: (response) => {
        this.unidadeBloqueada = true;
        this.tempoRestanteBloqueio = response.tempoRestanteSegundos;
        this.duracaoTimer = response.tempoRestanteSegundos;

        this.messageService.add({
          severity: 'success',
          summary: 'Unidade Bloqueada',
          detail: response.mensagem || 'Você tem 5 minutos para concluir a reserva.',
          life: 4000
        });
      },
      error: (error) => {
        console.error('Erro ao bloquear unidade:', error);

        // HTTP 409 = Unidade já bloqueada por outro usuário
        if (error.status === 409) {
          this.messageService.add({
            severity: 'error',
            summary: 'Unidade Indisponível',
            detail: error.error?.message || 'Esta unidade está sendo editada por outro usuário.',
            life: 6000
          });

          setTimeout(() => {
            this.voltar();
          }, 2000);
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
   */
  renovarBloqueio(): void {
    if (!this.unidadeBloqueada) {
      return;
    }

    this.reservaBloqueioService.renovar({
      codEmpreendimento: this.codEmpreendimento,
      bloco: this.bloco,
      unidade: this.unidade
    }).subscribe({
      next: (response) => {
        this.tempoRestanteBloqueio = response.tempoRestanteSegundos;
        this.renovacaoOferecida = false; // Reseta flag para oferecer novamente mais tarde
        
        // Reinicia o timer com novo tempo
        if (this.countdownTimer) {
          this.countdownTimer.resetar();
          this.countdownTimer.duracao = response.tempoRestanteSegundos;
          this.duracaoTimer = response.tempoRestanteSegundos;
          this.countdownTimer.iniciar();
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Bloqueio Renovado',
          detail: response.mensagem || 'Você ganhou mais 5 minutos para concluir a reserva.',
          life: 3000
        });
      },
      error: (error) => {
        console.error('Erro ao renovar bloqueio:', error);
        
        // HTTP 404 = Bloqueio não encontrado ou expirado
        if (error.status === 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Não foi possível renovar',
            detail: error.error?.message || 'O bloqueio expirou ou foi removido. Retornando à tela anterior.',
            life: 4000
          });

          setTimeout(() => {
            this.voltar();
          }, 1500);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro ao renovar',
            detail: 'Não foi possível renovar o bloqueio. Tente concluir a reserva rapidamente.',
            life: 4000
          });
        }
      }
    });
  }

  /**
   * Callback executado a cada segundo pelo countdown timer
   * Oferece renovação quando restar 1 minuto
   */
  onTimerTick(tempoRestante: number): void {
    // Oferece renovação quando restar exatamente 60 segundos (1 minuto)
    if (tempoRestante === 60 && !this.renovacaoOferecida && this.unidadeBloqueada) {
      this.renovacaoOferecida = true;
      this.oferecerRenovacao();
    }
  }

  /**
   * Oferece renovação do bloqueio ao usuário via diálogo
   */
  private oferecerRenovacao(): void {
    this.appConfirmationService.confirm({
      action: 'custom' as any,
      message: 'Resta apenas 1 minuto para finalizar a reserva. Deseja renovar o bloqueio por mais 5 minutos?',
      title: 'Renovar Bloqueio?',
      icon: 'pi pi-clock',
      confirmLabel: 'Sim, renovar',
      cancelLabel: 'Não',
      severity: 'warning',
      showCancel: true,
      accept: () => {
        this.renovarBloqueio();
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Renovação Recusada',
          detail: 'Finalize a reserva antes que o tempo acabe.',
          life: 3000
        });
      }
    } as any);
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

  // ─── Profissionais ────────────────────────────────────────────────────────

  adicionarProfissional(tipo: 'principal' | 'secundaria'): void {
    const novo: ProfissionalForm = {
      tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === TipoProfissional.CORRETOR) || null,
      corretor: null,
      corretorCpfBusca: '',
      corretorSugestoes: [],
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
          profForm.corretorCpfBusca = corretor.cpf || cpf;
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
    profForm.corretorNaoEncontrado = false;
  }

  buscarCorretores(_event: any, _profForm: ProfissionalForm): void {
    // Compatibilidade com possíveis bindings residuais no template checker
  }

  onDropdownClickCorretor(_profForm: ProfissionalForm): void {
    // Compatibilidade com possíveis bindings residuais no template checker
  }

  abrirCadastroRapidoComCpf(cpf: string): void {
    this.abrirCadastroRapido();
    this.cadastroRapidoCpf = cpf;
    this.onCadastroRapidoCpfChange();
  }

  getNomeCorretor(c: CorretorSaidaDTO): string {
    return c ? `${c.nome} (${c.cpf || c.idExterno || ''})` : '';
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
    if (!query) {
      this.statusSugestoes = this.statusOptions;
    } else {
      this.statusSugestoes = this.statusOptions.filter(opt =>
        opt.label.toLowerCase().includes(query)
      );
    }
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
    this.statusSugestoes = this.statusOptions;
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

  // ─── Cadastro Rápido de Corretor ──────────────────────────────────────────

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
        detail: 'CPF e Nome são obrigatórios para o cadastro rápido.'
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
    const payload = {
      cpf: this.cadastroRapidoCpf.replace(/\D/g, ''),
      nome: this.cadastroRapidoNome,
      email: this.cadastroRapidoEmail,
      telefone: this.cadastroRapidoTelefone
    };

    this.corretorService.cadastroRapido(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.salvandoCadastroRapido = false))
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Corretor cadastrado!',
            detail: `${this.cadastroRapidoNome} foi cadastrado com sucesso.`
          });
          this.displayCadastroRapido = false;
        },
        error: (err) => {
          const msg = err?.error?.message || '';
          if (msg.toLowerCase().includes('cpf') || msg.toLowerCase().includes('já cadastrado')) {
            this.cpfCadastroRapidoJaCadastrado = true;
            this.messageService.add({
              severity: 'warn',
              summary: 'CPF já cadastrado',
              detail: 'Este CPF já possui cadastro no sistema.'
            });
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

  // ─── Validação e Salvamento ──────────────────────────────────────────────

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
    const idTipo = tipo === 'principal' ? `tipoProfissional_${index}` : `tipoProfissionalSecundaria_${index}`;
    const idCpf = tipo === 'principal' ? `cpfCorretorPrincipal_${index}` : `cpfCorretorSecundaria_${index}`;

    if (!prof.tipoProfissional) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional incompleto',
        detail: `Selecione o tipo do profissional (${sufixo}) na linha ${index + 1}.`
      });
      this.focarCampo(idTipo);
      return false;
    }

    const cpf = (prof.corretor?.cpf || prof.corretorCpfBusca || '').replace(/\D/g, '');
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

    if (!prof.corretor) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Corretor inválido',
        detail: `Selecione um corretor válido (${sufixo}) na linha ${index + 1}.`
      });
      this.focarCampo(idCpf);
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

  private executarSalvar(): void {
    if (this.salvando) {
      return;
    }

    this.salvando = true;

    const payload: ReservaCreateDTO = this.montarPayload();

    this.reservaService.criar(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.salvando = false))
      )
      .subscribe({
        next: (reserva) => {
          // Libera bloqueio após salvar com sucesso
          this.liberarBloqueio();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Reserva criada!',
            detail: `Reserva da unidade ${this.bloco}/${this.unidade} criada com sucesso.`
          });
          this.router.navigate(['/empreendimentos', this.codEmpreendimento, 'unidades'], {
            state: {
              nomeEmpreendimento: this.nomeEmpreendimento,
              preco: this.precoUnidade
            }
          });
        },
        error: (err) => {
          const msg = err?.error?.message || 'Não foi possível criar a reserva.';
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: msg
          });
        }
      });
  }

  private montarProfissionaisPayload(profs: ProfissionalForm[], imobiliaria: Imobiliaria | null): Omit<ProfissionalReservaDTO, 'id'>[] {
    return profs
      .filter(p => p.corretor !== null && p.tipoProfissional !== null)
      .map(p => ({
        tipoProfissional: p.tipoProfissional!.value,
        corretorId: Number(p.corretor?.idExterno) || 0,
        cpfCorretor: (p.corretor?.cpf || p.corretorCpfBusca || '').replace(/\D/g, ''),
        nomeCorretor: p.corretor?.nome || ''
      }));
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

  limparTela(): void {
    this.resetarFormulario();

    this.cpfCnpjCliente = '';
    this.passaporteCliente = '';
    this.nomeCliente = '';
    this.clienteEstrangeiro = false;
    this.formaPagamento = null;
    this.dataReserva = new Date();
    this.dataVenda = null;

    const statusMapeado = this.mapearStatusUnidadeParaReserva(this.statusUnidadeOrigem);
    const statusInicial = statusMapeado || StatusReserva.RESERVADA;
    this.statusSelecionado = this.statusOptions.find(o => o.value === statusInicial) || null;

    this.imobiliariaPrincipalSelecionada = null;
    this.tipoContatoPrincipalSelecionado = null;
    this.contatoPrincipal = '';
    this.profissionaisPrincipal = [];
    this.adicionarProfissional('principal');

    this.exibirSecundaria = false;
    this.imobiliariaSecundariaSelecionada = null;
    this.tipoRelacionamentoSecundariaSelecionado = null;
    this.tipoContatoSecundarioSelecionado = null;
    this.contatoSecundario = '';
    this.profissionaisSecundaria = [];

    this.observacoes = '';

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  voltar(): void {
    // Libera bloqueio da unidade antes de voltar
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
   * Libera bloqueio e volta para tela anterior
   */
  handleTimeout(): void {
    this.liberarBloqueio();
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Tempo Esgotado',
      detail: 'O tempo para finalizar a reserva acabou. Retornando à tela anterior.',
      life: 5000
    });
    
    setTimeout(() => {
      this.voltar();
    }, 1000);
  }

  formatarPreco(preco: number | null): string {
    if (!preco) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }
}
