import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { EmpreendimentoDTO, STATUS_EMPREENDIMENTO_COLORS } from '../../../core/models/empreendimento.model';
import { Unidade } from '../../../core/models/unidade.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

interface VisualizacaoOption {
  label: string;
  value: 'planta' | 'grid' | 'cards';
  icon: string;
}

@Component({
  selector: 'app-empreendimento-detalhes',
  templateUrl: './empreendimento-detalhes.component.html',
  styleUrls: ['./empreendimento-detalhes.component.scss']
})
export class EmpreendimentoDetalhesComponent implements OnInit, OnDestroy {
  empreendimento: EmpreendimentoDTO | null = null;
  unidades: Unidade[] = [];
  unidadesFiltradas: Unidade[] = [];
  
  carregando = false;
  visualizacao: 'planta' | 'grid' | 'cards' = 'planta';
  
  // Filtros
  statusSelecionado: string | null = null;
  tipoSelecionado: string | null = null;
  
  // Autocomplete
  unidadeSelecionada: Unidade | null = null;
  unidadesFiltradasAutocomplete: Unidade[] = [];
  statusFiltrados: { label: string; value: string }[] = [];
  tiposFiltrados: { label: string; value: string }[] = [];
  
  // Cubo 3D
  rotacaoY = 0;
  rotacaoX = 0;
  blocoAtual = 0;
  animandoCubo = false;
  
  // Opções
  visualizacaoOptions: VisualizacaoOption[] = [
    { label: 'Cubo', value: 'planta', icon: 'pi pi-th-large' },
    { label: 'Grid', value: 'grid', icon: 'pi pi-table' },
    { label: 'Cards', value: 'cards', icon: 'pi pi-list' }
  ];
  
  statusOptions: { label: string; value: string }[] = [];
  tiposOptions: { label: string; value: string }[] = [];
  
  // Constantes
  readonly STATUS_EMP_COLORS = STATUS_EMPREENDIMENTO_COLORS;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  
  private empreendimentoId: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empreendimentoService: EmpreendimentoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.carregarOpcoes();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.empreendimentoId = params['id'];
      if (this.empreendimentoId) {
        this.carregarDados();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  rotacionarCubo(direcao: 'proximo' | 'anterior'): void {
    if (this.animandoCubo) return;
    
    const blocos = this.getBlocos();
    if (blocos.length === 0) return;
    
    this.animandoCubo = true;
    
    if (direcao === 'proximo') {
      this.blocoAtual = (this.blocoAtual + 1) % blocos.length;
      this.rotacaoY -= 90;
    } else {
      this.blocoAtual = this.blocoAtual === 0 ? blocos.length - 1 : this.blocoAtual - 1;
      this.rotacaoY += 90;
    }
    
    setTimeout(() => {
      this.animandoCubo = false;
    }, 600);
  }
  
  rotacionarCuboVertical(direcao: 'cima' | 'baixo'): void {
    if (this.animandoCubo) return;
    
    this.animandoCubo = true;
    
    if (direcao === 'cima') {
      this.rotacaoX += 90;
    } else {
      this.rotacaoX -= 90;
    }
    
    setTimeout(() => {
      this.animandoCubo = false;
    }, 600);
  }

  private carregarOpcoes(): void {
    // Status disponíveis no backend
    this.statusOptions = [
      { label: 'Disponível para Venda', value: 'Disponível para Venda' },
      { label: 'Sinal Creditado/ Cont.Finaliza', value: 'Sinal Creditado/ Cont.Finaliza' },
      { label: 'Vendido', value: 'Vendido' },
      { label: 'Reservado', value: 'Reservado' },
      { label: 'Bloqueado', value: 'Bloqueado' }
    ];

    // Tipos disponíveis no backend
    this.tiposOptions = [
      { label: 'LOJA', value: 'LOJA' },
      { label: 'APARTAMENTO', value: 'APARTAMENTO' },
      { label: 'SALA COMERCIAL', value: 'SALA COMERCIAL' },
      { label: 'COBERTURA', value: 'COBERTURA' },
      { label: 'STUDIO', value: 'STUDIO' },
      { label: 'KITNET', value: 'KITNET' }
    ];
  }

  private carregarDados(): void {
    this.carregando = true;

    // Temporariamente só carregar unidades, já que buscarPorId não existe no backend fake
    this.empreendimentoService.listarUnidades(this.empreendimentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unidades) => {
          debugger
          this.unidades = unidades;
          
          // Extrair dados do empreendimento das unidades
          if (unidades.length > 0) {
            this.empreendimento = {
              id: this.empreendimentoId,
              nome: unidades[0].empreendimento,
              descricao: `Empreendimento ${unidades[0].empreendimento}`,
              endereco: '',
              cidade: 'Rio de Janeiro',
              estado: 'RJ',
              cep: '',
              status: 'Em Construção',
              totalUnidades: unidades.length,
              unidadesDisponiveis: unidades.filter(u => u.statusUnidade.includes('Disponível')).length,
              valorMinimo: Math.min(...unidades.map(u => u.preco)),
              valorMaximo: Math.max(...unidades.map(u => u.preco)),
              construtora: 'RM Taurus',
              dataPrevistaEntrega: '12/2025',
              ativo: true
            };
          }
          
          this.configurarBreadcrumb();
          this.aplicarFiltros();
          this.carregando = false;
        },
        error: (error) => {
          this.carregando = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar dados do empreendimento'
          });
          this.router.navigate(['/imoveis/empreendimentos']);
        }
      });
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/imoveis/empreendimentos' },
      { label: this.empreendimento?.nome || 'Detalhes' }
    ];
  }

  aplicarFiltros(): void {
    let resultado = [...this.unidades];

    if (this.statusSelecionado) {
      const statusValor = typeof this.statusSelecionado === 'string' 
        ? this.statusSelecionado 
        : (this.statusSelecionado as any).value;
      resultado = resultado.filter(u => u.statusUnidade === statusValor);
    }

    if (this.tipoSelecionado) {
      const tipoValor = typeof this.tipoSelecionado === 'string' 
        ? this.tipoSelecionado 
        : (this.tipoSelecionado as any).value;
      resultado = resultado.filter(u => u.tipo === tipoValor);
    }

    this.unidadesFiltradas = resultado;
  }

  /**
   * Busca unidades para autocomplete
   */
  buscarUnidades(event: any): void {
    const query = event.query?.toLowerCase() || '';
    
    if (!query) {
      // Se não há query, mostrar todas as unidades
      this.unidadesFiltradasAutocomplete = [...this.unidades];
      return;
    }
    
    this.unidadesFiltradasAutocomplete = this.unidades.filter(unidade => {
      const codigo = unidade.unidade.toLowerCase();
      const tipologia = unidade.tipologia.toLowerCase();
      const bloco = unidade.bloco.toLowerCase();
      const sigla = unidade.sigla.toLowerCase();
      
      return codigo.includes(query) || 
             tipologia.includes(query) || 
             bloco.includes(query) ||
             sigla.includes(query);
    });
  }

  /**
   * Ao selecionar unidade no autocomplete
   */
  aoSelecionarUnidade(event: any): void {
    const unidade = event.value || event;
    if (unidade) {
      // Rolar até a unidade selecionada
      this.selecionarUnidade(unidade);
      
      // Se estiver em modo planta, destacar a unidade
      if (this.visualizacao === 'planta') {
        // Lógica para destacar visualmente
      }
    }
  }

  /**
   * Limpar seleção de autocomplete
   */
  limparSelecaoUnidade(): void {
    this.unidadeSelecionada = null;
  }

  /**
   * Template para exibição no autocomplete
   */
  getUnidadeLabel(unidade: Unidade): string {
    return `${unidade.unidade} - ${unidade.tipologia} (Bloco ${unidade.bloco})`;
  }

  /**
   * Busca status para autocomplete
   */
  buscarStatus(event: any): void {
    const query = event.query?.toLowerCase() || '';
    
    if (!query) {
      // Se não há query, mostrar todos os status
      this.statusFiltrados = [...this.statusOptions];
      return;
    }
    
    this.statusFiltrados = this.statusOptions.filter(status => 
      status.label.toLowerCase().includes(query)
    );
  }

  /**
   * Busca tipos para autocomplete
   */
  buscarTipos(event: any): void {
    const query = event.query?.toLowerCase() || '';
    
    if (!query) {
      // Se não há query, mostrar todos os tipos
      this.tiposFiltrados = [...this.tiposOptions];
      return;
    }
    
    this.tiposFiltrados = this.tiposOptions.filter(tipo => 
      tipo.label.toLowerCase().includes(query)
    );
  }

  limparFiltros(): void {
    this.statusSelecionado = null;
    this.tipoSelecionado = null;
    this.aplicarFiltros();
  }

  voltar(): void {
    this.router.navigate(['/imoveis/empreendimentos']);
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatarFracaoIdeal(valor: number): string {
    return `${(valor * 100).toFixed(4)}%`;
  }

  getStatusEmpColor(status: string): { bg: string; color: string; icon: string } {
    return this.STATUS_EMP_COLORS[status] || { bg: '#f5f5f5', color: '#666666', icon: 'pi pi-info-circle' };
  }

  // Métodos para visualização em planta (mesmo do componente de unidades)
  agruparPorBlocoEAndar(): Map<string, Map<string, Unidade[]>> {
    const mapa = new Map<string, Map<string, Unidade[]>>();

    this.unidadesFiltradas.forEach(unidade => {
      if (!mapa.has(unidade.bloco)) {
        mapa.set(unidade.bloco, new Map());
      }

      const andar = unidade.unidade.substring(2, 4);
      
      const blocoMap = mapa.get(unidade.bloco)!;
      if (!blocoMap.has(andar)) {
        blocoMap.set(andar, []);
      }

      blocoMap.get(andar)!.push(unidade);
    });

    return mapa;
  }

  getBlocos(): string[] {
    return Array.from(this.agruparPorBlocoEAndar().keys()).sort();
  }

  getAndares(bloco: string): string[] {
    const blocoMap = this.agruparPorBlocoEAndar().get(bloco);
    if (!blocoMap) return [];
    return Array.from(blocoMap.keys()).sort().reverse();
  }

  getUnidadesDoAndar(bloco: string, andar: string): Unidade[] {
    const blocoMap = this.agruparPorBlocoEAndar().get(bloco);
    if (!blocoMap) return [];
    return blocoMap.get(andar) || [];
  }

  selecionarUnidade(unidade: Unidade): void {
    this.messageService.add({
      severity: 'info',
      summary: `${unidade.tipologia} - ${unidade.unidade}`,
      detail: `${this.formatarValor(unidade.preco)} - ${unidade.statusUnidade}`,
      life: 5000
    });
  }
}
