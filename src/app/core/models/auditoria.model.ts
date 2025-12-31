/**
 * Tipo de operação de auditoria
 */
export enum TipoOperacao {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Labels dos tipos de operação
 */
export const TIPO_OPERACAO_LABELS: Record<TipoOperacao, string> = {
  [TipoOperacao.INSERT]: 'Inserção',
  [TipoOperacao.UPDATE]: 'Atualização',
  [TipoOperacao.DELETE]: 'Exclusão'
};

/**
 * Severidades para exibição dos tipos de operação
 */
export const TIPO_OPERACAO_SEVERITY: Record<TipoOperacao, 'success' | 'info' | 'danger'> = {
  [TipoOperacao.INSERT]: 'success',
  [TipoOperacao.UPDATE]: 'info',
  [TipoOperacao.DELETE]: 'danger'
};

/**
 * DTO de saída de auditoria
 */
export interface AuditoriaDTO {
  id: number;
  nomeEntidade: string;
  idEntidade: number;
  tipoOperacao: TipoOperacao;
  usuarioId: number;
  usuarioNome: string;
  usuarioCpf: string;
  dataHora: string; // LocalDateTime vem como string do backend
  ipOrigem: string;
  dadosAntigos: any;
  dadosNovos: any;
  numeroRevisao: number;
}

/**
 * Filtros para listagem de auditoria
 */
export interface FiltroAuditoriaDTO {
  page?: number;
  size?: number;
  entidade?: string;
  usuario?: string;
  dataInicio?: string; // formato: yyyy-MM-dd
  dataFim?: string; // formato: yyyy-MM-dd
  tipoOperacao?: TipoOperacao;
}

/**
 * Entidades auditadas no sistema
 */
export const ENTIDADES_AUDITADAS = [
  'Usuario',
  'Perfil',
  'Banco',
  'PerfilPermissao',
  'Empreendimento',
  'Unidade'
];
