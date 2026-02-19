/**
 * Status possíveis de uma reserva
 */
export enum StatusReserva {
  NAO_VENDIDA = 'NAO_VENDIDA',
  EM_NEGOCIACAO = 'EM_NEGOCIACAO',
  RESERVADA = 'RESERVADA',
  ASSINADO_SINAL_A_CREDITAR = 'ASSINADO_SINAL_A_CREDITAR_DOCS_IMOBILIARIA',
  SINAL_CREDITADO_DOC_IMOBILIARIA = 'SINAL_CREDITADO_DOCS_IMOBILIARIA',
  SINAL_A_CREDITAR_DOC_CALPER = 'SINAL_A_CREDITAR_DOCS_CALPER',
  SINAL_CREDITADO_PENDENCIA_DOC = 'SINAL_CREDITADO_PENDENCIA_DOCS',
  SINAL_CREDITADO_SEM_PENDENCIA = 'SINAL_CREDITADO_SEM_PENDENCIA',
  PROCESSO_FINALIZADO = 'PROCESSO_FINALIZADO',
  DISTRATO = 'SINAL_CREDITADO_DISTRATO',
  FORA_DE_VENDA = 'FORA_DE_VENDA'
}

/**
 * Tipo de profissional envolvido na reserva
 */
export enum TipoProfissional {
  CORRETOR = 'CORRETOR',
  GERENTE = 'GERENTE',
  DIRETOR = 'DIRETOR',
  PARCEIRO = 'PARCEIRO'
}

/**
 * Tipo de contato da imobiliária
 */
export enum TipoContato {
  EMAIL = 'EMAIL',
  TELEFONE = 'TELEFONE',
  WHATSAPP = 'WHATSAPP'
}

/**
 * Formas de pagamento disponíveis
 */
export enum FormaPagamento {
  FINANCIAMENTO = 'FINANCIAMENTO',
  PIX = 'PIX',
  SWIFT = 'SWIFT',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  DOC = 'DOC',
  TED = 'TED',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

/**
 * Tipo de relacionamento da imobiliária secundária
 */
export enum TipoRelacionamentoSecundaria {
  PARCEIRO = 'PARCEIRO',
  AUTONOMO = 'AUTONOMO'
}

/**
 * Labels dos status de reserva
 */
export const STATUS_RESERVA_LABELS: Record<StatusReserva, string> = {
  [StatusReserva.NAO_VENDIDA]: 'Não Vendida',
  [StatusReserva.EM_NEGOCIACAO]: 'Em Negociação',
  [StatusReserva.RESERVADA]: 'Reservada / Assinatura dos instrumentos aquisitivos',
  [StatusReserva.ASSINADO_SINAL_A_CREDITAR]: 'Assinado, com Sinal a creditar e documentos na imobiliária',
  [StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA]: 'Sinal Creditado, mas com todos os documentos na imobiliária',
  [StatusReserva.SINAL_A_CREDITAR_DOC_CALPER]: 'Sinal a Creditar, mas com todos os documentos entregue na Calper',
  [StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC]: 'Sinal Creditado, mas com pendência de documentos',
  [StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA]: 'Sinal Creditado e sem pendência de documentos',
  [StatusReserva.PROCESSO_FINALIZADO]: 'Processo Finalizado - Cliente assinou escritura pública de PCV e CCA',
  [StatusReserva.DISTRATO]: 'Sinal creditado, mas cliente pediu distrato',
  [StatusReserva.FORA_DE_VENDA]: 'Fora de venda'
};

/**
 * Labels dos tipos de profissional
 */
export const TIPO_PROFISSIONAL_LABELS: Record<TipoProfissional, string> = {
  [TipoProfissional.CORRETOR]: 'Corretor',
  [TipoProfissional.GERENTE]: 'Gerente',
  [TipoProfissional.DIRETOR]: 'Diretor',
  [TipoProfissional.PARCEIRO]: 'Parceiro'
};

/**
 * Labels dos tipos de contato
 */
export const TIPO_CONTATO_LABELS: Record<TipoContato, string> = {
  [TipoContato.EMAIL]: 'E-mail',
  [TipoContato.TELEFONE]: 'Telefone',
  [TipoContato.WHATSAPP]: 'WhatsApp'
};

/**
 * Labels das formas de pagamento
 */
export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  [FormaPagamento.FINANCIAMENTO]: 'Financiamento',
  [FormaPagamento.PIX]: 'Pix',
  [FormaPagamento.SWIFT]: 'Swift',
  [FormaPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
  [FormaPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
  [FormaPagamento.DOC]: 'DOC',
  [FormaPagamento.TED]: 'TED',
  [FormaPagamento.TRANSFERENCIA]: 'Transferência'
};

/**
 * Labels do tipo de relacionamento da imobiliária secundária
 */
export const TIPO_RELACIONAMENTO_SECUNDARIA_LABELS: Record<TipoRelacionamentoSecundaria, string> = {
  [TipoRelacionamentoSecundaria.PARCEIRO]: 'Parceiro',
  [TipoRelacionamentoSecundaria.AUTONOMO]: 'Autônomo'
};

/**
 * DTO de profissional na resposta da API
 */
export interface ProfissionalReservaDTO {
  id?: number;
  tipoProfissional: TipoProfissional;
  corretorId: number;
  cpfCorretor?: string;
  nomeCorretor: string;
  imobiliariaId?: number;
  nomeImobiliaria?: string;
}

/**
 * DTO de resposta da API (GET)
 */
export interface ReservaDTO {
  id: number;
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento: string;
  bloco: string;
  unidade: string;
  tipoUnidade: string;
  tipologia: string;
  status: StatusReserva;
  cpfCnpjCliente: string | null;
  passaporteCliente: string | null;
  nomeCliente: string;
  clienteEstrangeiro: boolean;
  formaPagamento: FormaPagamento | null;
  dataReserva: string;
  dataVenda: string | null;
  observacoes: string;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal: string;
  tipoContatoPrincipal: TipoContato;
  contatoPrincipal: string;
  profissionaisPrincipal: ProfissionalReservaDTO[];
  imobiliariaSecundariaId: number | null;
  nomeImobiliariaSecundaria: string | null;
  tipoRelacionamentoSecundaria: TipoRelacionamentoSecundaria | null;
  tipoContatoSecundario: TipoContato | null;
  contatoSecundario: string | null;
  profissionaisSecundaria: ProfissionalReservaDTO[];
  dataCriacao: string;
  dataAlteracao: string | null;
  usuarioCriacao: string;
  usuarioAlteracao: string | null;
}

/**
 * DTO de criação/atualização da reserva (POST/PUT)
 */
export interface ReservaCreateDTO {
  codEmpreendimento: number;
  codColigadaEmpreendimento: number;
  nomeEmpreendimento?: string;
  bloco: string;
  unidade: string;
  tipoUnidade?: string;
  tipologia?: string;
  status?: StatusReserva;
  cpfCnpjCliente?: string | null;
  passaporteCliente?: string | null;
  imobiliariaPrincipalId: number;
  nomeImobiliariaPrincipal?: string;
  tipoContatoPrincipal?: TipoContato;
  contatoPrincipal?: string;
  profissionaisPrincipal?: Omit<ProfissionalReservaDTO, 'id'>[];
  imobiliariaSecundariaId?: number | null;
  nomeImobiliariaSecundaria?: string | null;
  tipoRelacionamentoSecundaria?: TipoRelacionamentoSecundaria | null;
  tipoContatoSecundario?: TipoContato | null;
  contatoSecundario?: string | null;
  profissionaisSecundaria?: Omit<ProfissionalReservaDTO, 'id'>[];
  nomeCliente: string;
  clienteEstrangeiro?: boolean;
  formaPagamento?: FormaPagamento;
  dataReserva: string;
  dataVenda?: string | null;
  observacoes?: string;
}

/**
 * Severidade visual por status (para p-tag)
 */
export const STATUS_RESERVA_SEVERITY: Record<StatusReserva, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
  [StatusReserva.NAO_VENDIDA]: 'secondary',
  [StatusReserva.EM_NEGOCIACAO]: 'warning',
  [StatusReserva.RESERVADA]: 'warning',
  [StatusReserva.ASSINADO_SINAL_A_CREDITAR]: 'info',
  [StatusReserva.SINAL_CREDITADO_DOC_IMOBILIARIA]: 'info',
  [StatusReserva.SINAL_A_CREDITAR_DOC_CALPER]: 'info',
  [StatusReserva.SINAL_CREDITADO_PENDENCIA_DOC]: 'warning',
  [StatusReserva.SINAL_CREDITADO_SEM_PENDENCIA]: 'success',
  [StatusReserva.PROCESSO_FINALIZADO]: 'success',
  [StatusReserva.DISTRATO]: 'danger',
  [StatusReserva.FORA_DE_VENDA]: 'danger'
};
