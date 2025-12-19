/**
 * Status possíveis de uma unidade
 */
export enum StatusUnidade {
  DISPONIVEL = 'DISPONIVEL',
  RESERVADA = 'RESERVADA',
  VENDIDA = 'VENDIDA',
  EM_NEGOCIACAO = 'EM_NEGOCIACAO',
  INDISPONIVEL = 'INDISPONIVEL',
  EM_CONSTRUCAO = 'EM_CONSTRUCAO'
}

/**
 * Tipos de unidade
 */
export enum TipoUnidade {
  APARTAMENTO = 'APARTAMENTO',
  COBERTURA = 'COBERTURA',
  DUPLEX = 'DUPLEX',
  TRIPLEX = 'TRIPLEX',
  LOFT = 'LOFT',
  STUDIO = 'STUDIO'
}

/**
 * Labels dos status de unidade
 */
export const STATUS_UNIDADE_LABELS: Record<StatusUnidade, string> = {
  [StatusUnidade.DISPONIVEL]: 'Disponível',
  [StatusUnidade.RESERVADA]: 'Reservada',
  [StatusUnidade.VENDIDA]: 'Vendida',
  [StatusUnidade.EM_NEGOCIACAO]: 'Em Negociação',
  [StatusUnidade.INDISPONIVEL]: 'Indisponível',
  [StatusUnidade.EM_CONSTRUCAO]: 'Em Construção'
};

/**
 * Labels dos tipos de unidade
 */
export const TIPO_UNIDADE_LABELS: Record<TipoUnidade, string> = {
  [TipoUnidade.APARTAMENTO]: 'Apartamento',
  [TipoUnidade.COBERTURA]: 'Cobertura',
  [TipoUnidade.DUPLEX]: 'Duplex',
  [TipoUnidade.TRIPLEX]: 'Triplex',
  [TipoUnidade.LOFT]: 'Loft',
  [TipoUnidade.STUDIO]: 'Studio'
};

/**
 * Cores por status
 */
export const STATUS_COLORS: Record<StatusUnidade, { bg: string; border: string; text: string; severity: string }> = {
  [StatusUnidade.DISPONIVEL]: { 
    bg: '#d1fae5', 
    border: '#10b981', 
    text: '#065f46',
    severity: 'success'
  },
  [StatusUnidade.RESERVADA]: { 
    bg: '#fef3c7', 
    border: '#f59e0b', 
    text: '#92400e',
    severity: 'warning'
  },
  [StatusUnidade.VENDIDA]: { 
    bg: '#e0e7ff', 
    border: '#6366f1', 
    text: '#312e81',
    severity: 'info'
  },
  [StatusUnidade.EM_NEGOCIACAO]: { 
    bg: '#fce7f3', 
    border: '#ec4899', 
    text: '#831843',
    severity: 'warning'
  },
  [StatusUnidade.INDISPONIVEL]: { 
    bg: '#f3f4f6', 
    border: '#9ca3af', 
    text: '#374151',
    severity: 'secondary'
  },
  [StatusUnidade.EM_CONSTRUCAO]: { 
    bg: '#dbeafe', 
    border: '#3b82f6', 
    text: '#1e40af',
    severity: 'info'
  }
};

/**
 * Ícones por tipo de unidade
 */
export const TIPO_ICONS: Record<TipoUnidade, string> = {
  [TipoUnidade.APARTAMENTO]: 'pi pi-home',
  [TipoUnidade.COBERTURA]: 'pi pi-building',
  [TipoUnidade.DUPLEX]: 'pi pi-th-large',
  [TipoUnidade.TRIPLEX]: 'pi pi-table',
  [TipoUnidade.LOFT]: 'pi pi-box',
  [TipoUnidade.STUDIO]: 'pi pi-stop'
};

/**
 * Interface da Unidade (UnidadeEmpreendimentoDTO do backend)
 */
export interface Unidade {
  empreendimento: string;      // Nome do empreendimento
  bloco: string;                // Número do bloco
  unidade: string;              // Código da unidade
  fracaoIdeal: number;          // Fração ideal (decimal)
  sigla: string;                // Sigla da unidade (ex: LJ, AP)
  statusUnidade: string;        // Status da unidade
  tipo: string;                 // Tipo (LOJA, APARTAMENTO, etc)
  tipologia: string;            // Tipologia detalhada
  localizacao: string;          // Localização
  posicaoSol: string;           // Posição em relação ao sol
  fachada: string;              // Tipo de fachada
  garagem: string;              // Informações sobre garagem
  preco: number;                // Preço da unidade
}

/**
 * Interface de filtros de unidade
 */
export interface FiltroUnidade {
  empreendimento?: string;
  tipo?: TipoUnidade;
  status?: StatusUnidade;
  precoMin?: number;
  precoMax?: number;
  busca?: string;
}
