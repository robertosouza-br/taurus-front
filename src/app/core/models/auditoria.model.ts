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
  nomeUsuario?: string; // Nome ou email do usuário que fez a alteração
  cpfUsuario?: string; // CPF do usuário que fez a alteração (com ou sem formatação)
  dataInicio?: string; // Data/hora inicial (ISO 8601): yyyy-MM-ddTHH:mm:ss
  dataFim?: string; // Data/hora final (ISO 8601): yyyy-MM-ddTHH:mm:ss
}

/**
 * Tipos de relatório de auditoria
 */
export enum TipoRelatorio {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
  TXT = 'TXT'
}

/**
 * Labels dos tipos de relatório
 */
export const TIPO_RELATORIO_LABELS: Record<string, string> = {
  'PDF': 'PDF',
  'XLSX': 'Excel (XLSX)',
  'CSV': 'CSV',
  'TXT': 'Texto (TXT)'
};

/**
 * Opções de tipo de relatório para menu
 */
export interface TipoRelatorioMenuItem {
  label: string;
  icon: string;
  command: () => void;
}

/**
 * Ícones para cada tipo de relatório
 */
export const TIPO_RELATORIO_ICONS: Record<TipoRelatorio, string> = {
  [TipoRelatorio.PDF]: 'pi pi-file-pdf',
  [TipoRelatorio.XLSX]: 'pi pi-file-excel',
  [TipoRelatorio.CSV]: 'pi pi-file',
  [TipoRelatorio.TXT]: 'pi pi-file-edit'
};

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
