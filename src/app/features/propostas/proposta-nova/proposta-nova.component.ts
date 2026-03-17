import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
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
  StatusRegraValidacao
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
  providers: [MessageService]
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
    private messageService: MessageService
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
        
        return {
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
          
          return {
            codigoComponente: regra.codigoComponente,
            nomeComponente: regra.nomeComponente,
            tipoComponente: regra.tipoComponente,
            grupoComponente: regra.grupoComponente,
            periodicidade: regra.periodicidade,
            quantidade: regra.quantidade || 1,
            vencimento: this.calcularVencimentoInicial(regra),
            valorParcela: valorParcela,
            percentual: percentual,
            valorTotal: valorTotal,
            selecionado: temValor,  // ✅ Ativo se tiver valor, ❌ Inativo se for null (ex: ATO)
            regra,
            erroValidacao: null
          };
        });
        
      // Após inicializar, calcular totais
      this.calcularTotais();
    }
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
          percentualMinimo: comp.PERCENTUAL_MINIMO ?? null,
          percentualMaximo: comp.PERCENTUAL_MAXIMO ?? null,
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
    
    // Recalcula totais e validações (apenas percentuais mudam)
    this.calcularTotais();
    this.gerarComparacao();
  }

  /**
   * Manipula mudança de seleção de um componente
   */
  onSelecionadoChange(): void {
    this.calcularTotais();
    this.gerarComparacao();
  }



  /**
   * Calcula totais da simulação
   * 
   * Baseado nas instruções do documento:
   * - Valor Total: soma de componentes selecionados
   * - Diferença: valor total - valor da unidade
   * - Adiantamento: componentes com vencimento no mês corrente
   * - Saldo Devedor: valor total - adiantamento
   */
  calcularTotais(): void {
    const componentesSelecionados = this.componentes.filter(c => c.selecionado);
    
    // Valor total da proposta (calcular ANTES dos percentuais)
    this.valorProposta = componentesSelecionados.reduce(
      (sum, c) => sum + c.valorTotal, 0
    );
    
    // Recalcula percentual de cada componente selecionado em relação ao VALOR DA PROPOSTA
    componentesSelecionados.forEach(componente => {
      componente.percentual = this.valorProposta > 0 
        ? (componente.valorTotal / this.valorProposta) * 100 
        : 0;
    });
    
    // Diferença em relação à tabela padrão
    this.diferenca = this.valorProposta - this.valorTabela;
    this.percentualDiferenca = this.valorTabela > 0 
      ? ((this.diferenca / this.valorTabela) * 100) 
      : 0;
    
    this.possuiDesconto = this.diferenca < 0;
    this.possuiAcrescimo = this.diferenca > 0;
    
    // 💰 Adiantamento: soma dos componentes com vencimento no mês corrente
    const dataReferencia = new Date();
    this.adiantamento = componentesSelecionados
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
   * Executa todas as validações de aprovação automática
   * Popula o array violacoesAprovacao com os resultados
   */
  private executarValidacoesAprovacao(): void {
    this.violacoesAprovacao = [];
    
    // Limpar mensagens de erro de todos os componentes
    this.componentes.forEach(c => {
      c.mensagensErro = [];
      c.erroValidacao = null;
    });
    
    const componentesSelecionados = this.componentes.filter(c => c.selecionado);
    
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
   * REGRA 1: Sinal (ATO + SINAL) >= 5%
   */
  private validarSinalMinimo(componentes: ComponenteFormulario[]): void {
    const ato = componentes.find(c => c.nomeComponente.toUpperCase().includes('ATO'));
    const sinal = componentes.find(c => c.nomeComponente.toUpperCase().includes('SINAL'));
    
    const valorAto = ato?.valorTotal || 0;
    const valorSinal = sinal?.valorTotal || 0;
    const totalSinal = valorAto + valorSinal;
    
    const percentualCalculado = this.valorTabela > 0 
      ? (totalSinal / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado >= this.configuracoesAprovacao.percentualSinalMinimo;
    const mensagem = `O sinal representa ${percentualCalculado.toFixed(2)}% do valor da unidade${
      !conforme ? `, menor que os ${this.configuracoesAprovacao.percentualSinalMinimo}% do valor de arrecadação` : ''
    }`;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.SINAL_MINIMO,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: this.configuracoesAprovacao.percentualSinalMinimo,
      mensagem,
      bloqueiaAprovacao: !conforme
    });
    
    // Marcar componentes ATO e SINAL com erro
    if (!conforme) {
      if (ato) {
        ato.mensagensErro = ato.mensagensErro || [];
        ato.mensagensErro.push(mensagem);
        ato.erroValidacao = mensagem;
      }
      if (sinal) {
        sinal.mensagensErro = sinal.mensagensErro || [];
        sinal.mensagensErro.push(mensagem);
      }
    }
  }

  /**
   * REGRA 2: Arrecadação 13 Primeiros Meses >= 29%
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
    
    // Calcular percentual dos 13 primeiros meses
    const primeiroVencimento = componentesOrdenados[0].vencimento!;
    const dataLimite = new Date(primeiroVencimento);
    dataLimite.setMonth(dataLimite.getMonth() + 13);
    
    const valorPrimeiros13Meses = componentesOrdenados
      .filter(c => c.vencimento! <= dataLimite)
      .reduce((sum, c) => sum + c.valorTotal, 0);
    
    const percentualCalculado = this.valorTabela > 0 
      ? (valorPrimeiros13Meses / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado >= this.configuracoesAprovacao.percentual13PrimeirosMesesMinimo;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ARRECADACAO_13_PRIMEIROS_MESES,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: this.configuracoesAprovacao.percentual13PrimeirosMesesMinimo,
      mensagem: `O percentual dos 13 primeiros meses representa ${percentualCalculado.toFixed(2)}% do valor da unidade${
        !conforme ? `, menor que os ${this.configuracoesAprovacao.percentual13PrimeirosMesesMinimo}% do valor de arrecadação` : ''
      }`,
      bloqueiaAprovacao: !conforme
    });
  }

  /**
   * REGRA 3: Arrecadação 13 Últimos Meses <= 26%
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
    
    // Calcular percentual dos 13 últimos meses
    const ultimoVencimento = componentesOrdenados[0].vencimento!;
    const dataLimite = new Date(ultimoVencimento);
    dataLimite.setMonth(dataLimite.getMonth() - 13);
    
    const valorUltimos13Meses = componentesOrdenados
      .filter(c => c.vencimento! >= dataLimite)
      .reduce((sum, c) => sum + c.valorTotal, 0);
    
    const percentualCalculado = this.valorTabela > 0 
      ? (valorUltimos13Meses / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado <= this.configuracoesAprovacao.percentual13UltimosMesesMaximo;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ARRECADACAO_13_ULTIMOS_MESES,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: this.configuracoesAprovacao.percentual13UltimosMesesMaximo,
      mensagem: `O percentual dos últimos 13 meses representa ${percentualCalculado.toFixed(2)}% do valor da unidade${
        !conforme ? `, maior que os ${this.configuracoesAprovacao.percentual13UltimosMesesMaximo}% do valor de arrecadação` : ''
      }`,
      bloqueiaAprovacao: !conforme
    });
  }

  /**
   * REGRA 4: Última Parcela (COTA ÚNICA) <= 6%
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
    
    const percentualCalculado = this.valorTabela > 0 
      ? (cotaUnica.valorTotal / this.valorTabela) * 100 
      : 0;
    
    const conforme = percentualCalculado <= this.configuracoesAprovacao.percentualUltimaParcelaMaximo;
    const mensagem = `O percentual da última parcela representa ${percentualCalculado.toFixed(2)}% do valor da unidade${
      !conforme ? `, maior que os ${this.configuracoesAprovacao.percentualUltimaParcelaMaximo}% do valor de arrecadação` : ''
    }`;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ULTIMA_PARCELA_MAXIMA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      percentualCalculado,
      percentualLimite: this.configuracoesAprovacao.percentualUltimaParcelaMaximo,
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
   * REGRA 7: ATO >= Valor Mínimo por Tipologia
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
    const valorMinimoAto = this.configuracoesAprovacao.valoresAtoMinimosPorTipologia[tipologia] || 0;
    
    if (valorMinimoAto === 0) {
      this.violacoesAprovacao.push({
        tipo: TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA,
        status: StatusRegraValidacao.NAO_APLICAVEL,
        mensagem: `Tipologia "${tipologia}" não possui valor mínimo configurado`,
        bloqueiaAprovacao: false
      });
      return;
    }
    
    const conforme = ato.valorTotal >= valorMinimoAto;
    const mensagem = `O valor pago no ATO ${this.formatarMoeda(ato.valorTotal)}${
      !conforme ? ` é menor que o valor mínimo da tipologia ${this.formatarMoeda(valorMinimoAto)}. Diferença de ${this.formatarMoeda(valorMinimoAto - ato.valorTotal)}` : ''
    }`;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.ATO_MINIMO_TIPOLOGIA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      valorCalculado: ato.valorTotal,
      valorLimite: valorMinimoAto,
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
   * REGRA 8: Valor Mínimo COTA MENSAL >= R$ 1.000,00
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
    
    const conforme = mensal.valorParcela >= this.configuracoesAprovacao.valorMensalMinimo;
    const mensagem = `O valor pago na MENSAL ${this.formatarMoeda(mensal.valorParcela)}${
      !conforme ? ` é menor que ${this.formatarMoeda(this.configuracoesAprovacao.valorMensalMinimo)}. Diferença de ${this.formatarMoeda(this.configuracoesAprovacao.valorMensalMinimo - mensal.valorParcela)}` : ''
    }`;
    
    this.violacoesAprovacao.push({
      tipo: TipoRegraValidacao.MENSAL_MINIMA,
      status: conforme ? StatusRegraValidacao.CONFORME : StatusRegraValidacao.VIOLACAO,
      valorCalculado: mensal.valorParcela,
      valorLimite: this.configuracoesAprovacao.valorMensalMinimo,
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
    
    const componentesAtivos = this.componentes.filter(c => c.selecionado);
    
    // Usar componentes normalizados do cache (já processado em inicializarComponentes)
    // ✨ Evita reprocessamento e warnings duplicados
    const componentesNormalizados = this.componentesNormalizadosCache.length > 0
      ? this.componentesNormalizadosCache
      : this.normalizarComponentes(this.proposta.modalidadeTabelaPadrao);
    
    // Métricas de validação
    const metricas: ComparacaoMetricaDTO[] = [];
    
    // 1. Sinal Mínimo (ATO + COTA SINAL)
    const sinalComponents = componentesAtivos.filter(
      c => c.nomeComponente === 'ATO' || c.nomeComponente === 'COTA SINAL'
    );
    const percentualSinal = sinalComponents.reduce((sum, c) => sum + c.percentual, 0);
    const regraAto = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'ATO');
    const minSinal = regraAto?.percentualMinimo || 5;
    
    metricas.push({
      metrica: 'Sinal Mínimo (Ato+Sinal)',
      limite: `${minSinal.toFixed(2)}%`,
      proposta: `${percentualSinal.toFixed(2)}%`,
      status: percentualSinal >= minSinal ? 'OK' : 'VIOLACAO'
    });
    
    // 2. Arrecadação Primeiros 13 Meses
    const cotaMensal = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'COTA MENSAL');
    const minCotaMensal = cotaMensal?.percentualMinimo || 29;
    const compCotaMensal = componentesAtivos.find(c => c.nomeComponente === 'COTA MENSAL');
    const percentualCotaMensal = compCotaMensal?.percentual || 0;
    
    metricas.push({
      metrica: 'Arrecadação Primeiros 13 Meses',
      limite: `${minCotaMensal.toFixed(2)}%`,
      proposta: `${percentualCotaMensal.toFixed(2)}%`,
      status: percentualCotaMensal >= minCotaMensal ? 'OK' : 'VIOLACAO'
    });
    
    // 3. Intermediárias (Últimos 13 Meses)
    const intermediarias = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'INTERMEDIARIAS');
    const maxIntermediarias = intermediarias?.percentualMaximo || 26;
    const compIntermediarias = componentesAtivos.find(c => c.nomeComponente === 'INTERMEDIARIAS');
    const percentualIntermediarias = compIntermediarias?.percentual || 0;
    
    metricas.push({
      metrica: 'Arrecadação Últimos 13 Meses',
      limite: `${maxIntermediarias.toFixed(2)}%`,
      proposta: `${percentualIntermediarias.toFixed(2)}%`,
      status: percentualIntermediarias <= maxIntermediarias ? 'OK' : 'VIOLACAO'
    });
    
    // 4. Cota Única (Última Parcela)
    const cotaUnica = componentesNormalizados.find((c: ComponenteTabelaPadraoDTO) => c.nomeComponente === 'COTA UNICA');
    const maxCotaUnica = cotaUnica?.percentualMaximo || 6;
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
   */
  duplicarComponente(componente: ComponenteFormulario): void {
    const index = this.componentes.indexOf(componente);
    const novoComponente: ComponenteFormulario = {
      ...componente,
      codigoComponente: `${componente.codigoComponente}_${Date.now()}`,
      selecionado: true,
      erroValidacao: null
    };
    
    this.componentes.splice(index + 1, 0, novoComponente);
    this.calcularTotais();
    this.gerarComparacao();
  }

  /**
   * Remove um componente (marca como não selecionado)
   */
  excluirComponente(componente: ComponenteFormulario): void {
    componente.selecionado = false;
    this.calcularTotais();
    this.gerarComparacao();
  }

  /**
   * Verifica se há erros de validação
   */
  get temErrosValidacao(): boolean {
    return this.componentes.some(c => c.selecionado && c.erroValidacao);
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
    
    // Validar se todos os componentes selecionados têm valor
    this.componentes.forEach((comp, index) => {
      if (comp.selecionado && comp.valorParcela <= 0) {
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
    const ato = this.componentes.find(c => c.nomeComponente === 'ATO' && c.selecionado);
    
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
    const componentesSelecionados = this.componentes.filter(c => c.selecionado);
    
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
    const componentesSelecionados = this.componentes.filter(c => c.selecionado);
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
