/**
 * Códigos de status reais da unidade (retornados pelo backend TOTVS RM)
 * Atualizado: 23/02/2026 - Integração completa com API
 */
export enum CodigoStatusUnidade {
  DISPONIVEL_VENDA = 100,
  QUITADO = 102,
  OUTROS = 103,
  RESERVADO_VENDA = 200,
  BLOQUEADO = 250,
  NAO_DISPONIVEL = 251,
  SINAL_CREDITADO_CONTRATO_ASSINADO = 301,
  CONTRATO_EM_ASSINATURA = 441,
  BLOQUEADO_JURIDICAMENTE = 600,
  SINAL_CREDITADO_CONTRATO_ANDAMENTO = 801,
  SINAL_A_CREDITAR_CONTRATO_ANDAMENTO = 802,
  SINAL_A_CREDITAR_CONTRATO_ASSINADO = 803,
  SINAL_PAGO_DOC_IMOBILIARIA = 804,
  SINAL_PAGO_PENDENCIA_DOCUMENTO = 805,
  FORA_DE_VENDA = 820,
  SINAL_CREDITADO_CONTRATO_FINALIZADO = 900,
  PROCESSO_FINALIZADO_PCV = 901
}

/**
 * Labels descritivos para cada código de status
 */
export const CODIGO_STATUS_LABELS: Record<number, string> = {
  [CodigoStatusUnidade.DISPONIVEL_VENDA]: 'Disponível para Venda',
  [CodigoStatusUnidade.QUITADO]: 'Quitado',
  [CodigoStatusUnidade.OUTROS]: 'Outros',
  [CodigoStatusUnidade.RESERVADO_VENDA]: 'Reservado para Venda',
  [CodigoStatusUnidade.BLOQUEADO]: 'Bloqueado',
  [CodigoStatusUnidade.NAO_DISPONIVEL]: 'Não Disponível',
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ASSINADO]: 'Sinal Creditado/Contrato Assinado',
  [CodigoStatusUnidade.CONTRATO_EM_ASSINATURA]: 'Contrato em Assinatura',
  [CodigoStatusUnidade.BLOQUEADO_JURIDICAMENTE]: 'Bloqueado Juridicamente',
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ANDAMENTO]: 'Sinal Creditado/Contrato em Andamento',
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ANDAMENTO]: 'Sinal a Creditar/Contrato em Andamento',
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ASSINADO]: 'Sinal a Creditar/Contrato Assinado',
  [CodigoStatusUnidade.SINAL_PAGO_DOC_IMOBILIARIA]: 'Sinal Pago, Doc na Imobiliária',
  [CodigoStatusUnidade.SINAL_PAGO_PENDENCIA_DOCUMENTO]: 'Sinal Pago, Pendência de Documento',
  [CodigoStatusUnidade.FORA_DE_VENDA]: 'Fora de Venda',
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_FINALIZADO]: 'Sinal Creditado/Contrato Finalizado',
  [CodigoStatusUnidade.PROCESSO_FINALIZADO_PCV]: 'Processo Finalizado - Cliente assinou PCV'
};

/**
 * Cores e severities por código de status (alinhado com documentação da API)
 */
export const CODIGO_STATUS_COLORS: Record<number, { bg: string; border: string; text: string; severity: string }> = {
  // Verde - Disponível/Quitado/Finalizado (#4CAF50)
  [CodigoStatusUnidade.DISPONIVEL_VENDA]: { 
    bg: '#d1fae5', 
    border: '#4CAF50', 
    text: '#065f46',
    severity: 'success'
  },
  [CodigoStatusUnidade.QUITADO]: { 
    bg: '#d1fae5', 
    border: '#4CAF50', 
    text: '#065f46',
    severity: 'success'
  },
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_FINALIZADO]: { 
    bg: '#d1fae5', 
    border: '#4CAF50', 
    text: '#065f46',
    severity: 'success'
  },
  [CodigoStatusUnidade.PROCESSO_FINALIZADO_PCV]: { 
    bg: '#d1fae5', 
    border: '#4CAF50', 
    text: '#065f46',
    severity: 'success'
  },
  // Azul - Reservado/Em Processo (#2196F3)
  [CodigoStatusUnidade.RESERVADO_VENDA]: { 
    bg: '#dbeafe', 
    border: '#2196F3', 
    text: '#1e40af',
    severity: 'info'
  },
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ASSINADO]: { 
    bg: '#dbeafe', 
    border: '#2196F3', 
    text: '#1e40af',
    severity: 'info'
  },
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ANDAMENTO]: { 
    bg: '#dbeafe', 
    border: '#2196F3', 
    text: '#1e40af',
    severity: 'info'
  },
  [CodigoStatusUnidade.SINAL_PAGO_DOC_IMOBILIARIA]: { 
    bg: '#dbeafe', 
    border: '#2196F3', 
    text: '#1e40af',
    severity: 'info'
  },
  // Laranja - Aguardando/Pendências (#FF9800)
  [CodigoStatusUnidade.BLOQUEADO]: { 
    bg: '#ffedd5', 
    border: '#FF9800', 
    text: '#7c2d12',
    severity: 'warning'
  },
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ANDAMENTO]: { 
    bg: '#ffedd5', 
    border: '#FF9800', 
    text: '#7c2d12',
    severity: 'warning'
  },
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ASSINADO]: { 
    bg: '#ffedd5', 
    border: '#FF9800', 
    text: '#7c2d12',
    severity: 'warning'
  },
  [CodigoStatusUnidade.SINAL_PAGO_PENDENCIA_DOCUMENTO]: { 
    bg: '#ffedd5', 
    border: '#FF9800', 
    text: '#7c2d12',
    severity: 'warning'
  },
  // Vermelho - Bloqueado/Indisponível (#F44336)
  [CodigoStatusUnidade.NAO_DISPONIVEL]: { 
    bg: '#fee2e2', 
    border: '#F44336', 
    text: '#7f1d1d',
    severity: 'danger'
  },
  [CodigoStatusUnidade.BLOQUEADO_JURIDICAMENTE]: { 
    bg: '#fee2e2', 
    border: '#F44336', 
    text: '#7f1d1d',
    severity: 'danger'
  },
  // Amarelo - Em Assinatura (#FFC107)
  [CodigoStatusUnidade.CONTRATO_EM_ASSINATURA]: { 
    bg: '#fef3c7', 
    border: '#FFC107', 
    text: '#92400e',
    severity: 'warning'
  },
  // Cinza - Fora de venda/Outros (#9E9E9E)
  [CodigoStatusUnidade.FORA_DE_VENDA]: { 
    bg: '#f3f4f6', 
    border: '#9E9E9E', 
    text: '#374151',
    severity: 'secondary'
  },
  [CodigoStatusUnidade.OUTROS]: { 
    bg: '#f3f4f6', 
    border: '#9E9E9E', 
    text: '#374151',
    severity: 'secondary'
  }
};

/**
 * Ícones PrimeNG por código de status (baseado na documentação)
 */
export const CODIGO_STATUS_ICONS: Record<number, string> = {
  [CodigoStatusUnidade.DISPONIVEL_VENDA]: 'pi pi-check-circle',           // Disponível
  [CodigoStatusUnidade.RESERVADO_VENDA]: 'pi pi-clock',                   // Reservado
  [CodigoStatusUnidade.BLOQUEADO]: 'pi pi-lock',                          // Bloqueado
  [CodigoStatusUnidade.NAO_DISPONIVEL]: 'pi pi-ban',                      // Indisponível
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ASSINADO]: 'pi pi-file-check', // Contrato Assinado
  [CodigoStatusUnidade.CONTRATO_EM_ASSINATURA]: 'pi pi-pencil',           // Em Assinatura
  [CodigoStatusUnidade.BLOQUEADO_JURIDICAMENTE]: 'pi pi-exclamation-triangle', // Bloqueio Jurídico
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_ANDAMENTO]: 'pi pi-spin pi-spinner', // Em Andamento
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ANDAMENTO]: 'pi pi-clock', // Aguardando Sinal
  [CodigoStatusUnidade.SINAL_A_CREDITAR_CONTRATO_ASSINADO]: 'pi pi-clock',  // Aguardando Sinal
  [CodigoStatusUnidade.SINAL_PAGO_DOC_IMOBILIARIA]: 'pi pi-folder',        // Docs na Imobiliária
  [CodigoStatusUnidade.SINAL_PAGO_PENDENCIA_DOCUMENTO]: 'pi pi-exclamation-circle', // Pendência Docs
  [CodigoStatusUnidade.FORA_DE_VENDA]: 'pi pi-eye-slash',                 // Fora de Venda
  [CodigoStatusUnidade.QUITADO]: 'pi pi-verified',                        // Quitado
  [CodigoStatusUnidade.SINAL_CREDITADO_CONTRATO_FINALIZADO]: 'pi pi-check', // Finalizado
  [CodigoStatusUnidade.PROCESSO_FINALIZADO_PCV]: 'pi pi-check-circle',     // Processo Finalizado PCV
  [CodigoStatusUnidade.OUTROS]: 'pi pi-info-circle'                       // Outros
};

/**
 * Enum simplificado de status (mantido para compatibilidade)
 * @deprecated Use CodigoStatusUnidade para novo código
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
 * Labels dos status simplificados
 * @deprecated Use CODIGO_STATUS_LABELS
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
 * Cores por status simplificado
 * @deprecated Use CODIGO_STATUS_COLORS
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
 * Funções helper para trabalhar com códigos de status
 */

/**
 * Retorna o label do status a partir do código numérico
 * @param codigoStatus - Código numérico do status (100, 200, etc.)
 * @returns Label descritivo ou o próprio código se não encontrado
 */
export function getStatusLabel(codigoStatus: number | string): string {
  const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
  return CODIGO_STATUS_LABELS[codigo] || `Status ${codigo}`;
}

/**
 * Retorna as cores do status a partir do código
 * @param codigoStatus - Código numérico do status
 * @returns Objeto com cores bg, border, text e severity
 */
export function getStatusColors(codigoStatus: number | string): { bg: string; border: string; text: string; severity: string } {
  const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
  return CODIGO_STATUS_COLORS[codigo] || {
    bg: '#f3f4f6',
    border: '#9ca3af',
    text: '#374151',
    severity: 'secondary'
  };
}

/**
 * Retorna severity do PrimeNG para usar em p-tag
 * @param codigoStatus - Código numérico do status
 */
export function getStatusSeverity(codigoStatus: number | string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
  const colors = getStatusColors(codigoStatus);
  return colors.severity as 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
}

/**
 * Retorna o ícone PrimeNG do status
 * @param codigoStatus - Código numérico do status
 */
export function getStatusIcon(codigoStatus: number | string): string {
  const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
  return CODIGO_STATUS_ICONS[codigo] || 'pi pi-info-circle';
}

/**
 * Valida se a unidade pode ser reservada (apenas status 100)
 * @param codigoStatus - Código numérico do status
 * @returns True se pode reservar, false caso contrário
 */
export function podeReservarUnidade(codigoStatus: number | string): boolean {
  const codigo = typeof codigoStatus === 'string' ? parseInt(codigoStatus, 10) : codigoStatus;
  return codigo === CodigoStatusUnidade.DISPONIVEL_VENDA;
}

/**
 * Retorna todos os status como array de opções para dropdowns
 */
export function getStatusOptions(): { label: string; value: number }[] {
  return Object.values(CodigoStatusUnidade)
    .filter(v => typeof v === 'number')
    .map(codigo => ({
      label: CODIGO_STATUS_LABELS[codigo as number],
      value: codigo as number
    }));
}

/**
 * Agrupa unidades por categoria de status
 */
export function agruparUnidadesPorStatus(unidades: Unidade[]): {
  disponiveis: Unidade[];
  reservadas: Unidade[];
  bloqueadas: Unidade[];
  vendidas: Unidade[];
  outros: Unidade[];
} {
  return {
    disponiveis: unidades.filter(u => u.codigoStatusUnidade === 100),
    reservadas: unidades.filter(u => [200, 301, 441, 801, 802, 803, 804, 805].includes(u.codigoStatusUnidade)),
    bloqueadas: unidades.filter(u => [250, 251, 600, 820].includes(u.codigoStatusUnidade)),
    vendidas: unidades.filter(u => [102, 900].includes(u.codigoStatusUnidade)),
    outros: unidades.filter(u => u.codigoStatusUnidade === 103)
  };
}

/**
 * Interface da Unidade (UnidadeEmpreendimentoDTO do backend)
 * Atualizado: 23/02/2026 - Integração completa com TOTVS RM
 */
export interface Unidade {
  empreendimento: string;      // Nome do empreendimento
  bloco: string;                // Número do bloco
  unidade: string;              // Código da unidade
  fracaoIdeal: number;          // Fração ideal (decimal)
  sigla: string;                // Sigla da unidade (ex: LJ, AP)
  codigoStatusUnidade: number;  // Código numérico do status (100, 200, 301, etc.)
  statusUnidade: string;        // Descrição textual do status
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
