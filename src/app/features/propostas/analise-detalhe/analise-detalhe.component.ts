import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Decimal from 'decimal.js';
import { MessageService } from 'primeng/api';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import {
  EnviarPropostaTotvsResponse,
  GRUPO_COMPONENTE_LABELS,
  GrupoComponente,
  PERIODICIDADE_LABELS,
  Periodicidade,
  VencimentoDTO
} from '../../../core/models/proposta-simplificada.model';
import { AnalisePropostaService } from '../../../core/services/analise-proposta.service';
import { PropostaService } from '../../../core/services/proposta.service';
import {
  ComponenteAnaliseDTO,
  PropostaAnaliseDetalheDTO,
  StatusAnalise,
  STATUS_ANALISE_LABELS,
  STATUS_ANALISE_SEVERITY,
  ValidacaoAnaliseDTO,
  VencimentoAnaliseDTO
} from '../../../core/models/analise-proposta.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfirmationService } from '../../../shared/services/confirmation.service';

@Component({
  selector: 'app-analise-detalhe',
  templateUrl: './analise-detalhe.component.html',
  styleUrls: ['./analise-detalhe.component.scss']
})
export class AnaliseDetalheComponent implements OnInit {
  private static readonly MOTIVO_REPROVACAO_PADRAO = 'Nenhuma observação informada para essa reprovação';

  carregando = false;
  processando = false;
  enviandoTotvs = false;
  mensagemLoadingOverlay = 'Carregando dados da análise...';

  proposta: PropostaAnaliseDetalheDTO | null = null;
  propostaId!: number;

  exibirDialogReprovacao = false;
  exibirDialogGrafico = false;
  motivoReprovacao = '';

  breadcrumbItems: BreadcrumbItem[] = [];

  componentesTabelaPadrao: ComponenteAnaliseDTO[] = [];
  componentesSimulacao: ComponenteAnaliseDTO[] = [];
  validacoesExibicao: ValidacaoAnaliseDTO[] = [];
  validacoesVioladasExibicao: ValidacaoAnaliseDTO[] = [];
  validacoesComponentesExibicao: ValidacaoAnaliseDTO[] = [];
  graficoData: any = { labels: [], datasets: [] };

  STATUS_ANALISE_LABELS = STATUS_ANALISE_LABELS;
  STATUS_ANALISE_SEVERITY = STATUS_ANALISE_SEVERITY;
  readonly Funcionalidade = Funcionalidade;
  readonly Permissao = Permissao;

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
        filter: (context: any) => context.dataset?.label !== 'Divergência',
        callbacks: {
          label: (context: any) => {
            const label = context.dataset?.label || '';
            const valor = Number(context.parsed?.y || 0);
            return `${label}: ${this.formatarMoeda(valor)}`;
          },
          afterBody: (items: any[]) => {
            const dataIndex = items?.[0]?.dataIndex;
            if (dataIndex === null || dataIndex === undefined) {
              return [];
            }

            const diferenca = this.getDiferencaGraficoPorIndice(dataIndex);

            if (diferenca === null) {
              return [];
            }

            const direcao = diferenca > 0 ? 'simulação acima' : 'tabela padrão acima';
            return [`Diferença: ${this.formatarMoeda(Math.abs(diferenca))} (${direcao})`];
          }
        }
      },
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analiseService: AnalisePropostaService,
    private propostaService: PropostaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.propostaId = +this.route.snapshot.paramMap.get('id')!;
    this.configurarBreadcrumb();
    this.carregar();
  }

  get exibirLoadingOverlay(): boolean {
    return this.carregando || this.processando || this.enviandoTotvs;
  }

  get podeEnviarParaTotvs(): boolean {
    return !!this.propostaId && this.proposta?.status === 'APROVADA';
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Fila de Análise', url: '/propostas/analise' },
      { label: 'Análise da Proposta' }
    ];
  }

  carregar(): void {
    this.carregando = true;
    this.mensagemLoadingOverlay = 'Carregando dados da análise...';
    this.analiseService.buscarDetalheAnalise(this.propostaId).subscribe({
      next: (proposta) => {
        this.proposta = proposta;
        this.processarDadosFinanceiros();
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        const msg = err?.error?.message || 'Erro ao carregar dados da proposta.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.router.navigate(['/propostas/analise']);
      }
    });
  }

  private processarDadosFinanceiros(): void {
    const tabelaPadrao = this.proposta?.tabelaPadrao?.componentes ?? [];
    const simulacao = this.proposta?.simulacaoProposta?.componentes ?? [];

    this.componentesSimulacao = simulacao
      .map(componente => this.normalizarComponente(componente))
      .sort((a, b) => this.ordenarComponentes(a, b));

    this.componentesTabelaPadrao = this.montarTabelaPadrao(tabelaPadrao, this.componentesSimulacao);
    this.executarValidacoesComponentesSimulacao();
    this.validacoesExibicao = this.unificarValidacoesExibicao(this.montarValidacoesExibicao());
    this.validacoesVioladasExibicao = this.validacoesExibicao.filter(validacao => this.isValidacaoViolada(validacao));
    this.graficoData = this.getGraficoData();
  }

  private executarValidacoesComponentesSimulacao(): void {
    this.validacoesComponentesExibicao = [];

    this.componentesSimulacao.forEach(componente => {
      componente.mensagensErro = [];
      componente.erroValidacao = null;
    });

    this.validarPercentuaisComponentesSimulacao();
    this.validarSinalMinimoComponentesSimulacao();
    this.validarAtoMinimoComponentesSimulacao();
    this.validarMensalMinimaComponentesSimulacao();
    this.validarUltimaParcelaMaximaComponentesSimulacao();
  }

  private unificarValidacoesExibicao(validacoesBackend: ValidacaoAnaliseDTO[]): ValidacaoAnaliseDTO[] {
    const regrasBackend = new Set(
      validacoesBackend
        .map(validacao => this.getChaveSemanticaValidacao(validacao))
        .filter(Boolean)
    );

    const validacoesLocaisFiltradas = this.validacoesComponentesExibicao.filter(validacao => {
      const chaveSemantica = this.getChaveSemanticaValidacao(validacao);
      return chaveSemantica === 'PERCENTUAL_COMPONENTE' || !regrasBackend.has(chaveSemantica);
    });

    const validacoes = [...validacoesBackend, ...validacoesLocaisFiltradas];
    const chaves = new Set<string>();

    return validacoes.filter(validacao => {
      const chave = [
        this.getChaveSemanticaValidacao(validacao),
        (validacao.campo || '').toUpperCase(),
        validacao.mensagem || ''
      ].join('|');

      if (chaves.has(chave)) {
        return false;
      }

      chaves.add(chave);
      return true;
    });
  }

  private getChaveSemanticaValidacao(validacao: ValidacaoAnaliseDTO): string {
    const regra = (validacao.regra || '').toUpperCase();

    if (regra.includes('ATO_MINIMO')) {
      return 'ATO_MINIMO_TIPOLOGIA';
    }

    if (regra.includes('PRIMEIROS_13_MESES')) {
      return 'PRIMEIROS_13_MESES';
    }

    if (regra.includes('ULTIMOS_13_MESES')) {
      return 'ULTIMOS_13_MESES';
    }

    if (regra.includes('MENSAL_MINIMA') || regra.includes('MENSAL_MINIMO')) {
      return 'MENSAL_MINIMA';
    }

    if (regra.includes('SINAL')) {
      return 'SINAL_MINIMO';
    }

    if (regra.includes('ULTIMA_PARCELA')) {
      return 'ULTIMA_PARCELA_MAXIMA';
    }

    if (regra.includes('PERCENTUAL_COMPONENTE')) {
      return 'PERCENTUAL_COMPONENTE';
    }

    return regra;
  }

  private validarPercentuaisComponentesSimulacao(): void {
    this.componentesSimulacao.forEach(componente => {
      const nomeUpper = (componente.nomeComponente || '').toUpperCase();

      if (nomeUpper.includes('ATO') || nomeUpper.includes('SINAL')) {
        return;
      }

      const percentualEsperado = this.getPercentualEsperadoComponente(componente);
      if (percentualEsperado === null || percentualEsperado === 0) {
        return;
      }

      const percentualCalculado = this.getPercentualComponenteNaProposta(componente);
      const diferenca = percentualCalculado - percentualEsperado;
      const diferencaAbsoluta = Math.abs(diferenca);

      if (diferencaAbsoluta <= 0.01) {
        return;
      }

      const direcao = diferenca > 0 ? 'acima' : 'abaixo';
      const mensagem = `${componente.nomeComponente}: ${percentualCalculado.toFixed(2)}% está ${diferencaAbsoluta.toFixed(2)}% ${direcao} do esperado (${percentualEsperado.toFixed(2)}% da tabela padrão)`;
      this.adicionarMensagemErroComponente(componente, mensagem);
      this.registrarValidacaoComponenteExibicao({
        campo: componente.nomeComponente,
        regra: 'PERCENTUAL_COMPONENTE',
        tipo: 'ERRO',
        nivel: 'ERRO',
        valorEncontrado: percentualCalculado,
        valorEsperado: percentualEsperado,
        mensagem,
        bloqueante: false
      });
    });
  }

  private validarSinalMinimoComponentesSimulacao(): void {
    const componentesAto = this.componentesSimulacao.filter(componente =>
      (componente.nomeComponente || '').toUpperCase().includes('ATO')
    );
    const componentesSinal = this.componentesSimulacao.filter(componente =>
      (componente.nomeComponente || '').toUpperCase().includes('SINAL')
    );

    if (!componentesSinal.length) {
      return;
    }

    const percentualMinimo = this.getPercentualEsperadoComponente(componentesSinal[0]) ?? 5;
    const totalSinal = [...componentesAto, ...componentesSinal]
      .reduce((soma, componente) => soma.plus(this.toDecimal(componente.valorTotal ?? 0)), new Decimal(0));

    const valorTabela = this.getValorTabelaPadrao();
    const percentualCalculado = valorTabela > 0
      ? totalSinal.div(valorTabela).mul(100).toNumber()
      : 0;

    if (percentualCalculado >= percentualMinimo) {
      return;
    }

    const diferenca = Math.abs(percentualCalculado - percentualMinimo);
    const mensagem = `Sinal (ATO + COTA SINAL): ${percentualCalculado.toFixed(2)}% (${diferenca.toFixed(2)}% abaixo do mínimo de ${percentualMinimo.toFixed(2)}%)`;

    componentesAto.forEach(componente => this.adicionarMensagemErroComponente(componente, mensagem));
    componentesSinal.forEach(componente => this.adicionarMensagemErroComponente(componente, mensagem));
    this.registrarValidacaoComponenteExibicao({
      regra: 'SINAL_MINIMO',
      tipo: 'ERRO',
      nivel: 'ERRO',
      valorEncontrado: percentualCalculado,
      valorEsperado: percentualMinimo,
      mensagem,
      bloqueante: true
    });
  }

  private validarAtoMinimoComponentesSimulacao(): void {
    const ato = this.componentesSimulacao.find(componente =>
      (componente.nomeComponente || '').toUpperCase().includes('ATO')
    );

    if (!ato) {
      return;
    }

    const valorMinimo = this.getValorEsperadoComponente(ato);
    if (valorMinimo === null || valorMinimo <= 0) {
      return;
    }

    const valorAtual = Number(ato.valorTotal ?? 0);
    if (valorAtual >= valorMinimo) {
      return;
    }

    const tipologia = this.proposta?.empreendimento?.tipologia || '';
    const diferenca = Math.abs(valorAtual - valorMinimo);
    const mensagem = `ATO: ${this.formatarMoeda(valorAtual)} (${this.formatarMoeda(diferenca)} abaixo do mínimo de ${this.formatarMoeda(valorMinimo)} para tipologia "${tipologia}")`;
    this.adicionarMensagemErroComponente(ato, mensagem);
    this.registrarValidacaoComponenteExibicao({
      campo: ato.nomeComponente,
      regra: 'ATO_MINIMO_TIPOLOGIA',
      tipo: 'ERRO',
      nivel: 'ERRO',
      valorEncontrado: valorAtual,
      valorEsperado: valorMinimo,
      mensagem,
      bloqueante: true
    });
  }

  private validarMensalMinimaComponentesSimulacao(): void {
    const mensal = this.componentesSimulacao.find(componente =>
      (componente.nomeComponente || '').toUpperCase().includes('MENSAL')
    );

    if (!mensal) {
      return;
    }

    const valorMinimo = 1000;
    const valorParcela = Number(mensal.valorParcela ?? 0);

    if (valorParcela >= valorMinimo) {
      return;
    }

    const diferenca = Math.abs(valorParcela - valorMinimo);
    const mensagem = `COTA MENSAL: ${this.formatarMoeda(valorParcela)} (${this.formatarMoeda(diferenca)} abaixo do mínimo de ${this.formatarMoeda(valorMinimo)})`;
    this.adicionarMensagemErroComponente(mensal, mensagem);
    this.registrarValidacaoComponenteExibicao({
      campo: mensal.nomeComponente,
      regra: 'MENSAL_MINIMA',
      tipo: 'ERRO',
      nivel: 'ERRO',
      valorEncontrado: valorParcela,
      valorEsperado: valorMinimo,
      mensagem,
      bloqueante: true
    });
  }

  private validarUltimaParcelaMaximaComponentesSimulacao(): void {
    const cotaUnica = this.componentesSimulacao.find(componente => {
      const nomeUpper = (componente.nomeComponente || '').toUpperCase();
      return nomeUpper.includes('UNICA') || nomeUpper.includes('ÚLTIMA');
    });

    if (!cotaUnica) {
      return;
    }

    const percentualMaximo = this.getPercentualEsperadoComponente(cotaUnica);
    if (percentualMaximo === null || percentualMaximo <= 0) {
      return;
    }

    const valorTabela = this.getValorTabelaPadrao();
    const percentualCalculado = valorTabela > 0
      ? Number(((Number(cotaUnica.valorTotal ?? 0) / valorTabela) * 100).toFixed(2))
      : 0;

    if (percentualCalculado <= percentualMaximo) {
      return;
    }

    const diferenca = Math.abs(percentualCalculado - percentualMaximo);
    const mensagem = `Última parcela (COTA ÚNICA): ${percentualCalculado.toFixed(2)}% (${diferenca.toFixed(2)}% acima do máximo de ${percentualMaximo.toFixed(2)}%)`;
    this.adicionarMensagemErroComponente(cotaUnica, mensagem);
    this.registrarValidacaoComponenteExibicao({
      campo: cotaUnica.nomeComponente,
      regra: 'ULTIMA_PARCELA_MAXIMA',
      tipo: 'ERRO',
      nivel: 'ERRO',
      valorEncontrado: percentualCalculado,
      valorEsperado: percentualMaximo,
      mensagem,
      bloqueante: true
    });
  }

  private adicionarMensagemErroComponente(componente: ComponenteAnaliseDTO, mensagem: string): void {
    componente.mensagensErro = componente.mensagensErro || [];

    if (componente.mensagensErro.includes(mensagem)) {
      return;
    }

    componente.mensagensErro.push(mensagem);
    componente.erroValidacao = componente.erroValidacao || mensagem;
  }

  private registrarValidacaoComponenteExibicao(validacao: ValidacaoAnaliseDTO): void {
    this.validacoesComponentesExibicao.push(validacao);
  }

  private getComponenteTabelaPadraoCorrespondente(componente: ComponenteAnaliseDTO): ComponenteAnaliseDTO | undefined {
    const codigoComponente = componente.codigoComponente;

    if (codigoComponente) {
      const encontradoPorCodigo = this.componentesTabelaPadrao.find(item => item.codigoComponente === codigoComponente);
      if (encontradoPorCodigo) {
        return encontradoPorCodigo;
      }
    }

    return this.componentesTabelaPadrao.find(item => item.nomeComponente === componente.nomeComponente);
  }

  private getPercentualEsperadoComponente(componente: ComponenteAnaliseDTO): number | null {
    const correspondente = this.getComponenteTabelaPadraoCorrespondente(componente);
    const percentual = correspondente?.percentual;

    if (percentual === null || percentual === undefined) {
      return null;
    }

    return Number(percentual);
  }

  private getValorEsperadoComponente(componente: ComponenteAnaliseDTO): number | null {
    const correspondente = this.getComponenteTabelaPadraoCorrespondente(componente);
    const valor = correspondente?.valorTotal ?? correspondente?.valor;

    if (valor === null || valor === undefined) {
      return null;
    }

    return Number(valor);
  }

  private montarValidacoesExibicao(): ValidacaoAnaliseDTO[] {
    const validacoes = this.proposta?.validacoes ?? [];
    const percentualPrimeiros13Meses = this.calcularPercentualArrecadacao13PrimeirosMeses(this.componentesSimulacao);
    const percentualUltimos13Meses = this.calcularPercentualArrecadacao13UltimosMeses(this.componentesSimulacao);

    return validacoes.map(validacao => {
      const regra = (validacao.regra || '').toUpperCase();

      if (regra === 'PRIMEIROS_13_MESES') {
        return this.sobrescreverValidacaoPeriodo(validacao, percentualPrimeiros13Meses, 'primeiros');
      }

      if (regra === 'ULTIMOS_13_MESES') {
        return this.sobrescreverValidacaoPeriodo(validacao, percentualUltimos13Meses, 'ultimos');
      }

      return validacao;
    });
  }

  private sobrescreverValidacaoPeriodo(
    validacao: ValidacaoAnaliseDTO,
    percentualCalculado: number | null,
    periodo: 'primeiros' | 'ultimos'
  ): ValidacaoAnaliseDTO {
    if (percentualCalculado === null) {
      return {
        ...validacao,
        valorEncontrado: null,
        mensagem: `Não há duração contratual suficiente para calcular a arrecadação dos ${periodo === 'primeiros' ? 'primeiros' : 'últimos'} 13 meses.`
      };
    }

    const valorEsperado = validacao.valorEsperado ?? null;
    const mensagem = periodo === 'primeiros'
      ? `O percentual dos primeiros 13 meses representa ${percentualCalculado.toFixed(2)}%`
      : `O percentual dos últimos 13 meses representa ${percentualCalculado.toFixed(2)}%`;

    return {
      ...validacao,
      valorEncontrado: percentualCalculado,
      mensagem,
      tipo: this.calcularStatusValidacaoPeriodo(periodo, percentualCalculado, valorEsperado),
      nivel: this.mapearNivelValidacaoPeriodo(periodo, percentualCalculado, valorEsperado)
    };
  }

  private calcularStatusValidacaoPeriodo(
    periodo: 'primeiros' | 'ultimos',
    valorEncontrado: number,
    valorEsperado: number | null
  ): 'ERRO' | 'AVISO' | 'INFO' {
    if (valorEsperado === null || valorEsperado === undefined) {
      return 'INFO';
    }

    const conforme = periodo === 'primeiros'
      ? valorEncontrado >= valorEsperado
      : valorEncontrado <= valorEsperado;

    return conforme ? 'INFO' : 'ERRO';
  }

  private mapearNivelValidacaoPeriodo(
    periodo: 'primeiros' | 'ultimos',
    valorEncontrado: number,
    valorEsperado: number | null
  ): 'ERRO' | 'ALERTA' | 'INFO' {
    if (valorEsperado === null || valorEsperado === undefined) {
      return 'INFO';
    }

    const conforme = periodo === 'primeiros'
      ? valorEncontrado >= valorEsperado
      : valorEncontrado <= valorEsperado;

    return conforme ? 'INFO' : 'ERRO';
  }

  private montarTabelaPadrao(
    componentesPadrao: ComponenteAnaliseDTO[],
    componentesSimulacao: ComponenteAnaliseDTO[]
  ): ComponenteAnaliseDTO[] {
    const simulacaoPorCodigo = new Map<string, ComponenteAnaliseDTO>();

    componentesSimulacao.forEach(componente => {
      if (componente.codigoComponente && !simulacaoPorCodigo.has(componente.codigoComponente)) {
        simulacaoPorCodigo.set(componente.codigoComponente, componente);
      }
    });

    return componentesPadrao
      .filter(componente => componente.ativo !== false)
      .map(componente => {
        const correspondenteSimulado = componente.codigoComponente
          ? simulacaoPorCodigo.get(componente.codigoComponente)
          : undefined;

        return this.normalizarComponente(componente, correspondenteSimulado);
      })
      .sort((a, b) => this.ordenarComponentes(a, b));
  }

  private normalizarComponente(
    componente: ComponenteAnaliseDTO,
    fallback?: ComponenteAnaliseDTO
  ): ComponenteAnaliseDTO {
    const quantidade = this.normalizarQuantidade(componente.quantidade ?? fallback?.quantidade);
    const valorTotal = this.obterValorTotalComponente(componente, fallback, quantidade);
    const valorParcela = this.obterValorParcelaComponente(componente, fallback, valorTotal, quantidade);
    const periodicidade = this.obterPeriodicidadeComponente(componente, fallback, quantidade);
    const dataBase = this.obterDataBaseComponente(componente, fallback);
    const listaVencimentos = this.normalizarListaVencimentos(componente.listaVencimentos);

    return {
      ...fallback,
      ...componente,
      quantidade,
      valorTotal,
      valorParcela,
      percentual: componente.percentual ?? fallback?.percentual ?? 0,
      periodicidade,
      dataVencimento: dataBase ? this.formatarDataISO(dataBase) : undefined,
      listaVencimentos: listaVencimentos.length
        ? listaVencimentos
        : dataBase
          ? this.gerarVencimentos(dataBase, quantidade, periodicidade, valorParcela, valorTotal)
          : []
    };
  }

  private normalizarListaVencimentos(lista?: VencimentoAnaliseDTO[]): VencimentoAnaliseDTO[] {
    if (!lista?.length) {
      return [];
    }

    return lista
      .map(vencimento => ({
        numeroParcela: vencimento.numeroParcela,
        dataVencimento: this.converterParaDate(vencimento.dataVencimento) ?? vencimento.dataVencimento,
        valor: vencimento.valor ?? 0
      }))
      .sort((a, b) => {
        const dataA = this.converterParaDate(a.dataVencimento)?.getTime() ?? 0;
        const dataB = this.converterParaDate(b.dataVencimento)?.getTime() ?? 0;
        return dataA - dataB;
      });
  }

  private ordenarComponentes(a: ComponenteAnaliseDTO, b: ComponenteAnaliseDTO): number {
    const ordemA = a.ordem ?? 999;
    const ordemB = b.ordem ?? 999;

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return (a.nomeComponente ?? '').localeCompare(b.nomeComponente ?? '');
  }

  private normalizarQuantidade(quantidade?: number): number {
    return Number.isFinite(quantidade) && (quantidade ?? 0) > 0 ? Math.trunc(quantidade as number) : 1;
  }

  private obterValorTotalComponente(
    componente: ComponenteAnaliseDTO,
    fallback: ComponenteAnaliseDTO | undefined,
    quantidade: number
  ): number {
    const valorTotal = componente.valorTotal ?? componente.valor ?? fallback?.valorTotal ?? fallback?.valor;

    if (valorTotal !== null && valorTotal !== undefined) {
      return Number(valorTotal);
    }

    const valorParcela = componente.valorParcela ?? fallback?.valorParcela ?? 0;
    return this.calcularValorTotalComponente(Number(valorParcela), quantidade);
  }

  private obterValorParcelaComponente(
    componente: ComponenteAnaliseDTO,
    fallback: ComponenteAnaliseDTO | undefined,
    valorTotal: number,
    quantidade: number
  ): number {
    const valorParcela = componente.valorParcela ?? fallback?.valorParcela;

    if (valorParcela !== null && valorParcela !== undefined) {
      return Number(valorParcela);
    }

    return this.dividirValorSemArredondar(valorTotal, quantidade);
  }

  private obterPeriodicidadeComponente(
    componente: ComponenteAnaliseDTO,
    fallback: ComponenteAnaliseDTO | undefined,
    quantidade: number
  ): number {
    if (componente.periodicidade !== null && componente.periodicidade !== undefined) {
      return componente.periodicidade;
    }

    if (fallback?.periodicidade !== null && fallback?.periodicidade !== undefined) {
      return fallback.periodicidade;
    }

    return this.inferirPeriodicidade(componente.grupoComponente ?? fallback?.grupoComponente, quantidade);
  }

  private obterDataBaseComponente(componente: ComponenteAnaliseDTO, fallback?: ComponenteAnaliseDTO): Date | null {
    const data = this.converterParaDate(
      componente.dataVencimento
      ?? componente.vencimentoInicial
      ?? componente.vencimento
      ?? fallback?.dataVencimento
      ?? fallback?.vencimentoInicial
      ?? fallback?.vencimento
    );

    return data;
  }

  private inferirPeriodicidade(grupo?: number, quantidade: number = 1): number {
    if (quantidade <= 1) {
      return 0;
    }

    if (grupo === 3) {
      return 6;
    }

    if (grupo === 6) {
      return 0;
    }

    return 1;
  }

  iniciarAnalise(): void {
    this.confirmationService.confirmCustom(
      'Iniciar Análise',
      `Deseja iniciar a análise da proposta <strong>${this.getNumeroPropostaDisplay()}</strong>?`,
      { confirmLabel: 'Iniciar Análise', severity: 'info', icon: 'pi pi-play' }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.mensagemLoadingOverlay = 'Iniciando análise...';
      this.processando = true;
      this.analiseService.enviarParaAnalise(this.propostaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Análise Iniciada',
            detail: 'Análise iniciada com sucesso!'
          });
          this.mensagemLoadingOverlay = 'Atualizando dados da análise...';
          window.setTimeout(() => {
            this.carregar();
            this.processando = false;
          }, 1200);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erro ao iniciar análise. Tente novamente.';
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
          this.processando = false;
          this.mensagemLoadingOverlay = 'Carregando dados da análise...';
        }
      });
    });
  }

  confirmarAprovacao(): void {
    this.confirmationService.confirmCustom(
      'Aprovar Proposta',
      `Deseja realmente aprovar a proposta <strong>${this.getNumeroPropostaDisplay()}</strong>?`,
      { confirmLabel: 'Aprovar', severity: 'success', icon: 'pi pi-check-circle' }
    ).subscribe(confirmed => {
      if (!confirmed) return;

      this.mensagemLoadingOverlay = 'Aprovando proposta...';
      this.processando = true;
      this.analiseService.aprovar(this.propostaId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Proposta Aprovada',
            detail: 'Proposta aprovada com sucesso!'
          });
          this.mensagemLoadingOverlay = 'Redirecionando para a fila de análise...';
          window.setTimeout(() => {
            void this.router.navigate(['/propostas/analise']);
          }, 1500);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erro ao aprovar proposta. Tente novamente.';
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
          this.processando = false;
          this.mensagemLoadingOverlay = 'Carregando dados da análise...';
        }
      });
    });
  }

  enviarParaTotvs(): void {
    if (!this.podeEnviarParaTotvs) {
      return;
    }

    this.confirmationService.confirmCustom(
      'Enviar proposta ao TOTVS',
      `Deseja enviar a proposta <strong>${this.getNumeroPropostaDisplay()}</strong> para o TOTVS?`,
      { confirmLabel: 'Enviar', severity: 'info', icon: 'pi pi-send' }
    ).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.mensagemLoadingOverlay = 'Enviando proposta ao TOTVS...';
      this.enviandoTotvs = true;

      this.propostaService.enviarParaTotvs(this.propostaId).subscribe({
        next: (response) => {
          this.enviandoTotvs = false;

          if (!response?.sucesso) {
            this.messageService.add({
              severity: 'error',
              summary: 'Falha no envio',
              detail: this.obterMensagemErroEnvioTotvs({ error: response })
            });
            this.mensagemLoadingOverlay = 'Carregando dados da análise...';
            return;
          }

          this.messageService.add({
            severity: response.cobrancaSincronizada ? 'success' : 'warn',
            summary: response.cobrancaSincronizada
              ? 'Proposta enviada e cobranca sincronizada'
              : 'Proposta enviada ao TOTVS',
            detail: this.montarMensagemSucessoEnvioTotvs(response)
          });
          this.atualizarDadosCobranca(response.numeroVenda, response.nossoNumero);
          this.mensagemLoadingOverlay = 'Carregando dados da análise...';
        },
        error: (err) => {
          this.enviandoTotvs = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro no envio ao TOTVS',
            detail: this.obterMensagemErroEnvioTotvs(err)
          });
          this.mensagemLoadingOverlay = 'Carregando dados da análise...';
        }
      });
    });
  }

  abrirDialogReprovacao(): void {
    this.motivoReprovacao = '';
    this.exibirDialogReprovacao = true;
  }

  confirmarReprovacao(): void {
    this.mensagemLoadingOverlay = 'Reprovando proposta...';
    this.processando = true;
    const motivo = this.motivoReprovacao?.trim() || AnaliseDetalheComponent.MOTIVO_REPROVACAO_PADRAO;
    const request = { motivo };

    this.analiseService.reprovar(this.propostaId, request).subscribe({
      next: () => {
        this.exibirDialogReprovacao = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Proposta Reprovada',
          detail: 'Proposta reprovada com sucesso.'
        });
        this.mensagemLoadingOverlay = 'Redirecionando para a fila de análise...';
        window.setTimeout(() => {
          void this.router.navigate(['/propostas/analise']);
        }, 1500);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao reprovar proposta. Tente novamente.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
        this.processando = false;
        this.mensagemLoadingOverlay = 'Carregando dados da análise...';
      }
    });
  }

  cancelarReprovacao(): void {
    this.exibirDialogReprovacao = false;
    this.motivoReprovacao = '';
  }

  voltar(): void {
    this.router.navigate(['/propostas/analise']);
  }

  abrirDialogGrafico(): void {
    this.exibirDialogGrafico = true;
  }

  get p(): PropostaAnaliseDetalheDTO {
    return this.proposta!;
  }

  getTituloPagina(): string {
    return this.proposta?.numeroProposta?.trim()
      ? `Proposta ${this.proposta.numeroProposta}`
      : 'Proposta em análise';
  }

  getNumeroPropostaDisplay(): string {
    return this.proposta?.numeroProposta?.trim() || `#${this.proposta?.id ?? this.propostaId}`;
  }

  private obterMensagemErroEnvioTotvs(error: any): string {
    const mensagem = error?.error?.mensagem || error?.error?.message;
    const detalhe = error?.error?.erro;

    if (typeof mensagem === 'string' && mensagem.trim()) {
      if (typeof detalhe === 'string' && detalhe.trim()) {
        return `${mensagem} ${detalhe}`;
      }

      return mensagem;
    }

    if (typeof detalhe === 'string' && detalhe.trim()) {
      return detalhe;
    }

    if (error?.status === 404) {
      return 'A proposta informada não foi encontrada para envio ao TOTVS.';
    }

    if (error?.status === 403) {
      return 'Você não possui permissão para enviar esta proposta ao TOTVS.';
    }

    if (error?.status === 401) {
      return 'Sua sessão expirou. Faça login novamente para enviar a proposta ao TOTVS.';
    }

    return 'Erro ao enviar proposta para o TOTVS.';
  }

  private atualizarDadosCobranca(numeroVenda?: string | null, nossoNumero?: string | null): void {
    if (!this.proposta) {
      return;
    }

    if (numeroVenda?.trim()) {
      this.proposta.numeroVenda = numeroVenda.trim();
    }

    if (nossoNumero?.trim()) {
      this.proposta.nossoNumero = nossoNumero.trim();
    }
  }

  private montarMensagemSucessoEnvioTotvs(response: EnviarPropostaTotvsResponse): string {
    const mensagemOriginal = response.mensagem?.trim() || 'Integração concluída com sucesso';
    const mensagemPrincipal = mensagemOriginal.split('.')
      .map((parte) => parte.trim())
      .find(Boolean) || mensagemOriginal;

    const detalhesPrincipal: string[] = [];

    if (response.numeroVenda?.trim()) {
      detalhesPrincipal.push(`Número de venda: ${response.numeroVenda.trim()}`);
    }

    if (response.nossoNumero?.trim()) {
      detalhesPrincipal.push(`Nosso número: ${response.nossoNumero.trim()}`);
    }

    const partes: string[] = [
      detalhesPrincipal.length
        ? `${mensagemPrincipal.replace(/[.\s]+$/, '')} (${detalhesPrincipal.join(' | ')}).`
        : `${mensagemPrincipal.replace(/[.\s]+$/, '')}.`
    ];

    if (response.cobrancaSincronizada) {
      if (response.mensagemCobranca?.trim()) {
        partes.push(`${response.mensagemCobranca.trim().replace(/[.\s]+$/, '')}.`);
      }
    } else if (response.erroCobranca?.trim()) {
      partes.push(this.formatarMensagemCobrancaPendente(response.erroCobranca));
    } else if (response.mensagemCobranca?.trim()) {
      partes.push(`${response.mensagemCobranca.trim().replace(/[.\s]+$/, '')}.`);
    }

    return partes.join(' ');
  }

  private formatarMensagemCobrancaPendente(erroCobranca: string): string {
    const erroNormalizado = erroCobranca.trim().replace(/[.\s]+$/, '');
    const matchDetalhes = erroNormalizado.match(/(BadRequest|Unauthorized|Forbidden|NotFound|Conflict)\s+Código:\s*([^\s]+)\s+Mensagem:\s*(.+)$/i);

    if (matchDetalhes) {
      const tipoErro = matchDetalhes[1].trim();
      const codigoErro = matchDetalhes[2].trim();
      const mensagemErro = matchDetalhes[3].trim().replace(/[.\s]+$/, '');
      return `Cobrança pendente(${tipoErro} Código: ${codigoErro}): ${mensagemErro}.`;
    }

    const mensagemErro = erroNormalizado.replace(/^.*?Mensagem:\s*/i, '').trim();

    if (mensagemErro && mensagemErro !== erroNormalizado) {
      return `Cobrança pendente: ${mensagemErro.replace(/[.\s]+$/, '')}.`;
    }

    return `Cobrança pendente: ${erroNormalizado}.`;
  }

  getNomeCliente(): string {
    return this.proposta?.cliente?.nome || this.proposta?.cliente?.nomeCliente || '-';
  }

  getCpfCnpjCliente(): string {
    return this.proposta?.cliente?.cpfCnpj || this.proposta?.cliente?.cpfCnpjCliente || '';
  }

  getStatusLabel(status: StatusAnalise): string {
    return STATUS_ANALISE_LABELS[status] || status;
  }

  getStatusSeverity(status: StatusAnalise): 'info' | 'warning' | 'success' | 'danger' {
    return STATUS_ANALISE_SEVERITY[status] || 'info';
  }

  formatarCpfCnpj(valor: string): string {
    if (!valor) return '';
    const v = valor.replace(/\D/g, '');
    if (v.length === 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (v.length === 14) {
      return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  }

  formatarMoeda(valor: number | null | undefined): string {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  }

  formatarPercentual(valor: number | null | undefined): string {
    return `${Number(valor ?? 0).toFixed(2)}%`;
  }

  getPercentualComponenteNaProposta(componente: ComponenteAnaliseDTO): number {
    const valorTotal = this.toDecimal(componente?.valorTotal ?? 0);
    const valorProposta = this.getValorSimulacao();

    if (valorProposta <= 0 || valorTotal.lte(0)) {
      return 0;
    }

    return valorTotal
      .div(valorProposta)
      .mul(100)
      .toDecimalPlaces(2)
      .toNumber();
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

  getValorTabelaPadrao(): number {
    return this.proposta?.tabelaPadrao?.valorTotal
      ?? this.proposta?.simulacaoProposta?.valorTabela
      ?? this.proposta?.empreendimento?.valorUnidade
      ?? 0;
  }

  getValorSimulacao(): number {
    return this.proposta?.simulacaoProposta?.valorProposta
      ?? this.proposta?.simulacaoProposta?.resumo?.valorTotal
      ?? 0;
  }

  getDiferenca(): number {
    const comparacao = this.proposta?.comparacao;

    if (comparacao?.diferencaValorTotal !== null && comparacao?.diferencaValorTotal !== undefined) {
      return comparacao.diferencaValorTotal;
    }

    if (this.proposta?.simulacaoProposta?.diferenca !== null && this.proposta?.simulacaoProposta?.diferenca !== undefined) {
      return this.proposta.simulacaoProposta.diferenca;
    }

    return Number((this.getValorSimulacao() - this.getValorTabelaPadrao()).toFixed(2));
  }

  getPercentualDiferenca(): number {
    const comparacao = this.proposta?.comparacao;

    if (comparacao?.diferencaPercentualTotal !== null && comparacao?.diferencaPercentualTotal !== undefined) {
      return comparacao.diferencaPercentualTotal;
    }

    if (this.proposta?.simulacaoProposta?.percentualDiferenca !== null
      && this.proposta?.simulacaoProposta?.percentualDiferenca !== undefined) {
      return this.proposta.simulacaoProposta.percentualDiferenca;
    }

    const valorTabela = this.getValorTabelaPadrao();
    return valorTabela > 0 ? Number(((this.getDiferenca() / valorTabela) * 100).toFixed(4)) : 0;
  }

  possuiAlteracoes(): boolean {
    const comparacao = this.proposta?.comparacao;

    if (comparacao?.possuiAlteracoes !== null && comparacao?.possuiAlteracoes !== undefined) {
      return comparacao.possuiAlteracoes;
    }

    return !!(
      comparacao?.componentesAlterados?.length
      || comparacao?.componentesAdicionados?.length
      || comparacao?.componentesRemovidos?.length
      || Math.abs(this.getDiferenca()) > 0.009
    );
  }

  isComponenteAlterado(codigoComponente?: string): boolean {
    if (!codigoComponente) {
      return false;
    }

    return this.proposta?.comparacao?.componentesAlterados?.includes(codigoComponente) ?? false;
  }

  getListaVencimentos(componente: ComponenteAnaliseDTO): VencimentoAnaliseDTO[] {
    return (componente.listaVencimentos ?? []) as VencimentoAnaliseDTO[];
  }

  possuiDetalhamentoVencimentos(componente: ComponenteAnaliseDTO): boolean {
    return this.getListaVencimentos(componente).length > 1;
  }

  getDataReferenciaComponente(componente: ComponenteAnaliseDTO): Date | null {
    const lista = this.getListaVencimentos(componente);

    if (lista.length) {
      return this.converterParaDate(lista[0].dataVencimento);
    }

    return this.obterDataBaseComponente(componente);
  }

  getNumeroParcelasLabel(componente: ComponenteAnaliseDTO): string {
    const quantidade = componente.quantidade ?? 1;
    return `${quantidade}x`;
  }

  getMensagensErroComponente(componente: ComponenteAnaliseDTO): string[] {
    return componente.mensagensErro ?? [];
  }

  private toDecimal(valor: Decimal.Value | null | undefined, fallback: Decimal.Value = 0): Decimal {
    try {
      if (valor === null || valor === undefined || valor === '') {
        return new Decimal(fallback);
      }

      return new Decimal(valor);
    } catch {
      return new Decimal(fallback);
    }
  }

  getClasseValidacao(validacao: ValidacaoAnaliseDTO): string {
    const nivel = this.getNivelValidacao(validacao);
    return `validacao-${nivel}`;
  }

  getNivelValidacao(validacao: ValidacaoAnaliseDTO): 'erro' | 'alerta' | 'info' {
    const nivel = (validacao.nivel || validacao.tipo || 'INFO').toUpperCase();

    if (nivel === 'ERRO') {
      return 'erro';
    }

    if (nivel === 'ALERTA' || nivel === 'AVISO') {
      return 'alerta';
    }

    return 'info';
  }

  getIconeValidacao(validacao: ValidacaoAnaliseDTO): string {
    const nivel = this.getNivelValidacao(validacao);

    if (nivel === 'erro') {
      return 'pi pi-times-circle';
    }

    if (nivel === 'alerta') {
      return 'pi pi-exclamation-triangle';
    }

    return 'pi pi-info-circle';
  }

  formatarRegraValidacao(regra?: string, campo?: string): string {
    if ((regra || '').toUpperCase() === 'PERCENTUAL_COMPONENTE') {
      return campo ? `Percentual de ${campo}` : 'Percentual do Componente';
    }

    if (!regra) {
      return 'Regra de negócio';
    }

    return regra
      .toLowerCase()
      .split('_')
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

  formatarValorValidacao(valor: number | null | undefined, validacao?: ValidacaoAnaliseDTO): string {
    if (valor === null || valor === undefined) {
      return '-';
    }

    if (this.validacaoRepresentaPercentual(validacao)) {
      return `${Number(valor).toFixed(2)}%`;
    }

    return this.formatarMoeda(valor);
  }

  getTotalValidacoesBloqueantes(): number {
    return this.validacoesVioladasExibicao.filter(validacao => validacao.bloqueante).length;
  }

  private calcularPercentualArrecadacao13PrimeirosMeses(componentes: ComponenteAnaliseDTO[]): number | null {
    const componentesOrdenados = [...componentes]
      .filter(componente => this.getDataReferenciaComponente(componente))
      .sort((a, b) => (this.getDataReferenciaComponente(a)?.getTime() ?? 0) - (this.getDataReferenciaComponente(b)?.getTime() ?? 0));

    if (!componentesOrdenados.length) {
      return null;
    }

    const primeiroVencimento = this.getDataReferenciaComponente(componentesOrdenados[0]);
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);

    if (!primeiroVencimento || !dataFinalContrato) {
      return null;
    }

    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    if (duracaoEmMeses <= 13) {
      return null;
    }

    const dataLimite = new Date(primeiroVencimento);
    dataLimite.setMonth(dataLimite.getMonth() + 12);

    const valorPrimeiros13Meses = this.calcularValorPorPeriodo(componentesOrdenados, primeiroVencimento, dataLimite);

    return this.getValorTabelaPadrao() > 0
      ? Number(((valorPrimeiros13Meses / this.getValorTabelaPadrao()) * 100).toFixed(2))
      : 0;
  }

  private calcularPercentualArrecadacao13UltimosMeses(componentes: ComponenteAnaliseDTO[]): number | null {
    const componentesOrdenados = [...componentes]
      .filter(componente => this.getDataReferenciaComponente(componente))
      .sort((a, b) => (this.getDataReferenciaComponente(b)?.getTime() ?? 0) - (this.getDataReferenciaComponente(a)?.getTime() ?? 0));

    if (!componentesOrdenados.length) {
      return null;
    }

    const primeiroVencimento = this.getDataReferenciaComponente(componentesOrdenados[componentesOrdenados.length - 1]);
    const dataFinalContrato = this.calcularDataFinalContrato(componentesOrdenados);

    if (!primeiroVencimento || !dataFinalContrato) {
      return null;
    }

    const duracaoEmMeses = this.calcularDiferencaMeses(primeiroVencimento, dataFinalContrato);
    if (duracaoEmMeses <= 13) {
      return null;
    }

    const dataLimite = new Date(dataFinalContrato);
    dataLimite.setMonth(dataLimite.getMonth() - 12);

    const valorUltimos13Meses = this.calcularValorPorPeriodo(componentesOrdenados, dataLimite, dataFinalContrato);

    return this.getValorTabelaPadrao() > 0
      ? Number(((valorUltimos13Meses / this.getValorTabelaPadrao()) * 100).toFixed(2))
      : 0;
  }

  private calcularDiferencaMeses(dataInicio: Date, dataFim: Date): number {
    const anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const meses = dataFim.getMonth() - dataInicio.getMonth();
    return anos * 12 + meses;
  }

  private calcularDataFinalContrato(componentes: ComponenteAnaliseDTO[]): Date | null {
    let dataFinal: Date | null = null;

    componentes.forEach(componente => {
      const listaVencimentos = this.getListaVencimentos(componente);

      if (listaVencimentos.length > 0) {
        const ultimaParcela = listaVencimentos[listaVencimentos.length - 1];
        const dataUltimaParcela = this.converterParaDate(ultimaParcela.dataVencimento);

        if (dataUltimaParcela && (!dataFinal || dataUltimaParcela > dataFinal)) {
          dataFinal = dataUltimaParcela;
        }
        return;
      }

      const vencimento = this.getDataReferenciaComponente(componente);
      if (vencimento && (!dataFinal || vencimento > dataFinal)) {
        dataFinal = vencimento;
      }
    });

    return dataFinal;
  }

  private calcularValorPorPeriodo(componentes: ComponenteAnaliseDTO[], dataInicio: Date, dataFim: Date): number {
    let valorTotal = 0;

    componentes.forEach(componente => {
      const listaVencimentos = this.getListaVencimentos(componente);

      if (listaVencimentos.length > 0) {
        listaVencimentos.forEach(parcela => {
          const dataParcela = this.converterParaDate(parcela.dataVencimento);
          if (dataParcela && dataParcela >= dataInicio && dataParcela <= dataFim) {
            valorTotal += parcela.valor ?? 0;
          }
        });
        return;
      }

      const vencimento = this.getDataReferenciaComponente(componente);
      if (vencimento && vencimento >= dataInicio && vencimento <= dataFim) {
        valorTotal += componente.valorTotal ?? 0;
      }
    });

    return Number(valorTotal.toFixed(2));
  }

  private validacaoRepresentaPercentual(validacao?: ValidacaoAnaliseDTO): boolean {
    const regra = (validacao?.regra || '').toUpperCase();

    if (regra.includes('ATO_MINIMO') || regra.includes('MENSAL_MINIMO')) {
      return false;
    }

    return regra.includes('MESES')
      || regra.includes('PERCENTUAL_COMPONENTE')
      || regra.includes('PARCELA')
      || regra.includes('SINAL');
  }

  private isValidacaoViolada(validacao: ValidacaoAnaliseDTO): boolean {
    const regra = (validacao.regra || '').toUpperCase();
    const valorEsperado = validacao.valorEsperado;
    const valorEncontrado = validacao.valorEncontrado;

    if (valorEsperado !== null && valorEsperado !== undefined && valorEncontrado !== null && valorEncontrado !== undefined) {
      if (regra.includes('PRIMEIROS_13_MESES') || regra.includes('ATO_MINIMO') || regra.includes('MENSAL_MINIMA') || regra.includes('SINAL')) {
        return valorEncontrado < valorEsperado;
      }

      if (regra.includes('ULTIMOS_13_MESES') || regra.includes('ULTIMA_PARCELA')) {
        return valorEncontrado > valorEsperado;
      }
    }

    if (validacao.bloqueante) {
      return true;
    }

    return this.getNivelValidacao(validacao) === 'erro';
  }

  getGraficoData(): any {
    const parcelasTabelaPadrao = this.extrairParcelas(this.componentesTabelaPadrao);
    const parcelasSimulacao = this.extrairParcelas(this.componentesSimulacao);
    const intervaloProposta = this.obterIntervaloMesesProposta(parcelasSimulacao, parcelasTabelaPadrao);
    const chaves = this.gerarChavesMeses(intervaloProposta);
    const serieTabelaPadrao = this.construirSerieMensal(parcelasTabelaPadrao, chaves, intervaloProposta);
    const serieSimulacao = this.construirSerieMensal(parcelasSimulacao, chaves, intervaloProposta);
    const marcadoresDiferenca = this.construirMarcadoresDiferenca(serieTabelaPadrao, serieSimulacao);

    return {
      labels: this.gerarLabelsAcumulados(chaves),
      datasets: [
        {
          label: 'Tabela Padrão',
          data: serieTabelaPadrao,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.25
        },
        {
          label: 'Simulação',
          data: serieSimulacao,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.16)',
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.25
        },
        {
          label: 'Divergência',
          data: marcadoresDiferenca,
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 6,
          showLine: false,
          fill: false
        }
      ]
    };
  }

  private extrairParcelas(componentes: ComponenteAnaliseDTO[]): Array<{ data: Date; valor: number }> {
    const parcelas: Array<{ data: Date; valor: number }> = [];

    componentes.forEach(componente => {
      const lista = this.getListaVencimentos(componente);

      if (lista.length) {
        lista.forEach(vencimento => {
          const data = this.converterParaDate(vencimento.dataVencimento);

          if (data) {
            parcelas.push({ data, valor: vencimento.valor ?? 0 });
          }
        });
        return;
      }

      const dataBase = this.getDataReferenciaComponente(componente);

      if (!dataBase) {
        return;
      }

      parcelas.push({
        data: dataBase,
        valor: componente.valorTotal ?? 0
      });
    });

    return parcelas;
  }

  private construirSerieMensal(
    parcelas: Array<{ data: Date; valor: number }>,
    chavesBase: string[],
    intervalo?: { inicio: Date; fim: Date } | null
  ): number[] {
    if (!chavesBase.length) {
      return [0];
    }

    const valoresPorMes = new Map<string, number>();

    parcelas.forEach(parcela => {
      if (!parcela.data || parcela.valor <= 0) {
        return;
      }

      if (intervalo && !this.estaDentroDoIntervaloMensal(parcela.data, intervalo)) {
        return;
      }

      const chave = `${parcela.data.getFullYear()}-${String(parcela.data.getMonth() + 1).padStart(2, '0')}`;
      valoresPorMes.set(chave, Number(((valoresPorMes.get(chave) ?? 0) + parcela.valor).toFixed(2)));
    });

    return chavesBase.map(chave => Number((valoresPorMes.get(chave) ?? 0).toFixed(2)));
  }

  private gerarChavesMeses(intervalo: { inicio: Date; fim: Date } | null): string[] {
    if (!intervalo) {
      return [];
    }

    const chaves: string[] = [];
    const cursor = new Date(intervalo.inicio);
    const ultimaData = new Date(intervalo.fim);

    while (cursor <= ultimaData) {
      chaves.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return chaves;
  }

  private gerarLabelsAcumulados(chaves: string[]): string[] {
    if (!chaves.length) {
      return ['Sem dados'];
    }

    return chaves.map(chave => this.formatarMesAno(chave));
  }

  private formatarMesAno(chave: string): string {
    const [ano, mes] = chave.split('-').map(Number);
    const data = new Date(ano, (mes || 1) - 1, 1);

    return data.toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit'
    }).replace('.', '');
  }

  private calcularValorTotalComponente(valorParcela: number, quantidade: number): number {
    const quantidadeSegura = Number.isFinite(quantidade) ? quantidade : 0;
    return this.toDecimal(valorParcela).mul(quantidadeSegura).toNumber();
  }

  private dividirValorSemArredondar(valorTotal: number, quantidade: number): number {
    const quantidadeSegura = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
    return this.truncarParaCentavos(this.toDecimal(valorTotal).div(quantidadeSegura)).toNumber();
  }

  private truncarParaCentavos(valor: Decimal.Value): Decimal {
    return this.toDecimal(valor).mul(100).trunc().div(100);
  }

  private distribuirValorTotalEmParcelas(valorTotal: number, quantidade: number): number[] {
    const quantidadeSegura = Math.max(Math.trunc(quantidade || 0), 1);
    const total = this.toDecimal(valorTotal).toDecimalPlaces(2);

    if (quantidadeSegura === 1) {
      return [total.toNumber()];
    }

    const valorBase = this.truncarParaCentavos(total.div(quantidadeSegura));
    const parcelas = Array.from({ length: quantidadeSegura }, () => valorBase);
    const somaParcelasFixas = valorBase.mul(quantidadeSegura - 1);
    const ultimaParcela = total.minus(somaParcelasFixas).toDecimalPlaces(2);

    parcelas[quantidadeSegura - 1] = ultimaParcela;

    return parcelas.map(parcela => parcela.toNumber());
  }

  private gerarVencimentos(
    dataBase: Date | null,
    quantidade: number,
    periodicidade: number,
    valorParcela: number,
    valorTotal?: number
  ): VencimentoDTO[] {
    const vencimentos: VencimentoDTO[] = [];
    const quantidadeSegura = Math.max(Math.trunc(quantidade || 0), 0);
    const valorTotalCalculado = valorTotal !== undefined
      ? this.toDecimal(valorTotal).toNumber()
      : this.calcularValorTotalComponente(valorParcela, quantidadeSegura);

    if (!dataBase || quantidadeSegura <= 0) {
      return vencimentos;
    }

    if (periodicidade === 0) {
      vencimentos.push({
        numeroParcela: 1,
        dataVencimento: new Date(dataBase),
        valor: this.toDecimal(valorTotalCalculado).toDecimalPlaces(2).toNumber()
      });
      return vencimentos;
    }

    const valoresParcelas = this.distribuirValorTotalEmParcelas(valorTotalCalculado, quantidadeSegura);

    for (let index = 0; index < quantidadeSegura; index++) {
      const dataVencimento = new Date(dataBase);
      dataVencimento.setMonth(dataVencimento.getMonth() + (index * periodicidade));

      vencimentos.push({
        numeroParcela: index + 1,
        dataVencimento,
        valor: valoresParcelas[index]
      });
    }

    return vencimentos;
  }

  private converterParaDate(valor?: Date | string | null): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  private formatarDataISO(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  private construirMarcadoresDiferenca(serieTabelaPadrao: number[], serieSimulacao: number[]): Array<number | null> {
    return serieTabelaPadrao.map((valorTabelaPadrao, index) => {
      const valorSimulacao = serieSimulacao[index] ?? 0;
      const possuiDiferenca = Math.abs(valorTabelaPadrao - valorSimulacao) > 0.009;

      if (!possuiDiferenca) {
        return null;
      }

      return Number(Math.max(valorTabelaPadrao, valorSimulacao).toFixed(2));
    });
  }

  private getDiferencaGraficoPorIndice(indice: number): number | null {
    const tabelaPadrao = Number(this.graficoData?.datasets?.[0]?.data?.[indice] ?? 0);
    const simulacao = Number(this.graficoData?.datasets?.[1]?.data?.[indice] ?? 0);
    const diferenca = Number((simulacao - tabelaPadrao).toFixed(2));

    return Math.abs(diferenca) > 0.009 ? diferenca : null;
  }

  private obterIntervaloMesesProposta(
    parcelasSimulacao: Array<{ data: Date; valor: number }>,
    parcelasTabelaPadrao: Array<{ data: Date; valor: number }>
  ): { inicio: Date; fim: Date } | null {
    const base = parcelasSimulacao.length ? parcelasSimulacao : parcelasTabelaPadrao;
    const parcelasOrdenadas = base
      .filter(parcela => parcela.data instanceof Date && !Number.isNaN(parcela.data.getTime()))
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    if (!parcelasOrdenadas.length) {
      return null;
    }

    const primeira = parcelasOrdenadas[0].data;
    const ultima = parcelasOrdenadas[parcelasOrdenadas.length - 1].data;

    return {
      inicio: new Date(primeira.getFullYear(), primeira.getMonth(), 1),
      fim: new Date(ultima.getFullYear(), ultima.getMonth(), 1)
    };
  }

  private estaDentroDoIntervaloMensal(data: Date, intervalo: { inicio: Date; fim: Date }): boolean {
    const dataMes = new Date(data.getFullYear(), data.getMonth(), 1);
    return dataMes >= intervalo.inicio && dataMes <= intervalo.fim;
  }
}