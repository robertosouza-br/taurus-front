export type PessoaFisOuJur = 'F' | 'J';

export interface ClienteTotvsCadastroBasicoRequest {
  cpfCnpj: string;
  nome: string;
  clienteEstrangeiro: 'true' | 'false';
}

export interface ClienteTotvsDadosResponse {
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
}

export interface ClienteTotvsConsultaResponse {
  sucesso: boolean;
  encontrado: boolean;
  mensagem?: string;
  codigoCliente?: string | null;
  dados?: ClienteTotvsDadosResponse | null;
  erro?: string | null;
}

export interface ClienteTotvsCadastroBasicoResponse {
  sucesso: boolean;
  mensagem: string;
  codigoCliente?: string | null;
  erro?: string | null;
}