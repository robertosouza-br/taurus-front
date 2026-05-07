export interface LinkPublicoUnidadeBlocoSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  parte: number;
  totalPartes: number;
  quantidadeUnidades: number;
  primeiraUnidade: string;
  ultimaUnidade: string;
  urlPublica: string;
}

export interface LinksPublicosUnidadeBlocoAgrupadoSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  totalPartes: number;
  quantidadeTotalUnidades: number;
  links: LinkPublicoUnidadeBlocoSaidaDTO[];
}

export interface UnidadeStatusPublicoSaidaDTO {
  unidade: string;
  codigoStatusUnidade: number;
  statusUnidade: string;
}

export interface AcompanhamentoUnidadesPublicoSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  parte: number;
  totalPartes: number;
  quantidadeUnidades: number;
  unidades: UnidadeStatusPublicoSaidaDTO[];
}