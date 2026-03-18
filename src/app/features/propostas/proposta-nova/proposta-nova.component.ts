import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { PropostaService } from '../../../core/services/proposta.service';
import {
  PropostaSimplificadaDTO,
  ComponenteFormulario,
  ComponenteTabelaPadraoDTO,
  ComponenteSimulacaoDTO,
  SalvarPropostaSimplificadaRequest,
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
  Periodicidade
} from '../../../core/models/proposta-simplificada.model';

/**
 * Componente de Proposta Simplificada com Simulação de Venda
 * Baseado no Mapa de Integração v2.1 - 17/03/2026
 * 
 * ✨ NOVIDADE v2.1: Valores Calculados Automaticamente!
 * - Backend retorna campos `valor` e `valorParcela` já calculados
 * - Frontend NÃO precisa mais calcular valores iniciais - apenas exibir
 * - Usuário pode ajustar valores manualmente após carregamento inicial
 */
@Component({
  selector: 'app-proposta-nova',
  templateUrl: './proposta-nova.component.html',
  styleUrls: ['./proposta-nova.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class PropostaNovaComponent extends BaseFormComponent implements OnInit, OnDestroy {
  // Dados da proposta
  proposta: PropostaSimplificadaDTO | null = null;
  reservaId!: number;
  
  // Estados
  carregando = false;
  override salvando = false;
  gerandoPix = false;
  
  // Tabela Padrão (readonly) - Apenas componentes com valor !== null (100% da unidade)
  componentesTabelaPadrao: ComponenteTabelaPadraoDTO[] = [];
  
  // Componentes Disponíveis (editável) - TODOS os componentes, incluindo ATO
  componentes: ComponenteFormulario[] = [];
  
  // 🆕 v2.2 - Separação de Componentes
  componenteAto: ComponenteFormulario | null = null;
  componentesDisponiveisParaAdicionar: ComponenteTabelaPadraoDTO[] = [];
  
  // 🆕 v2.4 - Componentes Disponíveis da API (17/03/2026)
  componentesDisponiveisAPI: ComponenteTabelaPadraoDTO[] = [];
  carregandoComponentesDisponiveis = false;
  
  // 🆕 v2.5 - Autocomplete de componentes (17/03/2026)
  componenteSelecionadoAutocomplete: ComponenteTabelaPadraoDTO | null = null;
  componentesFiltrados: ComponenteTabelaPadraoDTO[] = [];
  
  // Resumo da simulação
  valorTabela = 0;
  valorProposta = 0;
  diferenca = 0;
  percentualDiferenca = 0;
  possuiDesconto = false;
  possuiAcrescimo = false;
  adiantamento = 0;
  saldoDevedor = 0;
  
  // Comparação tabela vs proposta
  comparacao: ComparacaoMetricaDTO[] = [];
  
  // 📋 VALIDAÇÕES DE APROVAÇÃO AUTOMÁTICA
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
  
  // Controle de seções colapsáveis
  tabelaPadraoExpandida = false;
  
  // Labels e severidades
  readonly statusLabels = PROPOSTA_STATUS_LABELS;
  readonly statusSeverity = PROPOSTA_STATUS_SEVERITY;
  
  // Cache de componentes normalizados (evita reprocessamento)
  // ✨ Public para uso no template (tabela padrão)
  componentesNormalizadosCache: ComponenteTabelaPadraoDTO[] = [];
  
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propostaService: PropostaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
          this.inicializarComponentes();
          this.calcularTotais();
          this.gerarComparacao();
          
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
   * Filtra apenas ativos e ordena conforme configuração
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

          console.log(`✅ Carregados ${this.componentesDisponiveisAPI.length} componentes disponíveis da API`);
          
          // Atualizar lista de componentes disponíveis para adicionar
          this.separarComponentes();
        },
        error: (error) => {
          console.error('Erro ao carregar componentes disponíveis:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Não foi possível carregar componentes adicionais. Apenas componentes padrão estarão disponíveis.'
          });
          // Não bloqueia o fluxo - continua com componentes da tabela padrão
          this.componentesDisponiveisAPI = [];
        }
      });
  }

  /**
   * Inicializa componentes do formulário a partir da tabela padrão ou simulação existente
   */
  private inicializarComponentes(): void {
    if (!this.proposta) return;
    
    const modalidade = this.proposta.modalidadeTabelaPadrao;
    const simulacao = this.proposta.simulacao;
    
    this.valorTabela = this.proposta.empreendimento.valorUnidade;
    
    // Normalizar componentes para v2.0 e cachear (evita reprocessamento)
    this.componentesNormalizadosCache = this.normalizarComponentes(modalidade);
    
    // 📊 TABELA PADRÃO (readonly): Apenas componentes com valor !== null (exclui ATO)
    // Representa 100% do valor da unidade
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
        
        // 📅 Gerar vencimentos iniciais
        componente.listaVencimentos = this.gerarVencimentos(
          componente.vencimento,
          componente.quantidade,
          regra.periodicidade ?? 0,
          componente.valorParcela
        );
        
        return componente;
      });
      
      this.valorProposta = simulacao.valorProposta;
      this.diferenca = simulacao.diferenca;
      this.percentualDiferenca = simulacao.percentualDiferenca;
      this.possuiDesconto = simulacao.possuiDesconto;
      this.possuiAcrescimo = simulacao.possuiAcrescimo;
    } else {
      // 📝 COMPONENTES DISPONÍVEIS (editável): TODOS os componentes, incluindo ATO
      // ATO vem com valor null, usuário pode ativar e informar valor manualmente
      this.componentes = this.componentesNormalizadosCache
        .sort((a, b) => a.ordem - b.ordem)
        .map(regra => {
          const temValor = regra.valor !== null && regra.valor > 0;
          const valorTotal = temValor ? (regra.valor ?? 0) : 0;
          const valorParcela = temValor ? (regra.valorParcela ?? 0) : 0;
          const percentual = temValor ? (regra.percentual ?? 0) : 0;
          
          // 🎯 CORREÇÃO: Usar dataVencimento da API se disponível, senão calcular
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
            selecionado: temValor,  // ✅ Ativo se tiver valor, ❌ Inativo se for null (ex: ATO)
            regra,
            erroValidacao: null
          };
          
          // 📅 Gerar vencimentos: usar lista da API se disponível, senão gerar
          if (regra.listaVencimentos && regra.listaVencimentos.length > 0) {
            // Usar lista de vencimentos que veio da API
            componente.listaVencimentos = regra.listaVencimentos.map(v => ({
              numeroParcela: v.numeroParcela,
              dataVencimento: typeof v.dataVencimento === 'string' 
                ? new Date(v.dataVencimento) 
                : v.dataVencimento,
              valor: v.valor
            }));
          } else {
            // Gerar vencimentos calculados
            componente.listaVencimentos = this.gerarVencimentos(
              vencimento,
              componente.quantidade,
              regra.periodicidade ?? 0,
              valorParcela
            );
          }
          
          return componente;
        });
        
      // Após inicializar, calcular totais
      this.calcularTotais();
    }
    
    // 🆕 v2.2 - Separar componentes
    this.separarComponentes();
  }

  /**
   * 🆕 v2.2 - Separa componentes em: Tabela Padrão, ATO e Disponíveis
   * Conforme especificação do Mapa de Integração v2.2
   * 
   * REGRA: Todos os componentes podem ser duplicados/adicionados, incluindo ATO
   */
  private separarComponentes(): void {
    if (!this.componentesNormalizadosCache || this.componentesNormalizadosCache.length === 0) {
      return;
    }
    
    // Identificar ATO (primeiro da lista)
    this.componenteAto = this.componentes.find(c => 
      c.nomeComponente.toUpperCase().includes('ATO')
    ) || null;
    
    // Identificar componentes disponíveis para adicionar:
    // TODOS os componentes da tabela padrão
    const disponiveisTabelaPadrao = [...this.componentesNormalizadosCache];
    
    // TODOS os componentes da API
    const disponiveisAPI = [...(this.componentesDisponiveisAPI || [])];
    
    // Combinar ambas as listas e remover duplicados por codigoComponente
    const todoDisponiveis = [...disponiveisTabelaPadrao, ...disponiveisAPI];
    const mapaComponentes = new Map<string, ComponenteTabelaPadraoDTO>();
    
    todoDisponiveis.forEach(c => {
      if (!mapaComponentes.has(c.codigoComponente)) {
        mapaComponentes.set(c.codigoComponente, c);
      }
    });
    
    // Ordenar por ordem e converter para array
    this.componentesDisponiveisParaAdicionar = Array.from(mapaComponentes.values())
      .sort((a, b) => a.ordem - b.ordem);
      
    console.log(`✅ ${this.componentesDisponiveisParaAdicionar.length} componente(s) disponível(is) para adicionar (incluindo ATO)`);
  }

  /**
   * Normaliza componentes para estrutura v2.0
   * Compatível com v1.0 (MAIÚSCULAS) e v2.0 (camelCase)
   * 
   * Suporta 3 cenários:
   * 1. modalidade.componentes (v2.0 completo)
   * 2. modalidade.COMPONENTES com itens em camelCase (híbrido atual)
   * 3. modalidade.COMPONENTES com itens em UPPERCASE (v1.0 legado)
   */
  private normalizarComponentes(modalidade: any): ComponenteTabelaPadraoDTO[] {
    // Cenário 1: Se já está em v2.0 (camelCase), retorna direto
    if (modalidade.componentes && Array.isArray(modalidade.componentes)) {
      return modalidade.componentes;
    }
    
    // Cenário 2 e 3: modalidade.COMPONENTES existe
    if (modalidade.COMPONENTES && Array.isArray(modalidade.COMPONENTES)) {
      // Detecta se itens dentro já estão em camelCase (híbrido)
      const primeiroItem = modalidade.COMPONENTES[0];
      const jaCamelCase = primeiroItem && primeiroItem.codigoComponente !== undefined;
      
      if (jaCamelCase) {
        // Cenário 2: COMPONENTES (uppercase) mas itens em camelCase - retorna direto
        console.info(`✅ API retornando estrutura híbrida: COMPONENTES com ${modalidade.COMPONENTES.length} item(ns) em camelCase`);
        return modalidade.COMPONENTES;
      } else {
        // Cenário 3: v1.0 completo (COMPONENTES com itens em UPPERCASE) - converte
        console.warn(
          `⚠️ API retornando estrutura v1.0 (MAIÚSCULAS). Convertendo ${modalidade.COMPONENTES.length} componente(s) para v2.0...`
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
          valor: null,         // v2.1: Será calculado se disponível
          valorParcela: null   // v2.1: Será calculado se disponível
        }));
      }
    }
    
    // Estrutura inválida ou vazia
    console.error('❌ Estrutura de componentes inválida:', modalidade);
    return [];
  }

  /**
   * Infere o grupo do componente baseado no nome (FALLBACK para v1.0)
   */
  private inferirGrupoComponente(nomeComponente: string | undefined | null): number {
    // Proteção contra valores undefined/null
    if (!nomeComponente) {
      console.warn('⚠️ Nome do componente não informado, usando grupo padrão (Opcional)');
      return 7; // Opcional (padrão)
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
    const dia = 15; // Padrão dia 15
    
    // ENTRADA: vencimento imediato
    if (regra.tipoComponente === 'ENTRADA') {
      return new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    }
    
    // PARCELA: próximo mês
    if (regra.tipoComponente === 'PARCELA') {
      return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
    }
    
    // COTA_UNICA: final do prazo (ex: 48 meses)
    if (regra.tipoComponente === 'COTA_UNICA') {
      const mesesAfrente = regra.prazoMeses || 48;
      return new Date(hoje.getFullYear(), hoje.getMonth() + mesesAfrente, dia);
    }
    
    return hoje;
  }

  /**
   * Recalcula valor total e percentual quando valor da parcela muda
   * 
   * Comportamento: Recalcula apenas o componente editado. Os valores dos outros
   * componentes NÃO são alterados, apenas os percentuais são recalculados.
   */
  onValorParcelaChange(componente: ComponenteFormulario): void {
    // Recalcula valor total do componente editado
    componente.valorTotal = componente.valorParcela * componente.quantidade;
    
    // Recalcula totais e validações (apenas percentuais mudam)
    this.calcularTotais();
    this.gerarComparacao();
  }



  /**
   * Recalcula valor total e percentual quando quantidade muda
   * 
   * Comportamento: Recalcula apenas o componente editado. Os valores dos outros
   * componentes NÃO são alterados, apenas os percentuais são recalculados.
   */
  onQuantidadeChange(componente: ComponenteFormulario): void {
    // Recalcula total baseado na nova quantidade
    componente.valorTotal = componente.valorParcela * componente.quantidade;
    
    // 📅 Atualiza datas de vencimento
    this.atualizarVencimentosComponente(componente);
    
    // Recalcula totais e validações (apenas percentuais mudam)
    this.calcularTotais();
    this.gerarComparacao();
  }

  /**
   * Manipula mudança de data de vencimento
   */
  onVencimentoChange(componente: ComponenteFormulario): void {
    // 📅 Atualiza datas de vencimento
    this.atualizarVencimentosComponente(componente);
    
    // Recalcula totais (adiantamento pode mudar)
    this.calcularTotais();
  }

  /**
   * Manipula mudança de seleção de um componente (checkbox)
   */
  /**
   * Calcula totais da simulação
   * 
   * Baseado nas instruções do documento:
   * - Valor Total: soma de componentes com valor preenchido
   * - Diferença: valor total - valor da unidade
   * - Adiantamento: componentes com vencimento no mês corrente
   * - Saldo Devedor: valor total - adiantamento
   */
  calcularTotais(): void {
    // Considera apenas componentes com valores preenchidos
    const componentesComValor = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    
    // Valor total da proposta (calcular ANTES dos percentuais)
    this.valorProposta = componentesComValor.reduce(
      (sum, c) => sum + c.valorTotal, 0
    );
    
    // 🎯 Detectar se houve alteração na estrutura (adição/duplicação/alteração de valores)
    // Se valorProposta ≠ valorTabela, significa que houve mudanças e TODOS os percentuais devem ser recalculados
    const houveAlteracao = Math.abs(this.valorProposta - this.valorTabela) > 0.01;
    
    // Recalcula percentual de cada componente em relação ao VALOR DA PROPOSTA
    componentesComValor.forEach(componente => {
      const nomeUpper = componente.nomeComponente.toUpperCase();
      
      // 🎯 ATO e SINAL: SEMPRE recalcular (percentual da API é a SOMA, não individual)
      if (nomeUpper.includes('ATO') || nomeUpper.includes('SINAL')) {
        componente.percentual = this.valorProposta > 0 
          ? (componente.valorTotal / this.valorProposta) * 100 
          : 0;
        return;
      }
      
      // 🎯 Se houve alteração na estrutura ou valores, RECALCULAR TODOS os percentuais
      if (houveAlteracao) {
        componente.percentual = this.valorProposta > 0 
          ? (componente.valorTotal / this.valorProposta) * 100 
          : 0;
        return;
      }
      
      // ✅ Estado inicial (sem alterações): PRESERVAR percentual da API
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
    
    // 🎯 AJUSTE DE ARREDONDAMENTO: Garantir que soma dos percentuais = 100%
    if (componentesComValor.length > 0) {
      const somaPercentuais = componentesComValor.reduce((sum, c) => sum + c.percentual, 0);
      const diferenca = 100 - somaPercentuais;
      
      // Se diferença for significativa (> 0.01%), ajustar no último componente
      if (Math.abs(diferenca) > 0.01) {
        // Encontrar o último componente que NÃO é ATO nem SINAL (esses são sempre recalculados)
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
    
    // 💰 Adiantamento: soma dos componentes com vencimento no mês corrente
    const dataReferencia = new Date();
    this.adiantamento = componentesComValor
      .filter(c => {
        if (!c.vencimento) return false;
        const venc = new Date(c.vencimento);
        return venc.getMonth() === dataReferencia.getMonth() &&
               venc.getFullYear() === dataReferencia.getFullYear();
      })
      .reduce((sum, c) => sum + c.valorTotal, 0);
    
    // 📊 Saldo Devedor: valor total - adiantamento
    this.saldoDevedor = this.valorProposta - this.adiantamento;
    
    // 🔍 Executar validações de aprovação automática
    this.executarValidacoesAprovacao();
  }

  /**
   * 📅 Gera lista de vencimentos baseado na periodicidade
   * 
   * @param dataBase Data base para cálculo (primeiro vencimento)
   * @param quantidade Número de parcelas
   * @param periodicidade 0=à vista, 1=mensal, 2=bimestral, 3=trimestral, 6=semestral, 12=anual
   * @param valorParcela Valor de cada parcela
   * @returns Array de VencimentoDTO com as datas calculadas
   */
  gerarVencimentos(
    dataBase: Date | null,
    quantidade: number,
    periodicidade: number,
    valorParcela: number
  ): import('../../../core/models/proposta-simplificada.model').VencimentoDTO[] {
    const vencimentos: import('../../../core/models/proposta-simplificada.model').VencimentoDTO[] = [];
    
    // Se não tem data base ou quantidade inválida, retorna array vazio
    if (!dataBase || quantidade <= 0) {
      return vencimentos;
    }
    
    // Se periodicidade é 0 (à vista), gera apenas 1 vencimento com a mesma data
    if (periodicidade === 0) {
      vencimentos.push({
        numeroParcela: 1,
        dataVencimento: new Date(dataBase),
        valor: valorParcela * quantidade  // Valor total à vista
      });
      return vencimentos;
    }
    
    // Para periodicidades > 0, gerar N parcelas adicionando periodicidade em meses
    for (let i = 0; i < quantidade; i++) {
      const dataVencimento = new Date(dataBase);
      
      // Adicionar (i * periodicidade) meses à data base
      dataVencimento.setMonth(dataVencimento.getMonth() + (i * periodicidade));
      
      vencimentos.push({
        numeroParcela: i + 1,
        dataVencimento: dataVencimento,
        valor: valorParcela
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
      componente.valorParcela
    );
  }

  /**
   * REGRA 0: Valida se percentuais calculados estão próximos dos percentuais da API
   * Compara o percentual calculado com o percentual retornado pela API
   * 
   * ⚠️ EXCEÇÕES: 
   * - ATO e COTA SINAL são validados EM CONJUNTO na REGRA 1 (sinal total)
   *   Por isso são IGNORADOS aqui para não gerar alertas duplicados
   */
  private validarPercentuaisComponentes(componentes: ComponenteFormulario[]): void {
    componentes.forEach(componente => {
      // Ignorar ATO e SINAL (validados EM CONJUNTO na REGRA 1)
      const nomeUpper = componente.nomeComponente.toUpperCase();
      if (nomeUpper.includes('ATO') || nomeUpper.includes('SINAL')) {
        return;
      }
      
      // Só validar componentes que têm percentual definido na API
      const percentualAPI = componente.regra.percentual;
      if (percentualAPI === null || percentualAPI === undefined || percentualAPI === 0) {
        return;
      }
      
      // Percentual calculado atual
      const percentualCalculado = componente.percentual;
      
      // Calcular diferença (positiva = acima, negativa = abaixo)
      const diferenca = percentualCalculado - percentualAPI;
      const diferencaAbsoluta = Math.abs(diferenca);
      
      // Alertar qualquer diferença significativa (> 0.01% para considerar arredondamento)
      if (diferencaAbsoluta > 0.01) {
        const direcao = diferenca > 0 ? 'acima' : 'abaixo';
        const mensagem = `${componente.nomeComponente}: ${percentualCalculado.toFixed(2)}% está ${diferencaAbsoluta.toFixed(2)}% ${direcao} do esperado (${percentualAPI.toFixed(2)}% da tabela padrão)`;
        
        // Marcar componente com erro
        componente.mensagensErro = componente.mensagensErro || [];
        componente.mensagensErro.push(mensagem);
        componente.erroValidacao = mensagem;
      }
    });
  }

  /**
   * Executa todas as validações de aprovação automática
   * Popula o array violacoesAprovacao com os resultados
   * 
   * 🔢 v2.6 - Ignora componentes com valores zerados (ainda não preenchidos)
   */
  private executarValidacoesAprovacao(): void {
    this.violacoesAprovacao = [];
    
    // Limpar mensagens de erro de todos os componentes
    this.componentes.forEach(c => {
      c.mensagensErro = [];
      c.erroValidacao = null;
    });
    
    // 🔢 Filtrar apenas componentes com valores preenchidos
    // Componentes recém-adicionados (valor=0, percentual=0) não são validados
    const componentesSelecionados = this.componentes.filter(c => 
      c.valorParcela > 0 || c.percentual > 0
    );
    
    // REGRA 0: Validar percentuais individuais de cada componente
    this.validarPercentuaisComponentes(componentesSelecionados);
    
    // REGRA 1: Sinal Mínimo (ATO + SINAL >= 5%)
    this.validarSinalMinimo(componentesSelecionados);
    
    // REGRA 2: Arrecadação 13 Primeiros Meses (>= 29%)
    this.validarArrecadacao13PrimeirosMeses(componentesSelecionados);
    
    // REGRA 3: Arrecadação 13 Últimos Meses (<= 26%)
    this.validarArrecadacao13UltimosMeses(componentesSelecionados);
    
    // REGRA 4: Última Parcela Máxima (COTA ÚNICA <= 6%)
    this.validarUltimaParcelaMaxima(componentesSelecionados);
    
    // REGRA 5 e 6: Desconto/Acréscimo
    this.validarDescontoAcrescimo();
    
    // REGRA 7: ATO Mínimo por Tipologia
    this.validarAtoMinimoPorTipologia(componentesSelecionados);
    
    // REGRA 8: Valor Mínimo Cota Mensal
    this.validarMensalMinima(componentesSelecionados);
  }

  /**
   * REGRA 1: Sinal (ATO + SINAL) >= percentual do COTA SINAL
   * O percentual mínimo vem do campo `percentual` do componente COTA SINAL retornado pela API
   * 
   * ⚠️ IMPORTANTE: Soma TODOS os componentes ATO e COTA SINAL (caso tenham sido duplicados)
   */
  private validarSinalMinimo(componentes: ComponenteFormulario[]): void {
    // Pegar TODOS os componentes ATO e COTA SINAL (podem estar duplicados)
    const componentesAto = componentes.filter(c => c.nomeComponente.toUpperCase().includes('ATO'));
    const componentesSinal = componentes.filter(c => c.nomeComponente.toUpperCase().includes('SINAL'));
    
    if (componentesSinal.length === 0) {
      // Sem componente SINAL, não valida esta regra
      return;
    }
    
    // 🎯 Usar percentual do COTA SINAL retornado pela API (pega o primeiro para obter a regra)
    const primeiroSinal = componentesSinal[0];
    const percentualMinimoAPI = primeiroSinal.regra.percentual ?? this.configuracoesAprovacao.percentualSinalMinimo;
    
    // Somar TODOS os valores de ATO
    const valorAto = componentesAto.reduce((sum, c) => sum + c.valorTotal, 0);
    
    // Somar TODOS os valores de COTA SINAL
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
    
    // Marcar TODOS os componentes ATO e SINAL com erro (caso tenham sido duplicados)
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
   * REGRA 2: Arrecadação 13 Primeiros Meses >= 29%
   * 🎯 Aplicável apenas se duração do contrato > 13 meses
   */
  private validarArrecadacao13PrimeirosMeses(componentes: ComponenteFormulario[]): void {
    // Ordenar por vencimento
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
    
    // 🎯 Calcular duração do contrato (primeiro vencimento até última parcela do componente mais longo)
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
    
    // 🎯 Regra só se aplica se contrato tiver mais de 13 meses
    if (duracaoEmMeses <= 13) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Contrato com ${duracaoEmMeses} meses de duração (regra não se aplica para contratos <= 13 meses)`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    // Calcular valor arrecadado nos 13 primeiros meses
    // Soma 12 meses para ter período de exatamente 13 meses (mês inicial + 12 = 13 meses)
    const dataLimite = new Date(primeiroVencimento);
    dataLimite.setMonth(dataLimite.getMonth() + 12);
    
    // 🎯 Somar TODAS as parcelas individuais que vencem nos 13 primeiros meses
    // Depois calcular percentual dessa soma em relação ao valor total da unidade
    const valorPrimeiros13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      primeiroVencimento,
      dataLimite
    );
    
    // Percentual = (Valor arrecadado nos 13 primeiros meses / Valor da unidade) * 100
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
   * REGRA 3: Arrecadação 13 Últimos Meses <= 26%
   * 🎯 Aplicável apenas se duração do contrato > 13 meses
   */
  private validarArrecadacao13UltimosMeses(componentes: ComponenteFormulario[]): void {
    const componentesOrdenados = [...componentes]
      .filter(c => c.vencimento)
      .sort((a, b) => b.vencimento!.getTime() - a.vencimento!.getTime()); // Ordem decrescente
    
    if (componentesOrdenados.length === 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: 'Sem vencimentos definidos',
        bloqueiaAprovacao: false
      });
      return;
    }
    
    // 🎯 Calcular duração do contrato (primeiro vencimento até última parcela do componente mais longo)
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
    
    // 🎯 Regra só se aplica se contrato tiver mais de 13 meses
    if (duracaoEmMeses <= 13) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Contrato com ${duracaoEmMeses} meses de duração (regra não se aplica para contratos <= 13 meses)`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    // Calcular valor arrecadado nos últimos 13 meses
    // Retroceder 12 meses para ter período de exatamente 13 meses (mês final - 12 = 13 meses)
    const ultimoVencimento = dataFinalContrato;
    const dataLimite = new Date(ultimoVencimento);
    dataLimite.setMonth(dataLimite.getMonth() - 12);
    
    // 🎯 Somar TODAS as parcelas individuais que vencem nos últimos 13 meses
    // Depois calcular percentual dessa soma em relação ao valor total da unidade
    const valorUltimos13Meses = this.calcularValorPorPeriodo(
      componentesOrdenados,
      dataLimite,
      ultimoVencimento
    );
    
    // Percentual = (Valor arrecadado nos últimos 13 meses / Valor da unidade) * 100
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
   * REGRA 4: Última Parcela (COTA ÚNICA) <= percentual da COTA ÚNICA
   * O percentual máximo vem do campo `percentual` do componente COTA ÚNICA retornado pela API
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
    
    // 🎯 Usar percentual da COTA ÚNICA retornado pela API
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
    
    // Marcar componente COTA ÚNICA com erro
    if (!conforme && cotaUnica) {
      cotaUnica.mensagensErro = cotaUnica.mensagensErro || [];
      cotaUnica.mensagensErro.push(mensagem);
      cotaUnica.erroValidacao = mensagem;
    }
  }

  /**
   * REGRA 5 e 6: Desconto/Acréscimo aplicado
   */
  private validarDescontoAcrescimo(): void {
    const diferenca = this.valorProposta - this.valorTabela;
    
    if (Math.abs(diferenca) < 0.01) {
      // Sem desconto nem acréscimo
      return;
    }
    
    if (diferenca < 0) {
      // DESCONTO
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.DESCONTO_APLICADO,
        status: StatusRegraValidacao.VIOLACAO,
        valorCalculado: this.valorProposta,
        valorLimite: this.valorTabela,
        mensagem: `O valor da proposta ${this.formatarMoeda(this.valorProposta)} é menor que o valor de tabela da unidade ${this.formatarMoeda(this.valorTabela)}. Diferença de ${this.formatarMoeda(Math.abs(diferenca))}`,
        bloqueiaAprovacao: true
      });
    } else {
      // ACRÉSCIMO
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
   * REGRA 7: Valor pago no ATO >= valor do componente ATO retornado pela API
   * O valor mínimo vem do campo `valor` do componente ATO
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
    
    // 🎯 Usar valor do ATO retornado pela API (campo `valor` do componente ATO)
    const tipologia = this.proposta?.empreendimento?.tipologia || '';
    
    // O valor da API vem no campo `valor` do componente retornado
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
    
    // Marcar componente ATO com erro
    if (!conforme) {
      ato.mensagensErro = ato.mensagensErro || [];
      ato.mensagensErro.push(mensagem);
      ato.erroValidacao = mensagem;
    }
  }

  /**
   * REGRA 8: Valor Mínimo COTA MENSAL >= R$ 1.000,00 (fixo)
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
    
    // 🎯 Valor mínimo fixo de R$ 1.000,00
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
    
    // Filtrar componentes com valores preenchidos
    const componentesAtivos = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    
    // Usar componentes normalizados do cache (já processado em inicializarComponentes)
    // ✨ Evita reprocessamento e warnings duplicados
    const componentesNormalizados = this.componentesNormalizadosCache.length > 0
      ? this.componentesNormalizadosCache
      : this.normalizarComponentes(this.proposta.modalidadeTabelaPadrao);
    
    // Métricas de validação
    const metricas: ComparacaoMetricaDTO[] = [];
    
    // 1. Sinal Mínimo (ATO + COTA SINAL) - Soma TODOS os componentes
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
    
    // 2. Arrecadação Primeiros 13 Meses (fixo 29%)
    const minCotaMensal = 29; // Valor fixo conforme especificação
    const compCotaMensal = componentesAtivos.find(c => c.nomeComponente === 'COTA MENSAL');
    const percentualCotaMensal = compCotaMensal?.percentual || 0;
    
    metricas.push({
      metrica: 'Arrecadação Primeiros 13 Meses',
      limite: `${minCotaMensal.toFixed(2)}%`,
      proposta: `${percentualCotaMensal.toFixed(2)}%`,
      status: percentualCotaMensal >= minCotaMensal ? 'OK' : 'VIOLACAO'
    });
    
    // 3. Intermediárias (Últimos 13 Meses) - fixo 26%
    const maxIntermediarias = 26; // Valor fixo conforme especificação
    const compIntermediarias = componentesAtivos.find(c => c.nomeComponente === 'INTERMEDIARIAS');
    const percentualIntermediarias = compIntermediarias?.percentual || 0;
    
    metricas.push({
      metrica: 'Arrecadação Últimos 13 Meses',
      limite: `${maxIntermediarias.toFixed(2)}%`,
      proposta: `${percentualIntermediarias.toFixed(2)}%`,
      status: percentualIntermediarias <= maxIntermediarias ? 'OK' : 'VIOLACAO'
    });
    
    // 4. Cota Única (Última Parcela) - usar percentual do componente COTA ÚNICA
    const cotaUnica = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'COTA UNICA');
    const maxCotaUnica = cotaUnica?.percentual || 10; // Percentual da COTA ÚNICA da API
    const compCotaUnica = componentesAtivos.find(c => c.nomeComponente === 'COTA UNICA');
    const percentualCotaUnica = compCotaUnica?.percentual || 0;
    
    metricas.push({
      metrica: 'Última Parcela',
      limite: `${maxCotaUnica.toFixed(2)}%`,
      proposta: `${percentualCotaUnica.toFixed(2)}%`,
      status: percentualCotaUnica <= maxCotaUnica ? 'OK' : 'VIOLACAO'
    });
    
    // 5. Preço da Proposta
    metricas.push({
      metrica: 'Preço da Proposta',
      limite: 'Proposta dentro do preço',
      proposta: null,
      status: Math.abs(this.diferenca) <= 0.01 ? 'OK' : (this.diferenca < 0 ? 'ALERTA' : 'OK')
    });
    
    // 6. Valor da Proposta
    metricas.push({
      metrica: 'Valor da Proposta',
      limite: 'Valor Proposta ≥ Valor da tabela',
      proposta: null,
      status: this.valorProposta >= this.valorTabela ? 'OK' : 'VIOLACAO'
    });
    
    this.comparacao = metricas;
  }

  /**
   * Restaura valores da tabela padrão
   */
  restaurarTabela(): void {
    this.inicializarComponentes();
    this.calcularTotais();
    this.gerarComparacao();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Tabela Restaurada',
      detail: 'Os valores foram restaurados para a tabela padrão'
    });
  }

  /**
   * Adiciona ou duplica um componente
   * 🔢 v2.6 - Duplicação mantém valores do componente original
   */
  duplicarComponente(componente: ComponenteFormulario): void {
    const index = this.componentes.indexOf(componente);
    const novoComponente: ComponenteFormulario = {
      ...componente,
      codigoComponente: `${componente.codigoComponente}_${Date.now()}`,
      selecionado: true,
      erroValidacao: null,
      mensagensErro: [],
      // 📅 Copiar lista de vencimentos
      listaVencimentos: componente.listaVencimentos ? [...componente.listaVencimentos] : []
    };
    
    this.componentes.splice(index + 1, 0, novoComponente);
    this.calcularTotais();
    this.gerarComparacao();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: `Componente "${componente.nomeComponente}" duplicado com sucesso`
    });
  }

  /**
   * Remove um componente (marca como não selecionado)
   */
  excluirComponente(componente: ComponenteFormulario): void {
    // Confirmar antes de excluir
    this.confirmationService.confirm({
      message: `Deseja realmente remover o componente "${componente.nomeComponente}"?`,
      header: 'Confirmar Remoção',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      accept: () => {
        // 🗑️ REMOVER completamente do array (não apenas desmarcar)
        const index = this.componentes.indexOf(componente);
        if (index > -1) {
          this.componentes.splice(index, 1);
        }
        
        this.calcularTotais();
        this.gerarComparacao();
        this.separarComponentes(); // Atualizar lista de disponíveis
        
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Componente "${componente.nomeComponente}" removido da simulação`
        });
      }
    });
  }

  /**
   * 🆕 v2.2 - Adiciona um componente disponível à simulação
   * 🔢 v2.6 - SEMPRE adiciona novo componente (permite duplicação ilimitada)
   */
  adicionarComponenteDisponivel(componente: ComponenteTabelaPadraoDTO): void {
    // 🆕 SEMPRE adicionar novo componente, mesmo que já exista (duplicação permitida)
    // 🎯 Calcular vencimento inicial respeitando periodicidade
    const hoje = new Date();
    const vencimentoInicial = new Date(hoje);
    
    // Se periodicidade > 0, adiciona N meses à data de hoje
    // Periodicidade = 0: à vista (hoje)
    // Periodicidade = 1: hoje + 1 mês
    // Periodicidade = 6: hoje + 6 meses (ex: INTERMEDIARIAS)
    if (componente.periodicidade && componente.periodicidade > 0) {
      vencimentoInicial.setMonth(vencimentoInicial.getMonth() + componente.periodicidade);
    }
    
    const novoComponente: ComponenteFormulario = {
      codigoComponente: componente.codigoComponente + '_' + Date.now(), // Código único para duplicação
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
    
    // 📅 Gerar vencimentos iniciais
    novoComponente.listaVencimentos = this.gerarVencimentos(
      vencimentoInicial,
      1,
      componente.periodicidade ?? 0,
      0
    );
    
    this.componentes.push(novoComponente);
    
    this.calcularTotais();
    this.gerarComparacao();
    this.separarComponentes(); // Atualizar lista de disponíveis
    
    this.messageService.add({
      severity: 'success',
      summary: 'Componente Adicionado',
      detail: `${componente.nomeComponente} foi adicionado à simulação`
    });
  }

  /**
   * 🆕 v2.5 - Filtra componentes disponíveis para o autocomplete
   */
  filtrarComponentesDisponiveis(event: any): void {
    const query = event.query?.toLowerCase() || '';
    
    // Se não digitou nada (clicou no dropdown), mostra todos
    if (!query || query.trim() === '') {
      this.componentesFiltrados = [...this.componentesDisponiveisParaAdicionar];
      return;
    }
    
    // Filtra por nome ou código
    this.componentesFiltrados = this.componentesDisponiveisParaAdicionar.filter(comp => 
      comp.nomeComponente.toLowerCase().includes(query) ||
      comp.codigoComponente.toLowerCase().includes(query)
    );
  }

  /**
   * 🆕 v2.5 - Evento disparado ao selecionar componente no autocomplete
   */
  onComponenteSelecionado(event: any): void {
    const componente = event as ComponenteTabelaPadraoDTO;
    
    if (componente) {
      // Adicionar o componente à simulação
      this.adicionarComponenteDisponivel(componente);
      
      // Limpar o autocomplete após adicionar
      setTimeout(() => {
        this.componenteSelecionadoAutocomplete = null;
      }, 100);
    }
  }

  /**
   * 🆕 v2.5 - Mostra todos os componentes ao clicar no dropdown
   */
  onDropdownClickComponentes(): void {
    // Mostrar todos os componentes disponíveis
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

  /**
   * Campos obrigatórios para validação (implementação da classe base)
   */
  getCamposObrigatorios(): Array<{ id: string; valor: any; label?: string }> {
    const campos: Array<{ id: string; valor: any; label?: string }> = [];
    
    // Validar se todos os componentes têm valor preenchido
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
    
    // TODO: Integrar com API de PIX
    setTimeout(() => {
      this.gerandoPix = false;
      this.messageService.add({
        severity: 'success',
        summary: 'PIX Gerado',
        detail: 'QR Code do PIX gerado com sucesso'
      });
      // Abrir modal com QR Code
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
    
    const operacao = this.proposta?.id
      ? this.propostaService.atualizarPropostaSimplificada(this.proposta.id, request)
      : this.propostaService.salvarPropostaSimplificada(request);
    
    operacao.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.salvando = false)
    ).subscribe({
      next: (response) => {
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
          detail: error?.error?.message || 'Erro ao salvar proposta'
        });
      }
    });
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
        codigoComponente: comp.codigoComponente.split('_')[0], // Remove sufixo de duplicação
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
   * Usado para determinar duração do contrato
   */
  private calcularDiferencaMeses(dataInicio: Date, dataFim: Date): number {
    const anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const meses = dataFim.getMonth() - dataInicio.getMonth();
    return anos * 12 + meses;
  }

  /**
   * Calcula a data final do contrato (última parcela do componente mais longo)
   * Considera a listaVencimentos de cada componente para pegar a última parcela real
   */
  private calcularDataFinalContrato(componentes: ComponenteFormulario[]): Date | null {
    let dataFinal: Date | null = null;
    
    componentes.forEach(componente => {
      // Se tem lista de vencimentos, pegar a última data
      if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
        const ultimaParcela = componente.listaVencimentos[componente.listaVencimentos.length - 1];
        const dataUltimaParcela = new Date(ultimaParcela.dataVencimento);
        
        if (!dataFinal || dataUltimaParcela > dataFinal) {
          dataFinal = dataUltimaParcela;
        }
      } else if (componente.vencimento) {
        // Se não tem lista, usar o vencimento único
        if (!dataFinal || componente.vencimento > dataFinal) {
          dataFinal = componente.vencimento;
        }
      }
    });
    
    return dataFinal;
  }

  /**
   * Calcula a soma de TODAS as parcelas que vencem dentro do período específico
   * Para cada componente, soma apenas as parcelas individuais que vencem no período
   */
  private calcularValorPorPeriodo(
    componentes: ComponenteFormulario[], 
    dataInicio: Date, 
    dataFim: Date
  ): number {
    let valorTotal = 0;
    
    componentes.forEach(componente => {
      if (componente.listaVencimentos && componente.listaVencimentos.length > 0) {
        // Somar APENAS as parcelas que vencem dentro do período
        componente.listaVencimentos.forEach(parcela => {
          const dataParcela = new Date(parcela.dataVencimento);
          if (dataParcela >= dataInicio && dataParcela <= dataFim) {
            valorTotal += parcela.valor;
          }
        });
      } else if (componente.vencimento && componente.vencimento >= dataInicio && componente.vencimento <= dataFim) {
        // Componente sem lista (pagamento único) - soma o valor total apenas se vence no período
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
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number) => value + '%'
        }
      }
    }
  };

  /**
   * Retorna dados para o gráfico de análise
   */
  getGraficoData(): any {
    // Labels baseados nos meses
    const labels = this.gerarLabelsMeses();
    
    // Dados de limite (linha tracejada)
    const limiteData = this.calcularLimiteCumulativo();
    
    // Dados da proposta
    const propostaData = this.calcularPropostaCumulativa();
    
    return {
      labels,
      datasets: [
        {
          label: 'LIMITE',
          data: limiteData,
          borderColor: '#000000',
          borderDash: [5, 5],
          fill: false,
          tension: 0.1
        },
        {
          label: 'PROPOSTA',
          data: propostaData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    };
  }

  /**
   * Gera labels de meses para o gráfico
   */
  private gerarLabelsMeses(): string[] {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels: string[] = [];
    const hoje = new Date();
    
    for (let i = 0; i < 48; i += 6) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      labels.push(`${meses[data.getMonth()]}/${data.getFullYear().toString().slice(-2)}`);
    }
    
    return labels;
  }

  /**
   * Calcula dados cumulativos do limite
   */
  private calcularLimiteCumulativo(): number[] {
    // Valores aproximados baseados na tabela padrão
    return [8, 15, 25, 40, 60, 80, 95, 100];
  }

  /**
   * Calcula dados cumulativos da proposta
   */
  private calcularPropostaCumulativa(): number[] {
    if (this.valorProposta <= 0) {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    
    // Calcula percentual acumulado por período  
    const componentesComValor = this.componentes.filter(c => c.valorParcela > 0 || c.percentual > 0);
    let acumulado = 0;
    const dados: number[] = [];
    
    // Simplificação: distribui uniformemente
    const incremento = 100 / 8;
    for (let i = 0; i < 8; i++) {
      acumulado += incremento * (this.valorProposta / this.valorTabela);
      dados.push(Math.min(acumulado, 100));
    }
    
    return dados;
  }

  /**
   * Navega de volta para a lista
   */
  voltar(): void {
    this.router.navigate(['/propostas/lista']);
  }
}
