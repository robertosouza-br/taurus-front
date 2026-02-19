import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService as PrimeConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { CorretorService } from '../../../core/services/corretor.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import {
  ReservaDTO,
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

interface ProfissionalForm {
  tipoProfissional: { label: string; value: TipoProfissional } | null;
  corretor: CorretorSaidaDTO | null;
  corretorNomeManual: string;
  corretorCpfManual: string;
  corretorSugestoes: CorretorSaidaDTO[];
  corretorBuscando: boolean;
}

@Component({
  selector: 'app-reserva-edicao',
  templateUrl: './reserva-edicao.component.html',
  styleUrls: ['./reserva-edicao.component.scss']
})
export class ReservaEdicaoComponent extends BaseFormComponent implements OnInit, OnDestroy {

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

  // ─── Dados do cliente ─────────────────────────────────────────────────────
  cpfCnpjCliente = '';
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
    private confirmationService: PrimeConfirmationService,
    private appConfirmationService: AppConfirmationService,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.ALTERAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    this.reservaId = Number(this.route.snapshot.paramMap.get('id'));
    this.configurarOpcoes();
    this.carregarReserva();
  }

  ngOnDestroy(): void {
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

  private preencherFormulario(r: ReservaDTO): void {
    // Dados da unidade
    this.codEmpreendimento = r.codEmpreendimento;
    this.codColigadaEmpreendimento = r.codColigadaEmpreendimento;
    this.nomeEmpreendimento = r.nomeEmpreendimento;
    this.bloco = r.bloco;
    this.unidade = r.unidade;
    this.tipoUnidade = r.tipoUnidade;
    this.tipologia = r.tipologia;

    // Dados do cliente
    this.cpfCnpjCliente = r.cpfCnpjCliente;
    this.nomeCliente = r.nomeCliente;
    this.clienteEstrangeiro = r.clienteEstrangeiro;
    this.formaPagamento = r.formaPagamento
      ? this.formaPagamentoOptions.find(o => o.value === r.formaPagamento) || null
      : null;
    this.dataReserva = r.dataReserva ? new Date(r.dataReserva) : null;
    this.dataVenda = r.dataVenda ? new Date(r.dataVenda) : null;
    this.statusSelecionado = this.statusOptions.find(o => o.value === r.status) || null;

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
      corretorNomeManual: p.nomeCorretor,
      corretorCpfManual: p.cpfCorretor,
      corretorSugestoes: [],
      corretorBuscando: false
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
      this.contatoSecundario = r.contatoSecundario || '';

      this.profissionaisSecundaria = (r.profissionaisSecundaria || []).map(p => ({
        tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === p.tipoProfissional) || null,
        corretor: null,
        corretorNomeManual: p.nomeCorretor,
        corretorCpfManual: p.cpfCorretor,
        corretorSugestoes: [],
        corretorBuscando: false
      }));
    }

    this.observacoes = r.observacoes || '';

    // Configura breadcrumb
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

  // ─── Profissionais ────────────────────────────────────────────────────────

  adicionarProfissional(tipo: 'principal' | 'secundaria'): void {
    const novo: ProfissionalForm = {
      tipoProfissional: this.tiposProfissionalOptions.find(o => o.value === TipoProfissional.CORRETOR) || null,
      corretor: null,
      corretorNomeManual: '',
      corretorCpfManual: '',
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
        next: (page) => (profForm.corretorSugestoes = page.content),
        error: () => (profForm.corretorSugestoes = [])
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

  onCorretorSelecionado(event: any, prof: ProfissionalForm): void {
    const corretor: CorretorSaidaDTO = event?.value ?? event;
    prof.corretor = corretor;
    prof.corretorNomeManual = corretor?.nome || '';
    prof.corretorCpfManual = corretor?.cpf || '';
  }

  // ─── Autocomplete Imobiliária ─────────────────────────────────────────────

  buscarImobiliarias(event: any, tipo: 'principal' | 'secundaria'): void {
    const query = (event.query || '').toString().toLowerCase();
    this.imobiliariaService.listarTodas().subscribe({
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

  // ─── Cadastro Rápido ──────────────────────────────────────────────────────

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
      (prof) => prof.tipoProfissional !== null && (prof.corretor !== null || !!prof.corretorNomeManual)
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
        (prof) => prof.tipoProfissional !== null && (prof.corretor !== null || !!prof.corretorNomeManual)
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
    const payload = this.montarPayload();

    this.reservaService.atualizar(this.reservaId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.salvando = false))
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Atualizado!',
            detail: 'Reserva atualizada com sucesso.'
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
      .filter(p => p.tipoProfissional !== null && (p.corretor !== null || p.corretorNomeManual))
      .map(p => ({
        imobiliariaId: imobiliaria?.id || 0,
        nomeImobiliaria: this.getNomeImobiliaria(imobiliaria!),
        tipoProfissional: p.tipoProfissional!.value,
        corretorId: Number(p.corretor?.idExterno) || 0,
        cpfCorretor: p.corretor?.cpf || p.corretorCpfManual || '',
        nomeCorretor: p.corretor?.nome || p.corretorNomeManual || ''
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

  limparTela(): void {
    if (!this.reservaOriginal) {
      return;
    }

    this.preencherFormulario(this.reservaOriginal);
    this.resetarFormulario();

    this.messageService.add({
      severity: 'info',
      summary: 'Formulário restaurado',
      detail: 'Os dados foram restaurados para o último estado salvo.'
    });
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

  temPermissaoExcluir(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.RESERVA, Permissao.EXCLUIR);
  }
}
