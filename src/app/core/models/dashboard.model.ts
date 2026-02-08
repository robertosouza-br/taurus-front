/**
 * Enums e tipos para Dashboard
 */
export enum TipoNotificacao {
  CONTATO_PENDENTE = 'CONTATO_PENDENTE',
  CORRETOR_AGUARDANDO_APROVACAO = 'CORRETOR_AGUARDANDO_APROVACAO',
  EMPREENDIMENTO_NOVO = 'EMPREENDIMENTO_NOVO',
  USUARIO_NOVO = 'USUARIO_NOVO',
  DOCUMENTO_PENDENTE = 'DOCUMENTO_PENDENTE'
}

export enum PrioridadeNotificacao {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAIXA = 'BAIXA'
}

/**
 * DTO de Notificação
 */
export interface NotificacaoDTO {
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  contador: number;
  link: string;
  icone: string;
  prioridade: PrioridadeNotificacao;
  data: string;
}

/**
 * DTO de Estatísticas do Dashboard
 */
export interface EstatisticasDTO {
  contatosPendentes: number;
  contatosNaoLidos: number;
  usuariosAtivos: number;
  corretoresCadastrados: number;
  empreendimentosDisponiveis: number;
  acessosHoje: number;
}

/**
 * DTO do Dashboard completo
 */
export interface DashboardDTO {
  perfilUsuario: string;
  notificacoes: NotificacaoDTO[];
  estatisticas: EstatisticasDTO;
}

/**
 * Mapeamento de severidade PrimeNG por prioridade
 */
export const PRIORIDADE_SEVERITY_MAP: Record<PrioridadeNotificacao, 'success' | 'info' | 'warning' | 'danger'> = {
  [PrioridadeNotificacao.ALTA]: 'danger',
  [PrioridadeNotificacao.MEDIA]: 'warning',
  [PrioridadeNotificacao.BAIXA]: 'info'
};
