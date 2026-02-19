import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { CorretorService } from '../../../core/services/corretor.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import {
  ReservaCreateDTO,
  StatusReserva,
  TipoProfissional,
  TipoContato,
  FormaPagamento,
  STATUS_RESERVA_LABELS,
  TIPO_PROFISSIONAL_LABELS,
  TIPO_CONTATO_LABELS,
  FORMA_PAGAMENTO_LABELS,
  ProfissionalReservaDTO
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
  corretorSugestoes: CorretorSaidaDTO[];
  corretorBuscando: boolean;
}

@Component({
  selector: 'app-reserva-nova',
  templateUrl: './reserva-nova.component.html',
  styleUrls: ['./reserva-nova.component.scss']
})
export class ReservaNovaComponent extends BaseFormComponent implements OnInit, OnDestroy {

  // ─── Dados da unidade (pré-preenchidos / somente leitura) ─────────────────
  codEmpreendimento!: number;
  codColigadaEmpreendimento!: number;
  nomeEmpreendimento = '';
  bloco = '';
  unidade = '';
  tipoUnidade = '';
  tipologia = '';
  precoUnidade: number | null = null;
  statusUnidadeOrigem = '';

  // ─── Dados do cliente ─────────────────────────────────────────────────────
  cpfCnpjCliente = '';
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
  tipoContatoPrincipalSelecionado: { label: string; value: TipoContato } | null = null;
  contatoPrincipal = '';
  profissionaisPrincipal: ProfissionalForm[] = [];

  // ─── Imobiliária Secundária ────────────────────────────────────────────────
  exibirSecundaria = false;
  imobiliariaSecundariaSelecionada: Imobiliaria | null = null;
  imobiliariaSecundariaSugestoes: Imobiliaria[] = [];
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
  tipoContatoSecundarioSugestoes: { label: string; value: TipoContato }[] = [];
  tiposProfissionalSugestoes: { label: string; value: TipoProfissional }[] = [];

  breadcrumbItems: BreadcrumbItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private imobiliariaService: ImobiliariaService,
    private corretorService: CorretorService,
    private permissaoService: PermissaoService,
    private appConfirmationService: AppConfirmationService,
    private messageService: MessageService
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

    // Verifica se já existe reserva ativa para a unidade
    if (this.codEmpreendimento && this.bloco && this.unidade) {
      this.verificarReservaExistente();
    }

    // Define data da reserva como hoje por padrão
    this.dataReserva = new Date();

    // Inicializa com 1 profissional vazio na principal
    this.adicionarProfissional('principal');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.statusUnidadeOrigem = state?.statusUnidade || '';
    this.tipoUnidade = state?.tipoUnidade || '';
    this.tipologia = state?.tipologia || '';
    this.precoUnidade = state?.preco || null;
  }

  private mapearStatusUnidadeParaReserva(statusUnidade: string): StatusReserva | null {
    const status = (statusUnidade || '').trim();

    const mapeamento: Record<string, StatusReserva> = {
      'Não Vendida': StatusReserva.NAO_VENDIDA,
      'Disponível para Venda': StatusReserva.NAO_VENDIDA,
      'Em Negociação': StatusReserva.EM_NEGOCIACAO,
      'Reservada / Assinatura dos instrumentos aquisitivos': StatusReserva.RESERVADA,
      'Reservada/ Assinatura dos instrumentos aquisitivos': StatusReserva.RESERVADA,
      'Reservado para Venda': StatusReserva.RESERVADA,
      'Assinado, com Sinal a creditar e documentos na imobiliária': StatusReserva.ASSINADO_SINAL_A_CREDITAR,
      'Sinal Creditado, mas com todos os documentos na imobiliária': StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA,
      'Sinal Creditado/Cont.Andamento': StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA,
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': StatusReserva.SINAL_A_CREDITAR_DOC_CALPER,
      'Sinal a Creditar/Cont.Andament': StatusReserva.SINAL_A_CREDITAR_DOC_CALPER,
      'Sinal Creditado, mas com pendência de documentos': StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC,
      'Sinal Creditado e sem pendência de documentos': StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA,
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': StatusReserva.PROCESSO_FINALIZADO,
      'Sinal Creditado/ Cont.Finaliza': StatusReserva.PROCESSO_FINALIZADO,
      'Sinal creditado, mas cliente pediu distrato': StatusReserva.DISTRATO,
      'Fora de venda': StatusReserva.FORA_DE_VENDA
    };

    return mapeamento[status] ?? null;
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
            
            // Carrega o status real da reserva existente
            this.statusSelecionado = this.statusOptions.find(o => o.value === reserva.status) || null;
            
            this.messageService.add({
              severity: 'warn',
              summary: 'Reserva Existente',
              detail: `Já existe uma reserva ativa para esta unidade. Redirecionando para edição.`
            });
            setTimeout(() => {
              this.router.navigate(['/reservas', reserva.id, 'editar']);
            }, 2000);
          }
        },
        error: () => {
          // 404 = sem reserva, pode continuar normalmente
        }
      });
  }

  // ─── Profissionais ────────────────────────────────────────────────────────

  adicionarProfissional(tipo: 'principal' | 'secundaria'): void {
    const novo: ProfissionalForm = {
      tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === TipoProfissional.CORRETOR) || null,
      corretor: null,
      corretorSugestoes: [],
      corretorBuscando: false
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

  buscarCorretores(event: any, profForm: ProfissionalForm): void {
    const query = event.query?.toString() || '';
    if (query.length < 2) {
      profForm.corretorSugestoes = [];
      return;
    }
    profForm.corretorBuscando = true;
    this.corretorService.listar(0, 20, query)
      .pipe(finalize(() => (profForm.corretorBuscando = false)))
      .subscribe({
        next: (page) => {
          profForm.corretorSugestoes = page.content;
        },
        error: () => {
          profForm.corretorSugestoes = [];
        }
      });
  }

  onDropdownClickCorretor(profForm: ProfissionalForm): void {
    profForm.corretorBuscando = true;
    this.corretorService.listar(0, 50, '')
      .pipe(finalize(() => (profForm.corretorBuscando = false)))
      .subscribe({
        next: (page) => {
          profForm.corretorSugestoes = page.content;
        },
        error: () => {
          profForm.corretorSugestoes = [];
        }
      });
  }

  getNomeCorretor(c: CorretorSaidaDTO): string {
    return c ? `${c.nome} (${c.cpf || c.idExterno || ''})` : '';
  }

  // ─── Autocomplete Imobiliária ─────────────────────────────────────────────

  buscarImobiliarias(event: any, tipo: 'principal' | 'secundaria'): void {
    const query = (event.query || '').toString().toLowerCase();
    this.imobiliariaService.listarTodas()
      .subscribe({
        next: (lista) => {
          const filtradas = lista.filter(i =>
            i.nomeFantasia?.toLowerCase().includes(query) ||
            i.razaoSocial?.toLowerCase().includes(query)
          );
          if (tipo === 'principal') {
            this.imobiliariaPrincipalSugestoes = filtradas;
          } else {
            this.imobiliariaSecundariaSugestoes = filtradas;
          }
        }
      });
  }

  onDropdownClickImobiliariaPrincipal(): void {
    this.imobiliariaService.listarTodas()
      .subscribe({
        next: (lista) => {
          this.imobiliariaPrincipalSugestoes = lista;
        }
      });
  }

  onDropdownClickImobiliariaSecundaria(): void {
    this.imobiliariaService.listarTodas()
      .subscribe({
        next: (lista) => {
          this.imobiliariaSecundariaSugestoes = lista;
        }
      });
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

  onDropdownClickTipoContatoSecundario(): void {
    this.tipoContatoSecundarioSugestoes = this.tiposContatoOptions;
  }

  onDropdownClickTiposProfissional(): void {
    this.tiposProfissionalSugestoes = this.tiposProfissionalOptions;
  }

  // ─── Cadastro Rápido de Corretor ──────────────────────────────────────────

  abrirCadastroRapido(): void {
    this.cadastroRapidoCpf = '';
    this.cadastroRapidoNome = '';
    this.cadastroRapidoEmail = '';
    this.cadastroRapidoTelefone = '';
    this.cpfCadastroRapidoJaCadastrado = false;
    this.displayCadastroRapido = true;
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
    return [
      { id: 'cpfCnpjCliente', valor: this.cpfCnpjCliente, label: 'CPF / CNPJ do Cliente' },
      { id: 'nomeCliente', valor: this.nomeCliente, label: 'Nome do Cliente' },
      { id: 'imobiliariaPrincipal', valor: this.imobiliariaPrincipalSelecionada, label: 'Imobiliária Principal' },
      { id: 'dataReserva', valor: this.dataReserva, label: 'Data da Reserva' }
    ];
  }

  salvar(): void {
    if (!this.validarFormulario()) return;
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
    const possuiProfissionalPrincipal = this.profissionaisPrincipal.some(
      (prof) => prof.tipoProfissional !== null && prof.corretor !== null
    );

    if (!possuiProfissionalPrincipal) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Profissional obrigatório',
        detail: 'Informe pelo menos um profissional na Imobiliária Principal.'
      });
      return false;
    }

    if (this.imobiliariaSecundariaSelecionada) {
      const possuiProfissionalSecundaria = this.profissionaisSecundaria.some(
        (prof) => prof.tipoProfissional !== null && prof.corretor !== null
      );

      if (!possuiProfissionalSecundaria) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Profissional obrigatório',
          detail: 'Informe pelo menos um profissional na Imobiliária Secundária.'
        });
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
          this.messageService.add({
            severity: 'success',
            summary: 'Reserva criada!',
            detail: `Reserva da unidade ${this.bloco}/${this.unidade} criada com sucesso.`
          });
          this.router.navigate(['/reservas', reserva.id, 'editar']);
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
        imobiliariaId: imobiliaria?.id || 0,
        nomeImobiliaria: this.getNomeImobiliaria(imobiliaria!),
        tipoProfissional: p.tipoProfissional!.value,
        corretorId: Number(p.corretor?.idExterno) || 0,
        cpfCorretor: p.corretor?.cpf || '',
        nomeCorretor: p.corretor?.nome || ''
      }));
  }

  private montarPayload(): ReservaCreateDTO {
    return {
      codEmpreendimento: this.codEmpreendimento,
      codColigadaEmpreendimento: this.codColigadaEmpreendimento,
      nomeEmpreendimento: this.nomeEmpreendimento,
      bloco: this.bloco,
      unidade: this.unidade,
      tipoUnidade: this.tipoUnidade,
      tipologia: this.tipologia,
      status: this.statusSelecionado?.value,
      imobiliariaPrincipalId: this.imobiliariaPrincipalSelecionada!.id,
      tipoContatoPrincipal: this.tipoContatoPrincipalSelecionado?.value,
      contatoPrincipal: this.contatoPrincipal || undefined,
      profissionaisPrincipal: this.montarProfissionaisPayload(
        this.profissionaisPrincipal,
        this.imobiliariaPrincipalSelecionada
      ),
      imobiliariaSecundariaId: this.imobiliariaSecundariaSelecionada?.id || null,
      tipoContatoSecundario: this.tipoContatoSecundarioSelecionado?.value || null,
      contatoSecundario: this.contatoSecundario || null,
      profissionaisSecundaria: this.imobiliariaSecundariaSelecionada
        ? this.montarProfissionaisPayload(this.profissionaisSecundaria, this.imobiliariaSecundariaSelecionada)
        : [],
      cpfCnpjCliente: this.cpfCnpjCliente.replace(/\D/g, ''),
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
    this.tipoContatoSecundarioSelecionado = null;
    this.contatoSecundario = '';
    this.profissionaisSecundaria = [];

    this.observacoes = '';
  }

  voltar(): void {
    if (this.codEmpreendimento) {
      this.router.navigate(
        ['/empreendimentos', this.codEmpreendimento, 'unidades'],
        { state: { nomeEmpreendimento: this.nomeEmpreendimento } }
      );
    } else {
      this.router.navigate(['/reservas']);
    }
  }

  formatarPreco(preco: number | null): string {
    if (!preco) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
  }
}
