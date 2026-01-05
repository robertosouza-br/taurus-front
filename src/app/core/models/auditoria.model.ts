/**
 * Tipo de operação de auditoria
 */
export enum TipoOperacao {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MOD = 'MOD', // Alias para UPDATE usado pelo backend
  DEL = 'DEL'  // Alias para DELETE usado pelo backend
}

/**
 * Labels dos tipos de operação
 */
export const TIPO_OPERACAO_LABELS: Record<string, string> = {
  'ADD': 'Inserção',
  'UPDATE': 'Alteração',
  'DELETE': 'Exclusão',
  'MOD': 'Alteração',
  'DEL': 'Exclusão'
};

/**
 * Severidades para exibição dos tipos de operação
 */
export const TIPO_OPERACAO_SEVERITY: Record<string, 'success' | 'info' | 'danger' | 'warning'> = {
  'ADD': 'success',
  'UPDATE': 'warning',
  'DELETE': 'danger',
  'MOD': 'warning',
  'DEL': 'danger'
};

/**
 * DTO de alteração de campo
 */
export interface AlteracaoCampoDTO {
  campo: string;
  valorAnterior: any;
  valorNovo: any;
}

/**
 * DTO de saída de auditoria (conforme documentação da API)
 */
export interface AuditoriaDTO {
  revisaoId: number; // ID único da revisão
  dataHora: string; // Timestamp da alteração (ISO 8601)
  usuario: string; // Email/login do usuário
  usuarioNome: string; // Nome completo do usuário
  usuarioCpf: string; // CPF do usuário (apenas dígitos)
  ipCliente: string; // Endereço IP do cliente
  tipoOperacao: string; // ADD, UPDATE ou DELETE
  entidade: string; // Nome da entidade (Usuario, Perfil, Banco)
  entidadeId: string; // ID da entidade auditada
  dadosAntes: any | null; // Dados antes da alteração (null para ADD)
  dadosDepois: any | null; // Dados depois da alteração (null para DELETE)
  camposModificados: { [campo: string]: AlteracaoCampoDTO } | null; // Campos modificados (apenas UPDATE)
}

/**
 * Filtros para listagem de auditoria
 */
export interface FiltroAuditoriaDTO {
  page?: number;
  size?: number;
  sort?: string;
  tipoEntidade?: string; // Tipo da entidade (USUARIO, PERFIL, BANCO)
  usuario?: string; // Email do usuário
  dataInicio?: string; // Data/hora inicial (ISO 8601): yyyy-MM-ddTHH:mm:ss
  dataFim?: string; // Data/hora final (ISO 8601): yyyy-MM-ddTHH:mm:ss
}

/**
 * Entidades auditadas no sistema
 */
export interface EntidadeAuditada {
  value: string;
  label: string;
}

export const ENTIDADES_AUDITADAS: EntidadeAuditada[] = [
  { value: 'USUARIO', label: 'Usuário' },
  { value: 'PERFIL', label: 'Perfil' },
  { value: 'BANCO', label: 'Banco' }
];
