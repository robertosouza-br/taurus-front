/**
 * Enum de status da mensagem de contato
 */
export enum StatusContato {
  PENDENTE = 'PENDENTE',
  LIDO = 'LIDO',
  RESPONDIDO = 'RESPONDIDO'
}

/**
 * Labels para exibição dos status
 */
export const STATUS_CONTATO_LABELS: Record<StatusContato, string> = {
  [StatusContato.PENDENTE]: 'Pendente',
  [StatusContato.LIDO]: 'Lido',
  [StatusContato.RESPONDIDO]: 'Respondido'
};

/**
 * Severidades para badges dos status
 */
export const STATUS_CONTATO_SEVERITIES: Record<StatusContato, string> = {
  [StatusContato.PENDENTE]: 'warning',
  [StatusContato.LIDO]: 'info',
  [StatusContato.RESPONDIDO]: 'success'
};

/**
 * DTO para mensagem de contato
 */
export interface ContatoDTO {
  id?: number;
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
  status?: StatusContato;
  dataCriacao?: string;
  dataLeitura?: string;
  usuarioLeitura?: string;
  dataResposta?: string;
  usuarioResposta?: string;
  resposta?: string;
}

/**
 * DTO para resposta de contato
 */
export interface ContatoRespostaDTO {
  resposta: string;
}
