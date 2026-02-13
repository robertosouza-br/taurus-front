import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { Unidade, STATUS_COLORS, STATUS_UNIDADE_LABELS } from '../../../core/models/unidade.model';
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
  unidades: Unidade[] = [];
  blocos: BlocoUnidades[] = [];
  statusDisponiveis: string[] = [];
  carregando = false;
  
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
  ultimaAtualizacao: string = '';
  
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
    
    this.configurarBreadcrumb();
    this.carregar();
    this.iniciarAutoRefresh();
  }
  
  ngOnDestroy(): void {
    this.pararAutoRefresh();
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
    const scrollPosition = silencioso ? window.scrollY : 0;
    
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
          if (silencioso) {
            setTimeout(() => {
              window.scrollTo(0, scrollPosition);
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
      'Não Vendida / Estoque': 'pi-box',
      'Reservada/ Assinatura dos instrumentos aquisitivos': 'pi-file-edit',
      'Assinado, com Sinal a creditar e documentos na imobiliária': 'pi-file',
      'Sinal Creditado, mas com todos os documentos na imobiliária': 'pi-folder',
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': 'pi-folder-open',
      'Sinal Creditado, mas com pendência de documentos': 'pi-exclamation-triangle',
      'Sinal Creditado e sem pendência de documentos': 'pi-check-circle',
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': 'pi-verified',
      'Sinal creditado, mas cliente pediu distrato': 'pi-times-circle',
      'Fora de venda': 'pi-ban'
    };

    const coresPorStatus: Record<string, string> = {
      'Não Vendida / Estoque': '#d1d5db',
      'Reservada/ Assinatura dos instrumentos aquisitivos': '#ef4444',
      'Assinado, com Sinal a creditar e documentos na imobiliária': '#f97316',
      'Sinal Creditado, mas com todos os documentos na imobiliária': '#f59e0b',
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': '#facc15',
      'Sinal Creditado, mas com pendência de documentos': '#86efac',
      'Sinal Creditado e sem pendência de documentos': '#22c55e',
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': '#3b82f6',
      'Sinal creditado, mas cliente pediu distrato': '#a855f7',
      'Fora de venda': '#9ca3af'
    };

    this.filtrosMenuItems = [
      {
        icon: 'pi pi-circle-fill',
        command: () => this.aplicarFiltroStatus('TODOS'),
        tooltipOptions: {
          tooltipLabel: 'Todos os Status',
          tooltipPosition: 'left'
        },
        style: { 'background-color': '#6b7280' }
      },
      ...this.statusDisponiveis.map(status => ({
        icon: `pi ${iconesPorStatus[status] || 'pi-tag'}`,
        command: () => this.aplicarFiltroStatus(status),
        tooltipOptions: {
          tooltipLabel: status,
          tooltipPosition: 'left'
        },
        style: { 'background-color': coresPorStatus[status] || '#6366f1' }
      }))
    ];
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
        return u.statusUnidade === this.statusFiltroSelecionado;
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
      const count = statusMap.get(unidade.statusUnidade) || 0;
      statusMap.set(unidade.statusUnidade, count + 1);
    });
    
    return Array.from(statusMap.entries())
      .map(([status, quantidade]) => ({ status, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade); // Ordena por quantidade decrescente
  }

  /**
   * Extrai lista única de status presentes
   */
  private extrairStatusDisponiveis(): void {
    const statusSet = new Set<string>();
    this.unidades.forEach(unidade => statusSet.add(unidade.statusUnidade));
    this.statusDisponiveis = Array.from(statusSet).sort();
  }

  /**
   * Retorna configuração de cor para um status
   */
  getStatusColor(status: string): { bg: string; border: string; text: string } {
    const coresPorStatus: Record<string, { bg: string; border: string; text: string }> = {
      // Status da tabela de cores
      'Não Vendida / Estoque': {
        bg: '#f3f4f6',
        border: '#d1d5db',
        text: '#4b5563'
      },
      'Reservada/ Assinatura dos instrumentos aquisitivos': {
        bg: '#fee2e2',
        border: '#ef4444',
        text: '#991b1b'
      },
      'Assinado, com Sinal a creditar e documentos na imobiliária': {
        bg: '#ffedd5',
        border: '#f97316',
        text: '#9a3412'
      },
      'Sinal Creditado, mas com todos os documentos na imobiliária': {
        bg: '#fef3c7',
        border: '#f59e0b',
        text: '#92400e'
      },
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': {
        bg: '#fef9c3',
        border: '#facc15',
        text: '#854d0e'
      },
      'Sinal Creditado, mas com pendência de documentos': {
        bg: '#dcfce7',
        border: '#86efac',
        text: '#166534'
      },
      'Sinal Creditado e sem pendência de documentos': {
        bg: '#d1fae5',
        border: '#22c55e',
        text: '#065f46'
      },
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': {
        bg: '#dbeafe',
        border: '#3b82f6',
        text: '#1e40af'
      },
      'Sinal creditado, mas cliente pediu distrato': {
        bg: '#f3e8ff',
        border: '#a855f7',
        text: '#6b21a8'
      },
      'Fora de venda': {
        bg: '#e5e7eb',
        border: '#6b7280',
        text: '#1f2937'
      },
      // Status antigos do banco (mapeamento)
      'Disponível para Venda': {
        bg: '#ffffff',
        border: '#e5e7eb',
        text: '#6b7280'
      },
      'Reservado para Venda': {
        bg: '#fee2e2',
        border: '#ef4444',
        text: '#991b1b'
      },
      'Sinal Creditado/ Cont.Finaliza': {
        bg: '#dbeafe',
        border: '#3b82f6',
        text: '#1e40af'
      },
      'Sinal a Creditar/Cont.Andament': {
        bg: '#fef9c3',
        border: '#facc15',
        text: '#854d0e'
      },
      'Sinal Creditado/Cont.Andamento': {
        bg: '#fef3c7',
        border: '#f59e0b',
        text: '#92400e'
      }
    };
    
    return coresPorStatus[status] || {
      bg: '#f3f4f6',
      border: '#9ca3af',
      text: '#374151'
    };
  }

  /**
   * Retorna label amigável para status
   */
  getStatusLabel(status: string): string {
    // Como os status já vêm em português do banco, retorna direto
    return status || 'Status não informado';
  }

  /**
   * Retorna label curta para status (para resumos)
   */
  getStatusLabelCurto(status: string): string {
    const labels: Record<string, string> = {
      'Não Vendida / Estoque': 'Estoque',
      'Reservada/ Assinatura dos instrumentos aquisitivos': 'Reservada',
      'Assinado, com Sinal a creditar e documentos na imobiliária': 'Assinado',
      'Sinal Creditado, mas com todos os documentos na imobiliária': 'Creditado',
      'Sinal a Creditar, mas com todos os documentos entregue na Calper': 'A Creditar',
      'Sinal Creditado, mas com pendência de documentos': 'Pendência',
      'Sinal Creditado e sem pendência de documentos': 'OK',
      'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA': 'Finalizado',
      'Sinal creditado, mas cliente pediu distrato': 'Distrato',
      'Fora de venda': 'Fora'
    };
    return labels[status] || status?.substring(0, 7) || 'N/A';
  }

  /**
   * Conta unidades por status
   */
  getCountByStatus(status: string): number {
    return this.unidades.filter(u => u.statusUnidade === status).length;
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
      Status: ${this.getStatusLabel(unidade.statusUnidade)}
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
    // TODO: Implementar navegação para tela de reserva
    this.messageService.add({
      severity: 'info',
      summary: 'Reserva',
      detail: `Navegação para reserva da unidade ${unidade.unidade} em desenvolvimento`
    });
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
}
