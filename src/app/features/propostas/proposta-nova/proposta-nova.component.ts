import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { ConfirmationService as AppConfirmationService } from '../../../shared/services/confirmation.service';
import { PropostaService } from '../../../core/services/proposta.service';
import {
  PropostaSimplificadaDTO,
  ComponenteFormulario,
  ComponenteTabelaPadraoDTO,
  ComponenteSimulacaoDTO,
  SalvarPropostaSimplificadaRequest,
  SalvarPropostaResponse,
  ComponentePropostaRequest,
  PropostaStatus,
  PROPOSTA_STATUS_LABELS,
  PROPOSTA_STATUS_SEVERITY,
  ComparacaoMetricaDTO,
  RegraValidacaoDTO,
  ConfiguracoesAprovacaoDTO,
  TipoRegraValidacao,
  StatusRegraValidacao,
  TipoComponente,
  GrupoComponente,
  Periodicidade,
  GRUPO_COMPONENTE_LABELS,
  PERIODICIDADE_LABELS
} from '../../../core/models/proposta-simplificada.model';

@Component({
  selector: 'app-proposta-nova',
  templateUrl: './proposta-nova.component.html',
  styleUrls: ['./proposta-nova.component.scss'],
  providers: [MessageService]
})
export class PropostaNovaComponent extends BaseFormComponent implements OnInit, OnDestroy {
  proposta: PropostaSimplificadaDTO | null = null;
  reservaId!: number;
  
  carregando = false;
  override salvando = false;
  gerandoPix = false;
  
  componentesTabelaPadrao: ComponenteTabelaPadraoDTO[] = [];
  componentes: ComponenteFormulario[] = [];
  
  componenteAto: ComponenteFormulario | null = null;
  componentesDisponiveisParaAdicionar: ComponenteTabelaPadraoDTO[] = [];
  
  componentesDisponiveisAPI: ComponenteTabelaPadraoDTO[] = [];
  carregandoComponentesDisponiveis = false;
  
  componenteSelecionadoAutocomplete: ComponenteTabelaPadraoDTO | null = null;
  componentesFiltrados: ComponenteTabelaPadraoDTO[] = [];
  adicionarComponenteDialogVisible = false;
  codigoComponenteAjusteDiferenca: string | null = null;
  opcoesAjusteDiferencaFiltradas: Array<{ label: string; value: string }> = [];
  ajusteDiferencaDialogVisible = false;
  readonly adicionarComponenteAutocompleteOverlayOptions = {
    styleClass: 'adicionar-componente-autocomplete-overlay',
    contentStyleClass: 'adicionar-componente-autocomplete-overlay-content',
    autoZIndex: true,
    baseZIndex: 11000
  };
  readonly ajusteDiferencaAutocompleteOverlayOptions = {
    styleClass: 'ajuste-diferenca-autocomplete-overlay',
    contentStyleClass: 'ajuste-diferenca-autocomplete-overlay-content',
    autoZIndex: true,
    baseZIndex: 11000
  };
  
  valorTabela = 0;
  valorProposta = 0;
  diferenca = 0;
  percentualDiferenca = 0;
  possuiDesconto = false;
  possuiAcrescimo = false;
  adiantamento = 0;
  saldoDevedor = 0;
  
  comparacao: ComparacaoMetricaDTO[] = [];
  graficoData: any = { labels: [], datasets: [] };
  private simulacaoAlterada = false;
  
  violacoesAprovacao: RegraValidacaoDTO[] = [];
  configuracoesAprovacao: ConfiguracoesAprovacaoDTO = {
    percentualSinalMinimo: 5.0,
    percentual13PrimeirosMesesMinimo: 29.0,
    percentual13UltimosMesesMaximo: 26.0,
    percentualUltimaParcelaMaximo: 6.0,
    valorMensalMinimo: 1000.00,
    valoresAtoMinimosPorTipologia: {
      '01 QUARTO': 10000,
      '02 QUARTOS': 15000,
      '03 QUARTOS': 20000,
      'COB 2Q': 15000  // Adicionar conforme tipologias existentes
    }
  };
  
  dadosClienteCorretorExpandido = true;
  preencherPropostaExpandido = true;
  validacoesAprovacaoExpandido = true;
  relatorioComparativoExpandido = true;
  tabelaPadraoExpandida = false;
  
  readonly statusLabels = PROPOSTA_STATUS_LABELS;
  readonly statusSeverity = PROPOSTA_STATUS_SEVERITY;
  
  componentesNormalizadosCache: ComponenteTabelaPadraoDTO[] = [];
  private readonly valorParcelaInputMap = new WeakMap<ComponenteFormulario, string>();
  private readonly detalhamentoExpandidoMap = new WeakSet<ComponenteFormulario>();
  private atoInicialProtegido: ComponenteFormulario | null = null;
  private propostaId: number | null = null;
  
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propostaService: PropostaService,
    private messageService: MessageService,
    private appConfirmationService: AppConfirmationService
  ) {
    super();
  }

  // Getters para acessar propriedades da modalidade (compatível com v1.0 UPPERCASE e v2.0 camelCase)
  get modalidadeNome(): string {
    const modal: any = this.proposta?.modalidadeTabelaPadrao;
    return modal?.MODALIDADE ?? modal?.modalidade ?? '';
  }

  get modalidadeDescricao(): string {
    const modal: any = this.proposta?.modalidadeTabelaPadrao;
    return modal?.DESCRICAO ?? modal?.descricao ?? '';
  }

  getGrupoComponenteLabel(grupo?: number | null): string {
    if (grupo === null || grupo === undefined) {
      return 'Componente';
    }

    return GRUPO_COMPONENTE_LABELS[grupo as GrupoComponente] ?? 'Componente';
  }

  getPeriodicidadeLabel(periodicidade?: number | null): string {
    if (periodicidade === null || periodicidade === undefined) {
      return 'Periodicidade livre';
    }

    return PERIODICIDADE_LABELS[periodicidade as Periodicidade] ?? `${periodicidade} meses`;
  }

  getPeriodicidadeBadgeLabel(grupo?: number | null, periodicidade?: number | null): string | null {
    const grupoLabel = this.getGrupoComponenteLabel(grupo).trim().toLocaleLowerCase('pt-BR');
    const periodicidadeLabel = this.getPeriodicidadeLabel(periodicidade).trim();

    if (grupoLabel === periodicidadeLabel.toLocaleLowerCase('pt-BR')) {
      return null;
    }

    return periodicidadeLabel;
  }

  getPrimeiroVencimentoTabelaPadrao(componente: ComponenteTabelaPadraoDTO): Date | null {
    if (componente.dataVencimento) {
      return componente.dataVencimento instanceof Date
        ? componente.dataVencimento
        : new Date(componente.dataVencimento);
    }

    return this.calcularVencimentoInicial(componente);
  }

  get valorRestanteParaAjuste(): number {
    return this.possuiDesconto ? Math.abs(this.diferenca) : 0;
  }

  get opcoesAjusteDiferenca(): Array<{ label: string; value: string }> {
    return this.componentes
      .filter(c => c.selecionado)
      .map((componente, index) => ({
        value: componente.codigoComponente,
        label: `${componente.nomeComponente} ${this.componentes.filter(c => c.nomeComponente === componente.nomeComponente).length > 1 ? `#${index + 1}` : ''} • ${componente.quantidade}x • ${this.formatarMoeda(componente.valorTotal)}`
      }));
  }

  filtrarOpcoesAjusteDiferenca(event: any): void {
    const query = event.query?.toLowerCase()?.trim() || '';
    const opcoes = this.opcoesAjusteDiferenca;

    this.opcoesAjusteDiferencaFiltradas = !query
      ? [...opcoes]
      : opcoes.filter(opcao => opcao.label.toLowerCase().includes(query));
  }

  abrirTodasOpcoesAjusteDiferenca(): void {
    this.opcoesAjusteDiferencaFiltradas = [...this.opcoesAjusteDiferenca];
  }

  abrirDialogAjusteDiferenca(): void {
    this.opcoesAjusteDiferencaFiltradas = [...this.opcoesAjusteDiferenca];
    this.ajusteDiferencaDialogVisible = true;
  }

  abrirDialogAdicionarComponente(): void {
    this.onDropdownClickComponentes();
    this.adicionarComponenteDialogVisible = true;
  }

  fecharDialogAdicionarComponente(): void {
    this.adicionarComponenteDialogVisible = false;
    this.componenteSelecionadoAutocomplete = null;
    this.componentesFiltrados = [];
  }

  fecharDialogAjusteDiferenca(): void {
    this.ajusteDiferencaDialogVisible = false;
    this.codigoComponenteAjusteDiferenca = null;
    this.opcoesAjusteDiferencaFiltradas = [];
  }

  ngOnInit(): void {
    this.obterReservaId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtém o ID da reserva dos parâmetros da rota
   */
  private obterReservaId(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.reservaId = +params['reservaId'];
      if (this.reservaId) {
        this.carregarProposta();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'ID da reserva não fornecido'
        });
        this.router.navigate(['/propostas/lista']);
      }
    });
  }

  /**
   * Carrega dados da proposta simplificada
   */
  private carregarProposta(): void {
    this.carregando = true;
    
    this.propostaService.buscarPropostaSimplificada(this.reservaId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.carregando = false)
      )
      .subscribe({
        next: (proposta) => {
          this.proposta = proposta;
          this.propostaId = proposta.id ?? null;
          this.inicializarComponentes();
          this.calcularTotais();
          this.gerarComparacao();
          this.atualizarGrafico();
          
          // Carregar componentes disponíveis da API após carregar proposta
          this.carregarComponentesDisponiveis();
        },
        error: (error) => {
          console.error('Erro ao carregar proposta:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Não foi possível carregar os dados da proposta'
          });
        }
      });
  }

  /**
   * Carrega lista de componentes disponíveis da API
   */
  private carregarComponentesDisponiveis(): void {
    if (!this.proposta?.empreendimento?.codEmpreendimento) {
      return;
    }

    this.carregandoComponentesDisponiveis = true;
    const codigoEmpreendimento = String(this.proposta.empreendimento.codEmpreendimento);

    this.propostaService.listarComponentesDisponiveisPorEmpreendimento(codigoEmpreendimento)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.carregandoComponentesDisponiveis = false)
      )
      .subscribe({
        next: (componentes) => {
          // Filtrar apenas ativos e ordenar
          const componentesAtivos = componentes
            .filter(c => c.ativo)
            .sort((a, b) => {
              // Ordena por ordem primeiro, depois por nome (trata nulls)
              const ordemA = a.ordem ?? 999;
              const ordemB = b.ordem ?? 999;
              
              if (ordemA !== ordemB) {
                return ordemA - ordemB;
              }
              return a.nomeComponente.localeCompare(b.nomeComponente);
            });

          // Converter ComponenteDisponivelDTO para ComponenteTabelaPadraoDTO
          this.componentesDisponiveisAPI = componentesAtivos.map(comp => ({
            codigoComponente: comp.codigoComponente,
            nomeComponente: comp.nomeComponente,
            tipoComponente: comp.tipoComponente as TipoComponente,
            grupoComponente: (comp.grupoComponente ?? 7) as GrupoComponente,
            percentual: comp.percentualPadrao ?? 0,
            valorMinimo: comp.valorMinimo,
            valorMaximo: comp.valorMaximo,
            quantidade: comp.quantidadePadrao ?? 1,
            periodicidade: (comp.periodicidadePadrao ?? 1) as Periodicidade,
            prazoMeses: comp.prazoMesesPadrao ?? 1,
            ordem: comp.ordem ?? 999,
            ativo: comp.ativo,
            tabelaPadrao: 'NÃO', // Componentes da API são sempre disponíveis para adicionar
            valor: null,
            valorParcela: null,
            selecionado: false
          }));

          console.log(`Carregados ${this.componentesDisponiveisAPI.length} componentes disponíveis da API`);
          
          this.separarComponentes();
        },
        error: (error) => {
          console.error('Erro ao carregar componentes disponíveis:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Não foi possível carregar componentes adicionais. Apenas componentes padrão estarão disponíveis.'
          });
          this.componentesDisponiveisAPI = [];
        }
      });
  }

  /**
   * Inicializa componentes do formulário a partir da tabela padrão ou simulação existente
   */
  private inicializarComponentes(): void {
    if (!this.proposta) return;

    this.simulacaoAlterada = false;
    this.atoInicialProtegido = null;
    
    const modalidade = this.proposta.modalidadeTabelaPadrao;
    const simulacao = this.proposta.simulacao;
    
    this.valorTabela = this.proposta.empreendimento.valorUnidade;
    
    // Normalizar componentes para v2.0 e cachear (evita reprocessamento)
    this.componentesNormalizadosCache = this.normalizarComponentes(modalidade);
    
    this.componentesTabelaPadrao = this.componentesNormalizadosCache
      .filter(c => c.valor !== null && c.valor > 0)
      .sort((a, b) => a.ordem - b.ordem);
    
    if (simulacao && simulacao.componentes?.length > 0) {
      // Carregar dados da simulação existente
      this.componentes = simulacao.componentes.map(comp => {
        const regra = this.componentesNormalizadosCache.find(
          c => c.codigoComponente === comp.codigoComponente
        )!;
        
        const componente: ComponenteFormulario = {
          codigoComponente: comp.codigoComponente,
          nomeComponente: comp.nomeComponente,
          tipoComponente: comp.tipoComponente,
          quantidade: comp.quantidade,
          vencimento: comp.vencimento ? new Date(comp.vencimento) : null,
          valorParcela: comp.valorParcela,
          percentual: comp.percentual,
          valorTotal: comp.valorTotal,
          selecionado: true,
          regra,
          erroValidacao: null
        };
        
        componente.listaVencimentos = this.gerarVencimentos(
          componente.vencimento,
          componente.quantidade,
          regra.periodicidade ?? 0,
          componente.valorParcela,
          componente.valorTotal
        );
        
        return componente;
      });
      
      this.valorProposta = simulacao.valorProposta;
      this.diferenca = simulacao.diferenca;
      this.percentualDiferenca = simulacao.percentualDiferenca;
      this.possuiDesconto = simulacao.possuiDesconto;
      this.possuiAcrescimo = simulacao.possuiAcrescimo;
    } else {
      this.componentes = this.componentesNormalizadosCache
        .sort((a, b) => a.ordem - b.ordem)
        .map(regra => {
          const temValor = regra.valor !== null && regra.valor > 0;
          const valorTotal = temValor ? (regra.valor ?? 0) : 0;
          const valorParcela = temValor ? (regra.valorParcela ?? 0) : 0;
          const percentual = temValor ? (regra.percentual ?? 0) : 0;
          
          const vencimento = regra.dataVencimento 
            ? new Date(regra.dataVencimento) 
            : this.calcularVencimentoInicial(regra);
          
          const componente: ComponenteFormulario = {
            codigoComponente: regra.codigoComponente,
            nomeComponente: regra.nomeComponente,
            tipoComponente: regra.tipoComponente,
            grupoComponente: regra.grupoComponente,
            periodicidade: regra.periodicidade,
            quantidade: regra.quantidade || 1,
            vencimento: vencimento,
            valorParcela: valorParcela,
            percentual: percentual,
            valorTotal: valorTotal,
            selecionado: temValor,
            regra,
            erroValidacao: null
          };
          
          if (regra.listaVencimentos && regra.listaVencimentos.length > 0) {
            componente.listaVencimentos = regra.listaVencimentos.map(v => ({
              numeroParcela: v.numeroParcela,
              dataVencimento: typeof v.dataVencimento === 'string' 
                ? new Date(v.dataVencimento) 
                : v.dataVencimento,
              valor: v.valor
            }));
          } else {
            componente.listaVencimentos = this.gerarVencimentos(
              vencimento,
              componente.quantidade,
              regra.periodicidade ?? 0,
              valorParcela,
              valorTotal
            );
          }
          
          return componente;
        });
        
      this.calcularTotais();
    }
    
    this.separarComponentes();
    this.definirAtoInicialProtegido();
  }

  private definirAtoInicialProtegido(): void {
    this.atoInicialProtegido = this.componentes.find(componente => this.isAto(componente)) ?? null;
  }

  /**
   * Separa componentes em: Tabela Padrão, ATO e Disponíveis
   */
  private separarComponentes(): void {
    if (!this.componentesNormalizadosCache || this.componentesNormalizadosCache.length === 0) {
      return;
    }
    
    this.componenteAto = this.componentes.find(c => 
      c.nomeComponente.toUpperCase().includes('ATO')
    ) || null;
    
    const disponiveisTabelaPadrao = [...this.componentesNormalizadosCache];
    
    const disponiveisAPI = [...(this.componentesDisponiveisAPI || [])];
    
    const todoDisponiveis = [...disponiveisTabelaPadrao, ...disponiveisAPI];
    const mapaComponentes = new Map<string, ComponenteTabelaPadraoDTO>();
    
    todoDisponiveis.forEach(c => {
      if (!mapaComponentes.has(c.codigoComponente)) {
        mapaComponentes.set(c.codigoComponente, c);
      }
    });
    
    this.componentesDisponiveisParaAdicionar = Array.from(mapaComponentes.values())
      .sort((a, b) => a.ordem - b.ordem);
      
    console.log(`${this.componentesDisponiveisParaAdicionar.length} componente(s) disponível(is) para adicionar`);
  }

  private isAto(componente: ComponenteFormulario | null | undefined): boolean {
    return !!componente?.nomeComponente?.toUpperCase().includes('ATO');
  }

  isExclusaoBloqueada(componente: ComponenteFormulario): boolean {
    return this.atoInicialProtegido === componente;
  }

  /**
   * Normaliza componentes para estrutura v2.0
   */
  private normalizarComponentes(modalidade: any): ComponenteTabelaPadraoDTO[] {
    if (modalidade.componentes && Array.isArray(modalidade.componentes)) {
      return modalidade.componentes;
    }
    
    if (modalidade.COMPONENTES && Array.isArray(modalidade.COMPONENTES)) {
      const primeiroItem = modalidade.COMPONENTES[0];
      const jaCamelCase = primeiroItem && primeiroItem.codigoComponente !== undefined;
      
      if (jaCamelCase) {
        console.info(`API retornando estrutura híbrida: COMPONENTES com ${modalidade.COMPONENTES.length} item(ns) em camelCase`);
        return modalidade.COMPONENTES;
      } else {
        console.warn(
          `API retornando estrutura v1.0 (MAIÚSCULAS). Convertendo ${modalidade.COMPONENTES.length} componente(s) para v2.0...`
        );
        
        return modalidade.COMPONENTES.map((comp: any) => ({
          codigoComponente: comp.CODIGO_COMPONENTE ?? '',
          nomeComponente: comp.NOME_COMPONENTE ?? 'Componente sem nome',
          tipoComponente: comp.TIPO_COMPONENTE ?? 'PARCELA',
          grupoComponente: this.inferirGrupoComponente(comp.NOME_COMPONENTE),
          quantidade: comp.PRAZO_MESES || 1,
          periodicidade: 1, // Default mensal
          percentual: comp.PERCENTUAL || 0,
          valorMinimo: comp.VALOR_MINIMO ?? null,
          valorMaximo: comp.VALOR_MAXIMO ?? null,
          prazoMeses: comp.PRAZO_MESES ?? 1,
          ordem: comp.ORDEM ?? 999,
          ativo: comp.ATIVO ?? true,
          valor: null,
          valorParcela: null
        }));
      }
    }
    
    console.error('Estrutura de componentes inválida:', modalidade);
    return [];
  }

  /**
   * Infere o grupo do componente baseado no nome (FALLBACK para v1.0)
   */
  private inferirGrupoComponente(nomeComponente: string | undefined | null): number {
    if (!nomeComponente) {
      console.warn('Nome do componente não informado, usando grupo padrão (Opcional)');
      return 7;
    }
    
    const nome = nomeComponente.toUpperCase();
    if (nome.includes('ATO') || nome.includes('SINAL')) return 1; // Entrada
    if (nome.includes('MENSAL') || nome.includes('PARCELA')) return 2; // Mensal
    if (nome.includes('INTERMEDIARIA')) return 3; // Intermediária
    if (nome.includes('UNICA') || nome.includes('ÚLTIMA')) return 6; // Única
    return 7; // Opcional
  }

  /**
   * Calcula vencimento inicial baseado na regra
   */
  private calcularVencimentoInicial(regra: ComponenteTabelaPadraoDTO): Date {
    const hoje = new Date();
    const dia = 15;
    
    if (regra.tipoComponente === 'ENTRADA') {
      return new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    }
    
    if (regra.tipoComponente === 'PARCELA') {
      return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    }
    
    if (regra.tipoComponente === 'COTA_UNICA') {
      const mesesAfrente = regra.prazoMeses || 48;
      return new Date(hoje.getFullYear(), hoje.getMonth() + mesesAfrente, dia);
    }
    
    return hoje;
  }

  /**
   * Recalcula valor total e percentual quando valor da parcela muda
   */
  onValorParcelaChange(componente: ComponenteFormulario): void {
    componente.valorTotal = this.arredondarMoeda(componente.valorParcela * componente.quantidade);
    this.atualizarVencimentosComponente(componente);
    
    this.recalcularSimulacao();
  }

  getValorParcelaInput(comp: ComponenteFormulario): string {
    return this.valorParcelaInputMap.get(comp) ?? this.formatarValorParcelaExibicao(comp.valorParcela);
  }

  onValorParcelaFocus(comp: ComponenteFormulario): void {
    this.valorParcelaInputMap.set(comp, this.formatarValorParcelaEdicao(comp.valorParcela));
  }

  onValorParcelaInputChange(comp: ComponenteFormulario, valorDigitado: string): void {
    this.valorParcelaInputMap.set(comp, valorDigitado);
    comp.valorParcela = this.parseValorMonetario(valorDigitado);
    this.simulacaoAlterada = true;
    this.onValorParcelaChange(comp);
  }

  onValorParcelaBlur(comp: ComponenteFormulario): void {
    this.valorParcelaInputMap.set(comp, this.formatarValorParcelaExibicao(comp.valorParcela));
  }



  /**
   * Recalcula valor total e percentual quando quantidade muda
   */
  onQuantidadeChange(componente: ComponenteFormulario): void {
    this.simulacaoAlterada = true;

    componente.valorTotal = this.arredondarMoeda(componente.valorParcela * componente.quantidade);
    
    this.atualizarVencimentosComponente(componente);
    
    this.recalcularSimulacao();
  }

  /**
   * Manipula mudança de data de vencimento
   */
  onVencimentoChange(componente: ComponenteFormulario): void {
    this.simulacaoAlterada = true;

    this.atualizarVencimentosComponente(componente);
    
    // Recalcula totais, comparação e validações de aprovação automática
    this.recalcularSimulacao();
  }

  private recalcularSimulacao(): void {
    this.calcularTotais();
    this.gerarComparacao();
    this.atualizarGrafico();

    if (!this.possuiDesconto && this.ajusteDiferencaDialogVisible) {
      this.fecharDialogAjusteDiferenca();
    }
  }

  possuiDetalhamentoVencimentos(componente: ComponenteFormulario): boolean {
    return !!componente.listaVencimentos && componente.listaVencimentos.length > 1;
  }

  isDetalhamentoExpandido(componente: ComponenteFormulario): boolean {
    return this.detalhamentoExpandidoMap.has(componente);
  }

  toggleDetalhamentoVencimentos(componente: ComponenteFormulario): void {
    if (!this.possuiDetalhamentoVencimentos(componente)) {
      this.detalhamentoExpandidoMap.delete(componente);
      return;
    }

    if (this.isDetalhamentoExpandido(componente)) {
      this.detalhamentoExpandidoMap.delete(componente);
      return;
    }

    this.detalhamentoExpandidoMap.add(componente);
  }

  private formatarValorParcelaEdicao(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    return valor.toFixed(2).replace('.', ',');
  }

  private formatarValorParcelaExibicao(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  private parseValorMonetario(valor: string | null | undefined): number {
    if (!valor) {
      return 0;
    }

    const textoLimpo = valor.trim().replace(/[^\d,.-]/g, '');
    if (!textoLimpo) {
      return 0;
    }

    const ultimoSeparador = Math.max(textoLimpo.lastIndexOf(','), textoLimpo.lastIndexOf('.'));
    let normalizado = textoLimpo;

    if (ultimoSeparador >= 0) {
      const inteiro = textoLimpo.slice(0, ultimoSeparador).replace(/[.,]/g, '');
      const decimal = textoLimpo.slice(ultimoSeparador + 1).replace(/[.,]/g, '');
      normalizado = `${inteiro || '0'}.${decimal}`;
    } else {
      normalizado = textoLimpo.replace(/[.,]/g, '');
    }

    const valorNumerico = Number(normalizado);
    return Number.isFinite(valorNumerico) ? valorNumerico : 0;
  }

  private arredondarMoeda(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private valorParaCentavos(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100);
  }

  private calcularValorParcelaBase(valorTotal: number, quantidade: number): number {
    const quantidadeSegura = Math.max(Math.trunc(quantidade || 0), 1);
    const valorTotalCentavos = this.valorParaCentavos(valorTotal);
    const valorBaseCentavos = Math.floor(valorTotalCentavos / quantidadeSegura);

    return valorBaseCentavos / 100;
  }

  private distribuirValorTotalEmParcelas(valorTotal: number, quantidade: number): number[] {
    const quantidadeSegura = Math.max(Math.trunc(quantidade || 0), 1);
    const valorTotalCentavos = this.valorParaCentavos(valorTotal);
    const valorBaseCentavos = Math.floor(valorTotalCentavos / quantidadeSegura);
    const parcelas = Array.from({ length: quantidadeSegura }, () => valorBaseCentavos);
    const somaParcelasIniciais = valorBaseCentavos * (quantidadeSegura - 1);

    parcelas[quantidadeSegura - 1] = valorTotalCentavos - somaParcelasIniciais;

    return parcelas.map(valorCentavos => valorCentavos / 100);
  }

  /**
   * Calcula totais da simulação
   */
  calcularTotais(): void {
    const componentesComValor = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    
    this.valorProposta = componentesComValor.reduce(
      (sum, c) => sum + c.valorTotal, 0
    );
    
    const houveAlteracao = this.simulacaoAlterada;
    
    componentesComValor.forEach(componente => {
      const nomeUpper = componente.nomeComponente.toUpperCase();
      
      if (nomeUpper.includes('ATO') || nomeUpper.includes('SINAL')) {
        componente.percentual = this.valorProposta > 0 
          ? (componente.valorTotal / this.valorProposta) * 100 
          : 0;
        return;
      }
      
      if (houveAlteracao) {
        componente.percentual = this.valorProposta > 0 
          ? (componente.valorTotal / this.valorProposta) * 100 
          : 0;
        return;
      }
      
      const temPercentualPadrao = componente.regra.percentual !== null && 
                                   componente.regra.percentual !== undefined;
      
      if (temPercentualPadrao) {
        componente.percentual = componente.regra.percentual;
      } else {
        componente.percentual = this.valorProposta > 0 
          ? (componente.valorTotal / this.valorProposta) * 100 
          : 0;
      }
    });
    
    if (componentesComValor.length > 0) {
      const somaPercentuais = componentesComValor.reduce((sum, c) => sum + c.percentual, 0);
      const diferenca = 100 - somaPercentuais;
      
      if (Math.abs(diferenca) > 0.01) {
        const ultimoParaAjustar = [...componentesComValor]
          .reverse()
          .find(c => !c.nomeComponente.toUpperCase().includes('ATO') && 
                     !c.nomeComponente.toUpperCase().includes('SINAL'));
        
        if (ultimoParaAjustar) {
          ultimoParaAjustar.percentual += diferenca;
        }
      }
    }
    
    // Diferença em relação à tabela padrão
    this.diferenca = this.valorProposta - this.valorTabela;
    this.percentualDiferenca = this.valorTabela > 0 
      ? ((this.diferenca / this.valorTabela) * 100) 
      : 0;
    
    this.possuiDesconto = this.diferenca < 0;
    this.possuiAcrescimo = this.diferenca > 0;
    
    const dataReferencia = new Date();
    this.adiantamento = componentesComValor
      .filter(c => {
        if (!c.vencimento) return false;
        const venc = new Date(c.vencimento);
        return venc.getMonth() === dataReferencia.getMonth() &&
               venc.getFullYear() === dataReferencia.getFullYear();
      })
      .reduce((sum, c) => sum + c.valorTotal, 0);
    
    this.saldoDevedor = this.valorProposta - this.adiantamento;
    
    this.executarValidacoesAprovacao();
  }

  /**
   * Gera lista de vencimentos baseado na periodicidade
   */
  gerarVencimentos(
    dataBase: Date | null,
    quantidade: number,
    periodicidade: number,
    valorParcela: number,
    valorTotal?: number
  ): import('../../../core/models/proposta-simplificada.model').VencimentoDTO[] {
    const vencimentos: import('../../../core/models/proposta-simplificada.model').VencimentoDTO[] = [];
    const quantidadeSegura = Math.max(Math.trunc(quantidade || 0), 0);
    const valorTotalCalculado = valorTotal !== undefined
      ? this.arredondarMoeda(valorTotal)
      : this.arredondarMoeda(valorParcela * quantidadeSegura);
    
    if (!dataBase || quantidadeSegura <= 0) {
      return vencimentos;
    }
    
    if (periodicidade === 0) {
      vencimentos.push({
        numeroParcela: 1,
        dataVencimento: new Date(dataBase),
        valor: valorTotalCalculado
      });
      return vencimentos;
    }

    const valoresParcelas = this.distribuirValorTotalEmParcelas(valorTotalCalculado, quantidadeSegura);
    for (let i = 0; i < quantidadeSegura; i++) {
      const dataVencimento = new Date(dataBase);
      
      // Adicionar (i * periodicidade) meses à data base
      dataVencimento.setMonth(dataVencimento.getMonth() + (i * periodicidade));
      
      vencimentos.push({
        numeroParcela: i + 1,
        dataVencimento: dataVencimento,
        valor: valoresParcelas[i]
      });
    }
    
    return vencimentos;
  }

  /**
   * Atualiza as datas de vencimento de um componente
   * Chamado quando usuário altera vencimento, quantidade ou periodicidade
   */
  atualizarVencimentosComponente(componente: ComponenteFormulario): void {
    if (!componente.vencimento || !componente.quantidade || componente.periodicidade === undefined) {
      componente.listaVencimentos = [];
      return;
    }
    
    componente.listaVencimentos = this.gerarVencimentos(
      componente.vencimento,
      componente.quantidade,
      componente.periodicidade,
      componente.valorParcela,
      componente.valorTotal
    );
  }

  /**
   * Valida se percentuais calculados estão próximos dos percentuais da API
   */
  private validarPercentuaisComponentes(componentes: ComponenteFormulario[]): void {
    componentes.forEach(componente => {
      const nomeUpper = componente.nomeComponente.toUpperCase();
      if (nomeUpper.includes('ATO') || nomeUpper.includes('SINAL')) {
        return;
      }
      
      // Só validar componentes que têm percentual definido na API
      const percentualAPI = componente.regra.percentual;
      if (percentualAPI === null || percentualAPI === undefined || percentualAPI === 0) {
        return;
      }
      
      const percentualCalculado = componente.percentual;
      
      const diferenca = percentualCalculado - percentualAPI;
      const diferencaAbsoluta = Math.abs(diferenca);
      
      if (diferencaAbsoluta > 0.01) {
        const direcao = diferenca > 0 ? 'acima' : 'abaixo';
        const mensagem = `${componente.nomeComponente}: ${percentualCalculado.toFixed(2)}% está ${diferencaAbsoluta.toFixed(2)}% ${direcao} do esperado (${percentualAPI.toFixed(2)}% da tabela padrão)`;
        
        componente.mensagensErro = componente.mensagensErro || [];
        componente.mensagensErro.push(mensagem);
        componente.erroValidacao = mensagem;
      }
    });
  }

  /**
   * Executa todas as validações de aprovação automática
   */
  private executarValidacoesAprovacao(): void {
    this.violacoesAprovacao = [];
    
    this.componentes.forEach(c => {
      c.mensagensErro = [];
      c.erroValidacao = null;
    });
    
    const componentesSelecionados = this.componentes.filter(c => 
      c.valorParcela > 0 || c.percentual > 0
    );
    
    this.validarPercentuaisComponentes(componentesSelecionados);
    
    this.validarSinalMinimo(componentesSelecionados);
    
    this.validarArrecadacao13PrimeirosMeses(componentesSelecionados);
    
    this.validarArrecadacao13UltimosMeses(componentesSelecionados);
    
    this.validarUltimaParcelaMaxima(componentesSelecionados);
    
    this.validarDescontoAcrescimo();
    
    this.validarAtoMinimoPorTipologia(componentesSelecionados);
    
    this.validarMensalMinima(componentesSelecionados);
  }

  /**
   * Valida sinal mínimo (ATO + SINAL)
   */
  private validarSinalMinimo(componentes: ComponenteFormulario[]): void {
    const componentesAto = componentes.filter(c => c.nomeComponente.toUpperCase().includes('ATO'));
    const componentesSinal = componentes.filter(c => c.nomeComponente.toUpperCase().includes('SINAL'));
    
    if (componentesSinal.length === 0) {
      return;
    }
    
    const primeiroSinal = componentesSinal[0];
    const percentualMinimoAPI = primeiroSinal.regra.percentual ?? this.configuracoesAprovacao.percentualSinalMinimo;
    
    const valorAto = componentesAto.reduce((sum, c) => sum + c.valorTotal, 0);
    const valorSinal = componentesSinal.reduce((sum, c) => sum + c.valorTotal, 0);
    
    const totalSinal = valorAto + valorSinal;
    
    const percentualCalculado = this.valorTabela > 0 
      ? (totalSinal / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado >= percentualMinimoAPI;
    const diferenca = Math.abs(percentualCalculado - percentualMinimoAPI);
    
    let mensagem = `Sinal (ATO + COTA SINAL): ${percentualCalculado.toFixed(2)}%`;
    if (!conforme) {
      mensagem += ` (${diferenca.toFixed(2)}% abaixo do mínimo de ${percentualMinimoAPI.toFixed(2)}%)`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.SINAL_MINIMO,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: percentualMinimoAPI,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
    
    if (!conforme) {
      componentesAto.forEach(ato => {
        ato.mensagensErro = ato.mensagensErro || [];
        ato.mensagensErro.push(mensagem);
        ato.erroValidacao = mensagem;
      });
      
      componentesSinal.forEach(sinal => {
        sinal.mensagensErro = sinal.mensagensErro || [];
        sinal.mensagensErro.push(mensagem);
        sinal.erroValidacao = mensagem;
      });
    }
  }

  /**
   * Valida arrecadação 13 primeiros meses
   */
  private validarArrecadacao13PrimeirosMeses(componentes: ComponenteFormulario[]): void {
    const componentesOrdenados = [...componentes]
      .filter(c => c.vencimento)
      .sort((a, b) => a.vencimento!.getTime() - b.vencimento!.getTime());
    
    if (componentesOrdenados.length === 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Sem vencimentos definidos',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const primeiroVencimento = componentesOrdenados[0].vencimento!;
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);
    
    if (!dataFinalContrato) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Não foi possível calcular data final do contrato',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    
    if (duracaoEmMeses <= 13) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Contrato com ${duracaoEmMeses} meses de duração (regra não se aplica para contratos <= 13 meses)`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const dataLimite = new Date(primeiroVencimento);
    dataLimite.setMonth(dataLimite.getMonth() + 12);
    
    const valorPrimeiros13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      primeiroVencimento,
      dataLimite
    );
    
    const percentualCalculado = this.valorTabela > 0 
      ? (valorPrimeiros13Meses / this.valorTabela) * 100 
      : 0;
    
    const percentualMinimo = this.configuracoesAprovacao.percentual13PrimeirosMesesMinimo;
    const conforme = percentualCalculado >= percentualMinimo;
    const diferenca = Math.abs(percentualCalculado - percentualMinimo);
    
    let mensagem = `Arrecadação 13 primeiros meses: ${percentualCalculado.toFixed(2)}%`;
    if (!conforme) {
      mensagem += ` (${diferenca.toFixed(2)}% abaixo do mínimo de ${percentualMinimo}%)`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: percentualMinimo,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
  }

  /**
   * Valida arrecadação 13 últimos meses
   */
  private validarArrecadacao13UltimosMeses(componentes: ComponenteFormulario[]): void {
    const componentesOrdenados = [...componentes]
      .filter(c => c.vencimento)
      .sort((a, b) => b.vencimento!.getTime() - a.vencimento!.getTime());
    
    if (componentesOrdenados.length === 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Sem vencimentos definidos',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const primeiroVencimento = componentesOrdenados[componentesOrdenados.length - 1].vencimento!;
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);
    
    if (!dataFinalContrato) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Não foi possível calcular data final do contrato',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    
    if (duracaoEmMeses <= 13) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Contrato com ${duracaoEmMeses} meses de duração (regra não se aplica para contratos <= 13 meses)`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const ultimoVencimento = dataFinalContrato;
    const dataLimite = new Date(ultimoVencimento);
    dataLimite.setMonth(dataLimite.getMonth() - 12);
    
    const valorUltimos13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      dataLimite,
      ultimoVencimento
    );
    
    const percentualCalculado = this.valorTabela > 0 
      ? (valorUltimos13Meses / this.valorTabela) * 100 
      : 0;
    
    const percentualMaximo = this.configuracoesAprovacao.percentual13UltimosMesesMaximo;
    const conforme = percentualCalculado <= percentualMaximo;
    const diferenca = Math.abs(percentualCalculado - percentualMaximo);
    
    let mensagem = `Arrecadação últimos 13 meses: ${percentualCalculado.toFixed(2)}%`;
    if (!conforme) {
      mensagem += ` (${diferenca.toFixed(2)}% acima do máximo de ${percentualMaximo}%)`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: percentualMaximo,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
  }

  /**
   * Valida última parcela máxima (COTA ÚNICA)
   */
  private validarUltimaParcelaMaxima(componentes: ComponenteFormulario[]): void {
    const cotaUnica = componentes.find(c => 
      c.nomeComponente.toUpperCase().includes('UNICA') || 
      c.nomeComponente.toUpperCase().includes('ÚLTIMA')
    );
    
    if (!cotaUnica) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ULTIMA_PARCELA_MAXIMA,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Componente COTA ÚNICA não encontrado',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const percentualMaximoAPI = cotaUnica.regra.percentual ?? this.configuracoesAprovacao.percentualUltimaParcelaMaximo;
    
    const percentualCalculado = this.valorTabela > 0 
      ? (cotaUnica.valorTotal / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado <= percentualMaximoAPI;
    const diferenca = Math.abs(percentualCalculado - percentualMaximoAPI);
    
    let mensagem = `Última parcela (COTA ÚNICA): ${percentualCalculado.toFixed(2)}%`;
    if (!conforme) {
      mensagem += ` (${diferenca.toFixed(2)}% acima do máximo de ${percentualMaximoAPI.toFixed(2)}%)`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ULTIMA_PARCELA_MAXIMA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: percentualMaximoAPI,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
    
    if (!conforme && cotaUnica) {
      cotaUnica.mensagensErro = cotaUnica.mensagensErro || [];
      cotaUnica.mensagensErro.push(mensagem);
      cotaUnica.erroValidacao = mensagem;
    }
  }

  /**
   * Valida desconto/acréscimo aplicado
   */
  private validarDescontoAcrescimo(): void {
    const diferenca = this.valorProposta - this.valorTabela;
    
    if (Math.abs(diferenca) < 0.01) {
      // Sem desconto nem acréscimo
      return;
    }
    
    if (diferenca < 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.DESCONTO_APLICADO,
        status: StatusRegraValidacao.VIOLACAO,
        valorCalculado: this.valorProposta,
        valorLimite: this.valorTabela,
        mensagem: `O valor da proposta ${this.formatarMoeda(this.valorProposta)} é menor que o valor de tabela da unidade ${this.formatarMoeda(this.valorTabela)}. Diferença de ${this.formatarMoeda(Math.abs(diferenca))}`,
        bloqueiaAprovacao: true
      });
    } else {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ACRESCIMO_APLICADO,
        status: StatusRegraValidacao.VIOLACAO,
        valorCalculado: this.valorProposta,
        valorLimite: this.valorTabela,
        mensagem: `O valor da proposta ${this.formatarMoeda(this.valorProposta)} é maior que o valor de tabela da unidade ${this.formatarMoeda(this.valorTabela)}. Diferença de ${this.formatarMoeda(diferenca)}`,
        bloqueiaAprovacao: true
      });
    }
  }

  /**
   * Valida ATO mínimo por tipologia
   */
  private validarAtoMinimoPorTipologia(componentes: ComponenteFormulario[]): void {
    const ato = componentes.find(c => c.nomeComponente.toUpperCase().includes('ATO'));
    
    if (!ato) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Componente ATO não encontrado ou não selecionado',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const tipologia = this.proposta?.empreendimento?.tipologia || '';
    const valorMinimoAPI = ato.regra.valor ?? this.configuracoesAprovacao.valoresAtoMinimosPorTipologia[tipologia] ?? 0;
    
    if (valorMinimoAPI === 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Tipologia "${tipologia}" não possui valor mínimo configurado`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const conforme = ato.valorTotal >= valorMinimoAPI;
    const diferenca = Math.abs(ato.valorTotal - valorMinimoAPI);
    
    let mensagem = `ATO: ${this.formatarMoeda(ato.valorTotal)}`;
    if (!conforme) {
      mensagem += ` (${this.formatarMoeda(diferenca)} abaixo do mínimo de ${this.formatarMoeda(valorMinimoAPI)} para tipologia "${tipologia}")`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      valorCalculado: ato.valorTotal,
      valorLimite: valorMinimoAPI,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
    
    if (!conforme) {
      ato.mensagensErro = ato.mensagensErro || [];
      ato.mensagensErro.push(mensagem);
      ato.erroValidacao = mensagem;
    }
  }

  /**
   * Valida valor mínimo COTA MENSAL
   */
  private validarMensalMinima(componentes: ComponenteFormulario[]): void {
    const mensal = componentes.find(c => 
      c.nomeComponente.toUpperCase().includes('MENSAL')
    );
    
    if (!mensal) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.MENSAL_MINIMA,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Componente COTA MENSAL não encontrado',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const valorMinimoAPI = 1000.00;
    
    const conforme = mensal.valorParcela >= valorMinimoAPI;
    const diferenca = Math.abs(mensal.valorParcela - valorMinimoAPI);
    
    let mensagem = `COTA MENSAL: ${this.formatarMoeda(mensal.valorParcela)}`;
    if (!conforme) {
      mensagem += ` (${this.formatarMoeda(diferenca)} abaixo do mínimo de ${this.formatarMoeda(valorMinimoAPI)})`;
    }
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.MENSAL_MINIMA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      valorCalculado: mensal.valorParcela,
      valorLimite: valorMinimoAPI,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
    
    // Marcar componente COTA MENSAL com erro
    if (!conforme) {
      mensal.mensagensErro = mensal.mensagensErro || [];
      mensal.mensagensErro.push(mensagem);
      mensal.erroValidacao = mensagem;
    }
  }

  /**
   * Gera métricas de comparação entre tabela padrão e proposta
   */
  gerarComparacao(): void {
    if (!this.proposta) return;
    
    const componentesAtivos = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    
    const componentesNormalizados = this.componentesNormalizadosCache.length > 0
      ? this.componentesNormalizadosCache
      : this.normalizarComponentes(this.proposta.modalidadeTabelaPadrao);
    
    const metricas: ComparacaoMetricaDTO[] = [];
    
    const sinalComponents = componentesAtivos.filter(
      c => c.nomeComponente.toUpperCase().includes('ATO') || c.nomeComponente.toUpperCase().includes('SINAL')
    );
    const percentualSinal = sinalComponents.reduce((sum, c) => sum + c.percentual, 0);
    const regraSinal = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente.toUpperCase().includes('SINAL'));
    const minSinal = regraSinal?.percentual || 5;
    
    metricas.push({
      metrica: 'Sinal Mínimo (Ato+Sinal)',
      limite: `${minSinal.toFixed(2)}%`,
      proposta: `${percentualSinal.toFixed(2)}%`,
      status: percentualSinal >= minSinal ? 'OK' : 'VIOLACAO'
    });
    
    const percentualMinimo13PrimeirosMeses = this.configuracoesAprovacao.percentual13PrimeirosMesesMinimo;
    const percentualPrimeiros13Meses = this.calcularPercentualArrecadacao13PrimeirosMeses(componentesAtivos);
    
    metricas.push({
      metrica: 'Arrecadação Primeiros 13 Meses',
      limite: `${percentualMinimo13PrimeirosMeses.toFixed(2)}%`,
      proposta: percentualPrimeiros13Meses === null ? 'N/A' : `${percentualPrimeiros13Meses.toFixed(2)}%`,
      status: percentualPrimeiros13Meses === null
        ? 'ALERTA'
        : percentualPrimeiros13Meses >= percentualMinimo13PrimeirosMeses ? 'OK' : 'VIOLACAO'
    });
    
    const percentualMaximo13UltimosMeses = this.configuracoesAprovacao.percentual13UltimosMesesMaximo;
    const percentualUltimos13Meses = this.calcularPercentualArrecadacao13UltimosMeses(componentesAtivos);
    
    metricas.push({
      metrica: 'Arrecadação Últimos 13 Meses',
      limite: `${percentualMaximo13UltimosMeses.toFixed(2)}%`,
      proposta: percentualUltimos13Meses === null ? 'N/A' : `${percentualUltimos13Meses.toFixed(2)}%`,
      status: percentualUltimos13Meses === null
        ? 'ALERTA'
        : percentualUltimos13Meses <= percentualMaximo13UltimosMeses ? 'OK' : 'VIOLACAO'
    });
    
    const cotaUnica = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'COTA UNICA');
    const maxCotaUnica = cotaUnica?.percentual || 10;
    const compCotaUnica = componentesAtivos.find(c => c.nomeComponente === 'COTA UNICA');
    const percentualCotaUnica = compCotaUnica?.percentual || 0;
    
    metricas.push({
      metrica: 'Última Parcela',
      limite: `${maxCotaUnica.toFixed(2)}%`,
      proposta: `${percentualCotaUnica.toFixed(2)}%`,
      status: percentualCotaUnica <= maxCotaUnica ? 'OK' : 'VIOLACAO'
    });
    
    this.comparacao = metricas;
  }

  private calcularPercentualArrecadacao13PrimeirosMeses(componentes: ComponenteFormulario[]): number | null {
    const componentesOrdenados = [...componentes]
      .filter(c => c.vencimento)
      .sort((a, b) => a.vencimento!.getTime() - b.vencimento!.getTime());

    if (!componentesOrdenados.length) {
      return null;
    }

    const primeiroVencimento = componentesOrdenados[0].vencimento!;
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);

    if (!dataFinalContrato) {
      return null;
    }

    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    if (duracaoEmMeses <= 13) {
      return null;
    }

    const dataLimite = new Date(primeiroVencimento);
    dataLimite.setMonth(dataLimite.getMonth() + 12);

    const valorPrimeiros13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      primeiroVencimento,
      dataLimite
    );

    return this.valorTabela > 0
      ? Number(((valorPrimeiros13Meses / this.valorTabela) * 100).toFixed(2))
      : 0;
  }

  private calcularPercentualArrecadacao13UltimosMeses(componentes: ComponenteFormulario[]): number | null {
    const componentesOrdenados = [...componentes]
      .filter(c => c.vencimento)
      .sort((a, b) => b.vencimento!.getTime() - a.vencimento!.getTime());

    if (!componentesOrdenados.length) {
      return null;
    }

    const primeiroVencimento = componentesOrdenados[componentesOrdenados.length - 1].vencimento!;
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);

    if (!dataFinalContrato) {
      return null;
    }

    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    if (duracaoEmMeses <= 13) {
      return null;
    }

    const dataLimite = new Date(dataFinalContrato);
    dataLimite.setMonth(dataLimite.getMonth() - 12);

    const valorUltimos13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      dataLimite,
      dataFinalContrato
    );

    return this.valorTabela > 0
      ? Number(((valorUltimos13Meses / this.valorTabela) * 100).toFixed(2))
      : 0;
  }

  /**
   * Restaura valores da tabela padrão
   */
  restaurarTabela(): void {
    this.inicializarComponentes();
    this.calcularTotais();
    this.gerarComparacao();
    this.atualizarGrafico();
    this.fecharDialogAjusteDiferenca();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Tabela Restaurada',
      detail: 'Os valores foram restaurados para a tabela padrão'
    });
  }

  limparDadosInformados(): void {
    this.restaurarTabela();
  }

  /**
   * Duplica um componente
   */
  duplicarComponente(componente: ComponenteFormulario): void {
    this.simulacaoAlterada = true;
    const index = this.componentes.indexOf(componente);
    const novoComponente: ComponenteFormulario = {
      ...componente,
      codigoComponente: `${componente.codigoComponente}_${Date.now()}`,
      selecionado: true,
      erroValidacao: null,
      mensagensErro: [],
      listaVencimentos: componente.listaVencimentos ? [...componente.listaVencimentos] : []
    };
    
    this.componentes.splice(index + 1, 0, novoComponente);
    this.recalcularSimulacao();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: `Componente "${componente.nomeComponente}" duplicado com sucesso`
    });
  }

  aplicarDiferencaRestante(): void {
    const valorRestante = this.valorRestanteParaAjuste;

    if (valorRestante <= 0.01) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sem ajuste',
        detail: 'Não há diferença restante para atribuir.'
      });
      return;
    }

    if (!this.codigoComponenteAjusteDiferenca) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Selecione um componente',
        detail: 'Escolha o componente que receberá o valor restante.'
      });
      return;
    }

    const componente = this.componentes.find(c => c.codigoComponente === this.codigoComponenteAjusteDiferenca);
    if (!componente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Componente não encontrado',
        detail: 'O componente selecionado não está mais disponível para ajuste.'
      });
      this.codigoComponenteAjusteDiferenca = null;
      return;
    }

    const quantidade = Math.max(componente.quantidade || 1, 1);
    this.simulacaoAlterada = true;
    componente.valorTotal = this.arredondarMoeda(componente.valorTotal + valorRestante);
    componente.valorParcela = this.calcularValorParcelaBase(componente.valorTotal, quantidade);

    this.valorParcelaInputMap.set(componente, this.formatarValorParcelaExibicao(componente.valorParcela));
    this.atualizarVencimentosComponente(componente);
    this.recalcularSimulacao();

    this.messageService.add({
      severity: 'success',
      summary: 'Ajuste aplicado',
      detail: `${this.formatarMoeda(valorRestante)} foi atribuído ao componente "${componente.nomeComponente}".`
    });

    this.fecharDialogAjusteDiferenca();

    this.codigoComponenteAjusteDiferenca = null;
    this.opcoesAjusteDiferencaFiltradas = [];
  }

  /**
   * Remove um componente (marca como não selecionado)
   */
  excluirComponente(componente: ComponenteFormulario): void {
    if (this.isExclusaoBloqueada(componente)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Remoção não permitida',
        detail: 'O primeiro ATO carregado na tela não pode ser removido.'
      });
      return;
    }

    this.appConfirmationService.confirmDelete(`remover o componente "${componente.nomeComponente}" da simulação`)
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmado) => {
        if (!confirmado) {
          return;
        }

        this.simulacaoAlterada = true;
        const index = this.componentes.indexOf(componente);
        if (index > -1) {
          this.componentes.splice(index, 1);
        }

        if (this.codigoComponenteAjusteDiferenca === componente.codigoComponente) {
          this.codigoComponenteAjusteDiferenca = null;
        }
        
        this.recalcularSimulacao();
        this.separarComponentes();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Componente "${componente.nomeComponente}" removido da simulação`
        });
      });
  }

  /**
   * Adiciona um componente disponível à simulação
   */
  adicionarComponenteDisponivel(componente: ComponenteTabelaPadraoDTO): void {
    this.simulacaoAlterada = true;
    const hoje = new Date();
    const vencimentoInicial = new Date(hoje);
    
    if (componente.periodicidade && componente.periodicidade > 0) {
      vencimentoInicial.setMonth(vencimentoInicial.getMonth() + componente.periodicidade);
    }
    
    const novoComponente: ComponenteFormulario = {
      codigoComponente: componente.codigoComponente + '_' + Date.now(),
      nomeComponente: componente.nomeComponente,
      tipoComponente: componente.tipoComponente,
      grupoComponente: componente.grupoComponente,
      periodicidade: componente.periodicidade,
      quantidade: 1,
      vencimento: vencimentoInicial,
      valorParcela: 0,
      percentual: 0,
      valorTotal: 0,
      selecionado: true,
      regra: componente,
      erroValidacao: null,
      mensagensErro: []
    };
    
    novoComponente.listaVencimentos = this.gerarVencimentos(
      vencimentoInicial,
      1,
      componente.periodicidade ?? 0,
      0,
      0
    );
    
    this.componentes.push(novoComponente);
    
    this.recalcularSimulacao();
    this.separarComponentes();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Componente Adicionado',
      detail: `${componente.nomeComponente} foi adicionado à simulação`
    });
  }

  /**
   * Filtra componentes disponíveis para o autocomplete
   */
  filtrarComponentesDisponiveis(event: any): void {
    const query = event.query?.toLowerCase() || '';
    
    if (!query || query.trim() === '') {
      this.componentesFiltrados = [...this.componentesDisponiveisParaAdicionar];
      return;
    }
    
    this.componentesFiltrados = this.componentesDisponiveisParaAdicionar.filter(comp => 
      comp.nomeComponente.toLowerCase().includes(query) ||
      comp.codigoComponente.toLowerCase().includes(query)
    );
  }

  /**
   * Evento disparado ao selecionar componente no autocomplete
   */
  onComponenteSelecionado(event: any): void {
    const componente = event as ComponenteTabelaPadraoDTO;
    
    if (componente) {
      this.adicionarComponenteDisponivel(componente);
      
      setTimeout(() => {
        this.componenteSelecionadoAutocomplete = null;
      }, 100);

      this.fecharDialogAdicionarComponente();
    }
  }

  /**
   * Mostra todos os componentes ao clicar no dropdown
   */
  onDropdownClickComponentes(): void {
    this.componentesFiltrados = [...this.componentesDisponiveisParaAdicionar];
  }

  /**
   * Verifica se há erros de validação
   */
  get temErrosValidacao(): boolean {
    return this.componentes.some(c => c.erroValidacao);
  }

  /**
   * Verifica se há violações na comparação
   */
  get temViolacoes(): boolean {
    return this.comparacao.some(c => c.status === 'VIOLACAO');
  }

  /**
   * Verifica se há violações que bloqueiam aprovação automática
   */
  get possuiViolacoesAprovacao(): boolean {
    return this.violacoesAprovacao.some(v => v.bloqueiaAprovacao);
  }
  
  get quantidadeViolacoesBloqueantes(): number {
    return this.violacoesAprovacao.filter(v => v.status === StatusRegraValidacao.VIOLACAO).length;
  }
  
  get quantidadeValidacoesConformes(): number {
    return this.violacoesAprovacao.filter(v => v.status === StatusRegraValidacao.CONFORME).length;
  }
  
  get quantidadeValidacoesNaoAplicaveis(): number {
    return this.violacoesAprovacao.filter(v => v.status === StatusRegraValidacao.NAO_APLICAVEL).length;
  }

  /**
   * Campos obrigatórios para validação (implementação da classe base)
   */
  getCamposObrigatorios(): Array<{ id: string; valor: any; label?: string }> {
    const campos: Array<{ id: string; valor: any; label?: string }> = [];
    
    this.componentes.forEach((comp, index) => {
      if (comp.valorParcela <= 0) {
        campos.push({
          id: `valorParcela_${index}`,
          valor: comp.valorParcela,
          label: `Valor da parcela - ${comp.nomeComponente}`
        });
      }
    });
    
    return campos;
  }

  /**
   * Gera PIX para o componente ATO
   */
  gerarPix(): void {
    const ato = this.componentes.find(c => c.nomeComponente === 'ATO');
    
    if (!ato || ato.valorParcela <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Informe o valor do ATO para gerar o PIX'
      });
      return;
    }
    
    this.gerandoPix = true;
    
    setTimeout(() => {
      this.gerandoPix = false;
      this.messageService.add({
        severity: 'success',
        summary: 'PIX Gerado',
        detail: 'QR Code do PIX gerado com sucesso'
      });
    }, 1500);
  }

  /**
   * Salva a proposta
   */
  salvar(): void {
    this.tentouSalvar = true;
    
    if (!this.validarFormulario()) {
      return;
    }
    
    if (this.temErrosValidacao) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validação',
        detail: 'Corrija os erros de validação antes de salvar'
      });
      return;
    }
    
    const request = this.montarRequest();
    this.salvando = true;

    this.resolverOperacaoSalvar(request).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.salvando = false)
    ).subscribe({
      next: (response) => {
        this.propostaId = response.id;
        if (this.proposta) {
          this.proposta.id = response.id;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: response.mensagem || 'Proposta salva com sucesso!'
        });
        
        setTimeout(() => {
          this.router.navigate(['/propostas/lista']);
        }, 1500);
      },
      error: (error) => {
        console.error('Erro ao salvar proposta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: this.obterMensagemErroSalvar(error)
        });
      }
    });
  }

  private resolverOperacaoSalvar(request: SalvarPropostaSimplificadaRequest): Observable<SalvarPropostaResponse> {
    if (this.propostaId) {
      return this.propostaService.atualizarPropostaSimplificada(this.propostaId, request);
    }

    return this.propostaService.buscarPropostaPorReserva(this.reservaId).pipe(
      tap((propostaExistente) => {
        this.propostaId = propostaExistente.id;
        if (this.proposta) {
          this.proposta.id = propostaExistente.id;
        }
      }),
      switchMap((propostaExistente) =>
        this.propostaService.atualizarPropostaSimplificada(propostaExistente.id, request)
      ),
      catchError((error) => {
        if (this.isPropostaNaoEncontrada(error)) {
          return this.propostaService.salvarPropostaSimplificada(request);
        }

        return throwError(() => error);
      })
    );
  }

  private isPropostaNaoEncontrada(error: any): boolean {
    const status = error?.status;
    const mensagem = (error?.error?.message || '').toString().toLowerCase();

    return status === 404 || (status === 400 && mensagem.includes('proposta nao encontrada'));
  }

  private obterMensagemErroSalvar(error: any): string {
    const mensagem = error?.error?.message;

    if (typeof mensagem === 'string' && mensagem.trim()) {
      return mensagem;
    }

    if (error?.status === 500) {
      return 'Não foi possível salvar a proposta. Verifique se já existe uma proposta para esta reserva.';
    }

    return 'Erro ao salvar proposta';
  }

  /**
   * Monta o request para salvar a proposta
   */
  private montarRequest(): SalvarPropostaSimplificadaRequest {
    // Enviar apenas componentes com valores preenchidos
    const componentesSelecionados = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    
    return {
      reservaId: this.reservaId,
      dataProposta: this.formatarDataISO(new Date()),
      valorTabela: this.valorTabela,
      valorProposta: this.valorProposta,
      desconto: this.possuiDesconto ? Math.abs(this.diferenca) : 0,
      acrescimo: this.possuiAcrescimo ? this.diferenca : 0,
      area: this.proposta?.empreendimento.area || 0,
      vagas: this.proposta?.empreendimento.vagas || 0,
      dataEntrega: this.proposta?.empreendimento.dataEntrega || '',
      componentes: componentesSelecionados.map(comp => ({
        codigoComponente: comp.codigoComponente.split('_')[0],
        quantidade: comp.quantidade,
        vencimento: comp.vencimento ? this.formatarDataISO(comp.vencimento) : '',
        valorParcela: comp.valorParcela
      }))
    };
  }

  /**
   * Formata data para ISO (YYYY-MM-DD)
   */
  private formatarDataISO(data: Date): string {
    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, '0');
    const day = String(data.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formata valor como moeda BRL
   */
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formata percentual
   */
  formatarPercentual(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }

  /**
   * Calcula diferença em meses entre duas datas
   */
  private calcularDiferencaMeses(dataInicio: Date, dataFim: Date): number {
    const anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const meses = dataFim.getMonth() - dataInicio.getMonth();
    return anos * 12 + meses;
  }

  /**
   * Calcula a data final do contrato
   */
  private calcularDataFinalContrato(componentes: ComponenteFormulario[]): Date | null {
    let dataFinal: Date | null = null;
    
    componentes.forEach(componente => {
      if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
        const ultimaParcela = componente.listaVencimentos[componente.listaVencimentos.length - 1];
        const dataUltimaParcela = new Date(ultimaParcela.dataVencimento);
        
        if (!dataFinal || dataUltimaParcela > dataFinal) {
          dataFinal = dataUltimaParcela;
        }
      } else if (componente.vencimento) {
        if (!dataFinal || componente.vencimento > dataFinal) {
          dataFinal = componente.vencimento;
        }
      }
    });
    
    return dataFinal;
  }

  /**
   * Calcula a soma de parcelas que vencem dentro do período
   */
  private calcularValorPorPeriodo(
    componentes: ComponenteFormulario[], 
    dataInicio: Date, 
    dataFim: Date
  ): number {
    let valorTotal = 0;
    
    componentes.forEach(componente => {
      if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
        componente.listaVencimentos.forEach(parcela => {
          const dataParcela = new Date(parcela.dataVencimento);
          if (dataParcela >= dataInicio && dataParcela <= dataFim) {
            valorTotal += parcela.valor;
          }
        });
      } else if (componente.vencimento && componente.vencimento >= dataInicio && componente.vencimento <= dataFim) {
        valorTotal += componente.valorTotal;
      }
    });
    
    return valorTotal;
  }

  /**
   * Formata data para exibição (dd/MM/yyyy)
   */
  formatarData(data: string | Date | null): string {
    if (!data) return '';
    const d = typeof data === 'string' ? new Date(data) : data;
    return d.toLocaleDateString('pt-BR');
  }

  /**
   * Retorna o nome legível de uma regra de validação
   */
  obterNomeRegra(tipo: TipoRegraValidacao): string {
    const nomes: Record<TipoRegraValidacao, string> = {
      [TipoRegraValidacao.SINAL_MINIMO]: 'Sinal Mínimo (ATO + SINAL)',
      [TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES]: 'Arrecadação 13 Primeiros Meses',
      [TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES]: 'Arrecadação 13 Últimos Meses',
      [TipoRegraValidacao.ULTIMA_PARCELA_MAXIMA]: 'Última Parcela Máxima (COTA ÚNICA)',
      [TipoRegraValidacao.DESCONTO_APLICADO]: 'Desconto Aplicado',
      [TipoRegraValidacao.ACRESCIMO_APLICADO]: 'Acréscimo Aplicado',
      [TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA]: 'ATO Mínimo por Tipologia',
      [TipoRegraValidacao.MENSAL_MINIMA]: 'Valor Mínimo COTA MENSAL'
    };
    return nomes[tipo] || tipo;
  }

  /**
   * Calcula o total de percentual da tabela padrão
   */
  calcularTotalPercentualTabelaPadrao(): number {
    return this.componentesTabelaPadrao.reduce(
      (sum, c) => sum + (c.percentual || 0), 
      0
    );
  }

  /**
   * Calcula o total de valor da tabela padrão
   */
  calcularTotalTabelaPadrao(): number {
    return this.componentesTabelaPadrao.reduce(
      (sum, c) => sum + (c.valor || 0), 
      0
    );
  }

  /**
   * Retorna a classe CSS baseada no status
   */
  getStatusClass(status: 'OK' | 'VIOLACAO' | 'ALERTA'): string {
    const classes: Record<string, string> = {
      'OK': 'status-ok',
      'VIOLACAO': 'status-violacao',
      'ALERTA': 'status-alerta'
    };
    return classes[status] || '';
  }

  /**
   * Retorna o ícone baseado no status
   */
  getStatusIcon(status: 'OK' | 'VIOLACAO' | 'ALERTA'): string {
    const icons: Record<string, string> = {
      'OK': 'pi pi-check-circle',
      'VIOLACAO': 'pi pi-times-circle',
      'ALERTA': 'pi pi-exclamation-triangle'
    };
    return icons[status] || '';
  }

  /**
   * Retorna descrição completa do empreendimento
   */
  get descricaoEmpreendimento(): string {
    if (!this.proposta?.empreendimento) return '';
    const emp = this.proposta.empreendimento;
    return `${emp.nomeEmpreendimento} - Bloco ${emp.bloco} - Unidade ${emp.unidade} - ${emp.tipoUnidade} ${emp.tipologia}`;
  }

  /**
   * Opções do gráfico
   */
  graficoOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset?.label || '';
            const valor = Number(context.parsed?.y || 0);
            return `${label}: ${this.formatarMoeda(valor)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) => this.formatarMoeda(Number(value))
        }
      }
    }
  };

  /**
   * Retorna dados para o gráfico de análise
   */
  getGraficoData(): any {
    const parcelasTabelaPadrao = this.extrairParcelasTabelaPadrao();
    const parcelasSimulacao = this.extrairParcelasSimulacao();
    const chaves = this.gerarChavesMeses(parcelasTabelaPadrao, parcelasSimulacao);
    const serieTabelaPadrao = this.construirSerieAcumulada(parcelasTabelaPadrao, chaves);
    const serieSimulacao = this.construirSerieAcumulada(parcelasSimulacao, chaves);
    const labels = this.gerarLabelsAcumulados(chaves);

    return {
      labels,
      datasets: [
        {
          label: 'Tabela Padrão',
          data: serieTabelaPadrao,
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.12)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.25
        },
        {
          label: 'Simulação',
          data: serieSimulacao,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.16)',
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.25
        }
      ]
    };
  }

  private atualizarGrafico(): void {
    this.graficoData = this.getGraficoData();
  }

  private gerarLabelsAcumulados(chaves: string[]): string[] {
    if (!chaves.length) {
      return ['Sem dados'];
    }

    return chaves.map(chave => this.formatarMesAno(chave));
  }

  private extrairParcelasTabelaPadrao(): Array<{ data: Date; valor: number }> {
    const parcelas: Array<{ data: Date; valor: number }> = [];

    this.componentesTabelaPadrao.forEach(componente => {
      if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
        componente.listaVencimentos.forEach(vencimento => {
          parcelas.push({
            data: new Date(vencimento.dataVencimento),
            valor: vencimento.valor
          });
        });
        return;
      }

      const dataBase = this.getPrimeiroVencimentoTabelaPadrao(componente);
      const quantidade = componente.quantidade || 1;
      const valorParcela = componente.valorParcela ?? ((componente.valor ?? 0) / quantidade);

      if (!dataBase || valorParcela <= 0) {
        return;
      }

      this.gerarVencimentos(
        dataBase,
        quantidade,
        componente.periodicidade ?? 0,
        valorParcela,
        componente.valor ?? this.arredondarMoeda(valorParcela * quantidade)
      )
        .forEach(vencimento => {
          parcelas.push({
            data: new Date(vencimento.dataVencimento),
            valor: vencimento.valor
          });
        });
    });

    return parcelas;
  }

  private extrairParcelasSimulacao(): Array<{ data: Date; valor: number }> {
    const parcelas: Array<{ data: Date; valor: number }> = [];

    this.componentes
      .filter(componente => componente.selecionado && componente.valorTotal > 0)
      .forEach(componente => {
        if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
          componente.listaVencimentos.forEach(vencimento => {
            parcelas.push({
              data: new Date(vencimento.dataVencimento),
              valor: vencimento.valor
            });
          });
          return;
        }

        if (!componente.vencimento) {
          return;
        }

        parcelas.push({
          data: new Date(componente.vencimento),
          valor: componente.valorTotal
        });
      });

    return parcelas;
  }

  private construirSerieAcumulada(parcelas: Array<{ data: Date; valor: number }>, chavesBase: string[]): number[] {
    if (!chavesBase.length) {
      return [0];
    }

    const valoresPorMes = new Map<string, number>();

    parcelas.forEach(parcela => {
      if (!parcela.data || parcela.valor <= 0) {
        return;
      }

      const chave = `${parcela.data.getFullYear()}-${String(parcela.data.getMonth() + 1).padStart(2, '0')}`;
      valoresPorMes.set(chave, (valoresPorMes.get(chave) ?? 0) + parcela.valor);
    });
    let acumulado = 0;

    return chavesBase.map(chave => {
      acumulado += valoresPorMes.get(chave) ?? 0;
      return Number(acumulado.toFixed(2));
    });
  }

  private gerarChavesMeses(
    parcelasTabelaPadrao: Array<{ data: Date; valor: number }>,
    parcelasSimulacao: Array<{ data: Date; valor: number }>
  ): string[] {
    const todasParcelas = [...parcelasTabelaPadrao, ...parcelasSimulacao]
      .filter(parcela => parcela.data instanceof Date && !Number.isNaN(parcela.data.getTime()))
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    if (!todasParcelas.length) {
      return [];
    }

    const primeiraData = new Date(todasParcelas[0].data.getFullYear(), todasParcelas[0].data.getMonth(), 1);
    const ultimaData = new Date(
      todasParcelas[todasParcelas.length - 1].data.getFullYear(),
      todasParcelas[todasParcelas.length - 1].data.getMonth(),
      1
    );

    const chaves: string[] = [];
    const cursor = new Date(primeiraData);

    while (cursor <= ultimaData) {
      chaves.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return chaves;
  }

  private formatarMesAno(chave: string): string {
    const [ano, mes] = chave.split('-').map(Number);
    const data = new Date(ano, (mes || 1) - 1, 1);

    return data.toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit'
    }).replace('.', '');
  }

  /**
   * Navega de volta para a lista
   */
  voltar(): void {
    this.router.navigate(['/propostas/lista']);
  }
}
