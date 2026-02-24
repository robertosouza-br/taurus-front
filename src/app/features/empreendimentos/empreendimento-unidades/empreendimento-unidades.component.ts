import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Unidade, getStatusColors, getStatusLabel } from '../../../core/models/unidade.model';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

/**
 * Interface para agrupar unidades por bloco
 */
interface BlocoUnidades {
  nome: string;
  totalUnidades: number;
  unidades: Unidade[];
  resumoPorStatus: {
    status: string;
    quantidade: number;
  }[];
}

/**
 * Componente de visualização de unidades em formato de mapa visual
 * 
 * FUNCIONALIDADES:
 * - Visualização em grid/mapa por blocos (inspirado no sistema legado)
 * - Cores por status para identificação rápida
 * - Tooltips com informações resumidas
 * - Click para ver detalhes completos
 * - Legendas e resumos por bloco
 * 
 * PERMISSÕES:
 * - EMPREENDIMENTO + CONSULTAR → Visualizar unidades
 * - Administradores têm acesso total
 * 
 * @updated 2026-02-09 - Mapa visual de unidades implementado
 */
@Component({
  selector: 'app-empreendimento-unidades',
  templateUrl: './empreendimento-unidades.component.html',
  styleUrls: ['./empreendimento-unidades.component.scss']
})
export class EmpreendimentoUnidadesComponent implements OnInit, OnDestroy {
  codigoEmpreendimento!: string;
  nomeEmpreendimento: string = '';
  codColigadaEmpreendimento: number = 0;
  unidades: Unidade[] = [];
  blocos: BlocoUnidades[] = [];
  statusDisponiveis: string[] = [];
  carregando = false;
  
  // Lista completa de todos os status possíveis do sistema (labels oficiais)
  readonly todosStatusPossiveis: string[] = [
    'Disponível para Venda',
    'Quitado',
    'Outros',
    'Reservado para Venda',
    'Bloqueado',
    'Não disponível',
    'Sinal Creditado/Cont.Assinado',
    'Contrato em assinatura',
    'Bloqueado Juridicamente',
    'Sinal Creditado/Cont.Andamento',
    'Sinal a Creditar/Cont.Andament',
    'Sinal a Creditar/Cont.Assinado',
    'Sinal Pago, Doc na Imobiliária',
    'Sinal Pago,Pendência Documento',
    'Fora de venda',
    'Sinal Creditado/ Cont.Finaliza'
  ];
  
  // Visualização
  visualizacao: 'grid' | 'list' = 'grid';
  
  // Filtros
  statusFiltroSelecionado: string = 'TODOS';
  displayFiltros = false;
  filtrosMenuItems: any[] = [];
  
  // Dialogs
  displayDetalhesUnidade = false;
  displayLegenda = false;
  unidadeSelecionada: Unidade | null = null;
  
  // Auto-refresh
  private autoRefreshInterval: any = null;
  private speedDialObserver: MutationObserver | null = null;
  private speedDialColorFramePending = false;
  ultimaAtualizacao: string = '';
  exibirBotaoVoltarTopo = false;
  
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empreendimentoService: EmpreendimentoService,
    private permissaoService: PermissaoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Verifica permissão de consulta
    if (!this.permissaoService.temPermissao(Funcionalidade.EMPREENDIMENTO, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    
    this.codigoEmpreendimento = this.route.snapshot.paramMap.get('codigo') || '';
    
    if (!this.codigoEmpreendimento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código do empreendimento não informado'
      });
      this.router.navigate(['/empreendimentos']);
      return;
    }
    
    // Busca nome do empreendimento do router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    
    if (state?.nomeEmpreendimento) {
      this.nomeEmpreendimento = state.nomeEmpreendimento;
    }
    if (state?.codColigada) {
      this.codColigadaEmpreendimento = Number(state.codColigada);
    }

    // Sempre inicia a tela no topo
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    this.configurarBreadcrumb();
    this.carregar();
    this.iniciarAutoRefresh();
    this.iniciarObservadorSpeedDial();
    window.addEventListener('scroll', this.atualizarVisibilidadeBotaoTopo, { passive: true });
    this.atualizarVisibilidadeBotaoTopo();
  }
  
  ngOnDestroy(): void {
    this.pararAutoRefresh();
    window.removeEventListener('scroll', this.atualizarVisibilidadeBotaoTopo);
    if (this.speedDialObserver) {
      this.speedDialObserver.disconnect();
      this.speedDialObserver = null;
    }
  }

  private atualizarVisibilidadeBotaoTopo = (): void => {
    this.exibirBotaoVoltarTopo = window.scrollY > 350;
  };

  voltarAoTopo(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  /**
   * Inicia atualização automática a cada 10 segundos
   */
  private iniciarAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      this.carregar(true); // true = refresh silencioso
    }, 10000); // 10 segundos
  }
  
  /**
   * Para a atualização automática
   */
  private pararAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
  
  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/empreendimentos' },
      { label: this.nomeEmpreendimento || `Cód. ${this.codigoEmpreendimento}` },
      { label: 'Mapa de Unidades' }
    ];
  }

  carregar(silencioso: boolean = false): void {
    // Salva posição do scroll antes de atualizar (apenas em modo silencioso)
    const scrollX = silencioso ? window.scrollX : 0;
    const scrollY = silencioso ? window.scrollY : 0;
    
    // Só mostra loading se não for refresh silencioso
    if (!silencioso) {
      this.carregando = true;
    }
    
    this.empreendimentoService.listarUnidades(this.codigoEmpreendimento)
      .pipe(finalize(() => {
        if (!silencioso) {
          this.carregando = false;
        }
      }))
      .subscribe({
        next: (unidades: Unidade[]) => {
          this.unidades = unidades;
          
          // Se não tem nome do empreendimento, busca da primeira unidade
          if (!this.nomeEmpreendimento && unidades.length > 0) {
            this.nomeEmpreendimento = unidades[0].empreendimento;
            this.configurarBreadcrumb();
          }
          
          // Agrupa unidades por bloco
          this.agruparPorBlocos();
          
          // Extrai status disponíveis
          this.extrairStatusDisponiveis();
          
          // Inicializa menu de filtros com status reais
          this.inicializarMenuFiltros();
          
          // Atualiza horário da última atualização
          this.atualizarHorario();
          
          // Restaura posição do scroll após atualização (apenas em modo silencioso)
          if (silencioso && (scrollX > 0 || scrollY > 0)) {
            // Usa setTimeout para garantir que o DOM foi completamente renderizado
            setTimeout(() => {
              window.scrollTo({
                left: scrollX,
                top: scrollY,
                behavior: 'auto'
              });
            }, 0);
          }
        },
        error: (error: any) => {
          console.error('Erro ao carregar unidades:', error);
          
          // Só mostra toast de erro se não for refresh silencioso
          if (!silencioso) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível carregar as unidades'
            });
          }
        }
      });
  }

  /**
   * Inicializa menu de filtros com status reais do banco
   */
  private inicializarMenuFiltros(): void {
    const iconesPorStatus: Record<string, string> = {
      'Disponível para Venda': 'pi-check-circle',
      'Quitado': 'pi-verified',
      'Outros': 'pi-info-circle',
      'Reservado para Venda': 'pi-clock',
      'Bloqueado': 'pi-lock',
      'Não disponível': 'pi-ban',
      'Sinal Creditado/Cont.Assinado': 'pi-file-check',
      'Contrato em assinatura': 'pi-pencil',
      'Bloqueado Juridicamente': 'pi-exclamation-triangle',
      'Sinal Creditado/Cont.Andamento': 'pi-folder',
      'Sinal a Creditar/Cont.Andament': 'pi-clock',
      'Sinal a Creditar/Cont.Assinado': 'pi-clock',
      'Sinal Pago, Doc na Imobiliária': 'pi-folder',
      'Sinal Pago,Pendência Documento': 'pi-exclamation-circle',
      'Fora de venda': 'pi-eye-slash',
      'Sinal Creditado/ Cont.Finaliza': 'pi-check'
    };

    this.filtrosMenuItems = [
      {
        icon: 'pi pi-circle-fill',
        cor: '#6b7280',
        command: () => this.aplicarFiltroStatus('TODOS'),
        tooltipOptions: {
          tooltipLabel: 'Todos os Status',
          tooltipPosition: 'left'
        },
        styleClass: this.getClasseCorFiltro('TODOS')
      },
      ...this.statusDisponiveis.map(status => ({
        icon: `pi ${iconesPorStatus[status] || 'pi-tag'}`,
        cor: this.getCorPorStatus(status),
        command: () => this.aplicarFiltroStatus(status),
        tooltipOptions: {
          tooltipLabel: status,
          tooltipPosition: 'left'
        },
        styleClass: this.getClasseCorFiltro(status)
      }))
    ];

    this.agendarAplicacaoCoresSpeedDial();
  }

  private iniciarObservadorSpeedDial(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.speedDialObserver = new MutationObserver(() => {
      this.agendarAplicacaoCoresSpeedDial();
    });

    this.speedDialObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    this.agendarAplicacaoCoresSpeedDial();
  }

  private agendarAplicacaoCoresSpeedDial(): void {
    if (this.speedDialColorFramePending) {
      return;
    }

    this.speedDialColorFramePending = true;
    requestAnimationFrame(() => {
      this.speedDialColorFramePending = false;
      this.aplicarCoresNosBotoesSpeedDial();
    });
  }

  private aplicarCoresNosBotoesSpeedDial(): void {
    const botoes = Array.from(
      document.querySelectorAll('.p-speeddial .p-speeddial-item .p-speeddial-action')
    ) as HTMLElement[];

    if (!botoes.length) {
      return;
    }

    botoes.forEach((botao, index) => {
      const item = this.filtrosMenuItems[index];
      const cor = item?.cor || '#64748b';
      botao.style.setProperty('background', cor, 'important');
      botao.style.setProperty('border', '2px solid rgba(255, 255, 255, 0.85)', 'important');
    });
  }

  private getClasseCorFiltro(status: string): string {
    const classesPorStatus: Record<string, string> = {
      'TODOS': 'filtro-cor-todos',
      'Disponível para Venda': 'filtro-cor-disponivel',
      'Quitado': 'filtro-cor-quitado',
      'Outros': 'filtro-cor-outros',
      'Reservado para Venda': 'filtro-cor-reservado',
      'Bloqueado': 'filtro-cor-bloqueado',
      'Não disponível': 'filtro-cor-indisponivel',
      'Sinal Creditado/Cont.Assinado': 'filtro-cor-creditado-assinado',
      'Contrato em assinatura': 'filtro-cor-em-assinatura',
      'Bloqueado Juridicamente': 'filtro-cor-bloq-juridico',
      'Sinal Creditado/Cont.Andamento': 'filtro-cor-creditado-andamento',
      'Sinal a Creditar/Cont.Andament': 'filtro-cor-a-creditar-andamento',
      'Sinal a Creditar/Cont.Assinado': 'filtro-cor-a-creditar-assinado',
      'Sinal Pago, Doc na Imobiliária': 'filtro-cor-doc-imobiliaria',
      'Sinal Pago,Pendência Documento': 'filtro-cor-pendencia',
      'Fora de venda': 'filtro-cor-fora',
      'Sinal Creditado/ Cont.Finaliza': 'filtro-cor-finalizado'
    };

    return classesPorStatus[status] || 'filtro-cor-default';
  }

  /**
   * Aplica filtros de status
   */
  aplicarFiltros(): void {
    this.agruparPorBlocos();
  }

  /**
   * Aplica filtro por status específico
   */
  aplicarFiltroStatus(status: string): void {
    this.statusFiltroSelecionado = status;
    this.aplicarFiltros();
  }

  /**
   * Limpa todos os filtros
   */
  limparFiltros(): void {
    this.statusFiltroSelecionado = 'TODOS';
    this.aplicarFiltros();
  }

  /**
   * Retorna unidades filtradas
   */
  private getUnidadesFiltradas(): Unidade[] {
    let unidadesFiltradas = [...this.unidades];

    // Filtro por status
    if (this.statusFiltroSelecionado !== 'TODOS') {
      unidadesFiltradas = unidadesFiltradas.filter(u => {
        // Compara pelo label do status
        const labelStatus = getStatusLabel(u.codigoStatusUnidade);
        return labelStatus === this.statusFiltroSelecionado;
      });
    }

    return unidadesFiltradas;
  }

  /**   * Agrupa unidades por bloco e calcula estatísticas
   */
  private agruparPorBlocos(): void {
    const blocosMap = new Map<string, Unidade[]>();
    
    // Usa unidades filtradas
    const unidadesFiltradas = this.getUnidadesFiltradas();
    
    // Agrupa por bloco
    unidadesFiltradas.forEach(unidade => {
      const nomeBloco = `BLOCO ${unidade.bloco}`;
      if (!blocosMap.has(nomeBloco)) {
        blocosMap.set(nomeBloco, []);
      }
      blocosMap.get(nomeBloco)!.push(unidade);
    });
    
    // Converte para array de BlocoUnidades com ordenação
    this.blocos = Array.from(blocosMap.entries())
      .map(([nome, unidades]) => {
        // Ordena unidades por número
        const unidadesOrdenadas = unidades.sort((a, b) => {
          const numA = parseInt(a.unidade) || 0;
          const numB = parseInt(b.unidade) || 0;
          return numB - numA; // Decrescente (maior primeiro - andares mais altos)
        });
        
        // Calcula resumo por status
        const resumoPorStatus = this.calcularResumoPorStatus(unidadesOrdenadas);
        
        return {
          nome,
          totalUnidades: unidades.length,
          unidades: unidadesOrdenadas,
          resumoPorStatus
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena blocos alfabeticamente
  }

  /**
   * Calcula quantidade de unidades por status em um array
   */
  private calcularResumoPorStatus(unidades: Unidade[]): { status: string; quantidade: number }[] {
    const statusMap = new Map<string, number>();
    
    unidades.forEach(unidade => {
      // Obtém o label do status pelo código numérico
      const statusLabel = getStatusLabel(unidade.codigoStatusUnidade);
      const count = statusMap.get(statusLabel) || 0;
      statusMap.set(statusLabel, count + 1);
    });
    
    return Array.from(statusMap.entries())
      .map(([status, quantidade]) => ({ status, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade); // Ordena por quantidade decrescente
  }

  /**
   * Extrai lista única de status presentes (usando codigoStatusUnidade numérico)
   * Atualizado: 23/02/2026 - Usa codigoStatusUnidade e getStatusLabel
   */
  private extrairStatusDisponiveis(): void {
    const statusSet = new Set<string>();
    this.unidades.forEach(unidade => {
      // Agora usa codigoStatusUnidade (number) e converte para label
      const label = getStatusLabel(unidade.codigoStatusUnidade);
      statusSet.add(label);
    });
    this.statusDisponiveis = Array.from(statusSet).sort();
  }

  /**
   * Retorna configuração de cor para um status (usando codigoStatusUnidade numérico)
   * Atualizado: 23/02/2026 - Usa getStatusColors do modelo para cores customizadas
   */
  getStatusColor(codigoStatus: number | string): { bg: string; border: string; text: string } {
    // Converte para número se vier como string
    const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
    
    // Usa a função helper do modelo que contém todas as cores corretas
    const colors = getStatusColors(codigo);
    
    return {
      bg: colors.bg,
      border: colors.border,
      text: colors.text
    };
  }

  /**
   * Retorna configuração de cor para um status pelo label (string)
   * Usado quando já temos o label e não o código numérico
   */
  getStatusColorByLabel(statusLabel: string): { bg: string; border: string; text: string } {
    // Busca a primeira unidade que tem esse label de status
    const unidadeComEsseStatus = this.unidades.find(u => getStatusLabel(u.codigoStatusUnidade) === statusLabel);
    
    if (unidadeComEsseStatus) {
      return this.getStatusColor(unidadeComEsseStatus.codigoStatusUnidade);
    }
    
    // Fallback para cinza caso não encontre
    return {
      bg: '#f3f4f6',
      border: '#9ca3af',
      text: '#374151'
    };
  }

  /**
   * Retorna o label do status (usando codigoStatusUnidade numérico)
   * Atualizado: 23/02/2026 - Usa getStatusLabel do modelo
   */
  getStatusLabel(codigoStatus: number | string): string {
    const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
    return getStatusLabel(codigo);
  }

  /**
   * Retorna opções do dropdown de filtro com cores
   */
  get opcoesDropdownFiltro(): Array<{ label: string; value: string; cor: string }> {
    const opcoes = [
      { label: 'Todos os Status', value: 'TODOS', cor: '#6b7280' }
    ];

    // Adiciona status disponíveis com suas cores
    this.statusDisponiveis.forEach(status => {
      opcoes.push({
        label: status,
        value: status,
        cor: this.getCorPorStatus(status)
      });
    });

    return opcoes;
  }

  /**
   * Resolve cor da opção do dropdown para item/selectedItem
   */
  getCorDaOpcaoFiltro(opcao: any): string {
    if (!opcao) {
      return '#9ca3af';
    }

    if (typeof opcao === 'string') {
      return this.getCorPorStatus(opcao);
    }

    if (opcao.cor) {
      return opcao.cor;
    }

    return this.getCorPorStatus(opcao.value || opcao.label || '');
  }

  /**
   * Resolve label da opção do dropdown para item/selectedItem
   */
  getLabelDaOpcaoFiltro(opcao: any): string {
    if (!opcao) {
      return 'Selecione um status';
    }

    if (typeof opcao === 'string') {
      return this.getStatusLabel(opcao);
    }

    return opcao.label || this.getStatusLabel(opcao.value || '');
  }

  /**
   * Retorna cor de um status específico (para o dropdown)
   * Atualizado: 23/02/2026 - Busca código numérico correspondente ao label
   */
  getCorPorStatus(statusLabel: string): string {
    const statusNormalizado = (statusLabel || '').trim();

    if (statusNormalizado === 'TODOS') {
      return '#6b7280';
    }

    // Busca o código correspondente ao label
    const unidadeComEsseStatus = this.unidades.find(u => getStatusLabel(u.codigoStatusUnidade) === statusNormalizado);
    if (unidadeComEsseStatus) {
      return this.getStatusColor(unidadeComEsseStatus.codigoStatusUnidade).border;
    }

    // Fallback
    return '#9ca3af';
  }

  /**
   * Retorna label curta para status (para resumos)
   * Atualizado: 23/02/2026 - Usa labels oficiais da documentação
   */
  getStatusLabelCurto(status: string): string {
    const labels: Record<string, string> = {
      'Disponível para Venda': 'Disponível',
      'Quitado': 'Quitado',
      'Outros': 'Outros',
      'Reservado para Venda': 'Reservado',
      'Bloqueado': 'Bloqueado',
      'Não disponível': 'Indisponível',
      'Sinal Creditado/Cont.Assinado': 'Assinado',
      'Contrato em assinatura': 'Em Assinatura',
      'Bloqueado Juridicamente': 'Bloq. Jurídico',
      'Sinal Creditado/Cont.Andamento': 'Creditado',
      'Sinal a Creditar/Cont.Andament': 'A Creditar',
      'Sinal a Creditar/Cont.Assinado': 'A Creditar',
      'Sinal Pago, Doc na Imobiliária': 'Doc Imob.',
      'Sinal Pago,Pendência Documento': 'Pendência',
      'Fora de venda': 'Fora',
      'Sinal Creditado/ Cont.Finaliza': 'Finalizado'
    };
    return labels[status] || status?.substring(0, 10) || 'N/A';
  }

  /**
   * Conta unidades por status em um bloco específico
   */
  getCountByStatusNoBloco(bloco: BlocoUnidades, status: string): number {
    return bloco.unidades.filter(u => {
      const statusLabel = getStatusLabel(u.codigoStatusUnidade);
      return statusLabel === status;
    }).length;
  }

  /**
   * Conta unidades por status
   */
  getCountByStatus(status: string): number {
    return this.unidades.filter(u => {
      const statusLabel = getStatusLabel(u.codigoStatusUnidade);
      return statusLabel === status;
    }).length;
  }
  
  /**
   * Retorna total de unidades filtradas
   */
  getTotalUnidadesFiltradas(): number {
    return this.blocos.reduce((total, bloco) => total + bloco.totalUnidades, 0);
  }
  
  /**
   * Retorna percentual de unidades por status
   */
  getPercentByStatus(status: string): number {
    if (this.unidades.length === 0) return 0;
    const count = this.getCountByStatus(status);
    return Math.round((count / this.unidades.length) * 100);
  }

  /**
   * Remove zeros à esquerda do número da unidade (somente para exibição)
   */
  formatarNumeroUnidade(unidade: string): string {
    const valor = (unidade || '').toString().trim();

    if (!valor) {
      return '';
    }

    if (/^\d+$/.test(valor)) {
      return valor.replace(/^0+/, '') || '0';
    }

    const semZerosNoInicio = valor.replace(/^0+(?=\d)/, '');
    return semZerosNoInicio || valor;
  }

  /**
   * Formata tipo de forma compacta (primeiras letras)
   */
  formatarTipoCompacto(tipo: string): string {
    const tipos: Record<string, string> = {
      'APARTAMENTO': 'AP',
      'COBERTURA': 'COB',
      'DUPLEX': 'DPX',
      'TRIPLEX': 'TPX',
      'LOFT': 'LFT',
      'STUDIO': 'STD',
      'LOJA': 'LJ',
      'SALA': 'SL'
    };
    return tipos[tipo.toUpperCase()] || tipo.substring(0, 3).toUpperCase();
  }

  /**
   * Formata tipo de forma completa
   */
  formatarTipoCompleto(tipo: string): string {
    const tipos: Record<string, string> = {
      'APARTAMENTO': 'Apartamento',
      'COBERTURA': 'Cobertura',
      'LOJA': 'Loja',
      'SALA': 'Sala Comercial',
      'DUPLEX': 'Duplex',
      'TRIPLEX': 'Triplex',
      'LOFT': 'Loft',
      'STUDIO': 'Studio'
    };
    return tipos[tipo?.toUpperCase()] || tipo?.charAt(0) + tipo?.slice(1).toLowerCase() || 'Unidade';
  }

  /**
   * Formata preço de forma compacta (ex: 450K, 1.2M)
   */
  formatarPrecoCompacto(preco: number): string {
    if (preco >= 1000000) {
      return `R$ ${(preco / 1000000).toFixed(1)}M`;
    }
    if (preco >= 1000) {
      return `R$ ${(preco / 1000).toFixed(0)}K`;
    }
    return `R$ ${preco.toFixed(0)}`;
  }

  /**
   * Retorna ícone apropriado baseado no tipo de unidade
   */
  getIconePorTipo(tipo: string, sigla?: string): string {
    const tipoUpper = tipo.toUpperCase();
    const siglaUpper = sigla?.toUpperCase() || '';
    
    // Mapeamento de ícones por tipo/sigla
    const icones: Record<string, string> = {
      'APARTAMENTO': 'pi-home',
      'AP': 'pi-home',
      'COBERTURA': 'pi-building',
      'COB': 'pi-building',
      'DUPLEX': 'pi-microsoft',
      'DPX': 'pi-microsoft',
      'TRIPLEX': 'pi-th-large',
      'TPX': 'pi-th-large',
      'LOFT': 'pi-stop',
      'LFT': 'pi-stop',
      'STUDIO': 'pi-circle',
      'STD': 'pi-circle',
      'LOJA': 'pi-shopping-cart',
      'LJ': 'pi-shopping-cart',
      'SALA': 'pi-briefcase',
      'SL': 'pi-briefcase',
      'CASA': 'pi-home',
      'CS': 'pi-home'
    };
    
    return icones[siglaUpper] || icones[tipoUpper] || 'pi-home';
  }

  /**
   * Formata valor completo como moeda BRL
   */
  formatarPreco(preco: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  }

  /**
   * Gera texto do tooltip com informações resumidas
   */
  getTooltipText(unidade: Unidade): string {
    return `
      Unidade: ${unidade.unidade}
      Tipo: ${unidade.tipo} - ${unidade.tipologia}
      Status: ${getStatusLabel(unidade.codigoStatusUnidade)}
      Preço: ${this.formatarPreco(unidade.preco)}
      Localização: ${unidade.localizacao}
      Garagem: ${unidade.garagem}
    `.trim();
  }

  /**
   * Abre o dialog de detalhes da unidade
   */
  abrirDetalhes(unidade: Unidade): void {
    // Força reset do dialog
    this.displayDetalhesUnidade = false;
    this.unidadeSelecionada = null;
    
    // Usa setTimeout para garantir que o Angular detecte a mudança
    setTimeout(() => {
      this.unidadeSelecionada = unidade;
      this.displayDetalhesUnidade = true;
    }, 0);
  }

  /**
   * Navega para tela de reserva da unidade
   */
  irParaReserva(unidade: Unidade): void {
    this.router.navigate(
      ['/reservas/empreendimento', this.codigoEmpreendimento,
       'bloco', unidade.bloco,
       'unidade', unidade.unidade, 'nova'],
      {
        state: {
          nomeEmpreendimento: this.nomeEmpreendimento,
          codColigadaEmpreendimento: this.codColigadaEmpreendimento,
          codigoStatusUnidade: unidade.codigoStatusUnidade,
          tipoUnidade: unidade.sigla || unidade.tipo,
          tipologia: unidade.tipologia,
          preco: unidade.preco
        }
      }
    );
  }

  /**
   * Callback quando o dialog fecha
   */
  onDialogClose(visible: boolean): void {
    if (!visible) {
      this.unidadeSelecionada = null;
    }
  }

  /**
   * Retorna a severidade do status para o componente p-tag
   */
  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('disponível') || statusLower.includes('disponivel')) {
      return 'success';
    }
    
    if (statusLower.includes('vendida') || statusLower.includes('finaliza')) {
      return 'info';
    }
    
    if (statusLower.includes('reservada') || statusLower.includes('creditado')) {
      return 'warning';
    }
    
    if (statusLower.includes('indisponível') || statusLower.includes('indisponivel')) {
      return 'danger';
    }
    
    return 'secondary';
  }
  
  /**
   * Atualiza horário da última atualização
   */
  private atualizarHorario(): void {
    const agora = new Date();
    this.ultimaAtualizacao = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  voltar(): void {
    this.router.navigate(['/empreendimentos']);
  }
  
  /**
   * Retorna se há auto-refresh ativo (para mostrar indicador na UI se necessário)
   */
  get autoRefreshAtivo(): boolean {
    return this.autoRefreshInterval !== null;
  }

  /**
   * TrackBy function para otimização de *ngFor de status
   */
  trackByStatus(_index: number, status: string): string {
    return status;
  }

  /**
   * TrackBy function para otimização de *ngFor de resumo por status
   */
  trackByResumoStatus(_index: number, resumo: { status: string; quantidade: number }): string {
    return resumo.status;
  }
}
