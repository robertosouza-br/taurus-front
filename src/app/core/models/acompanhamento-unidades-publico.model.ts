export interface AndarUnidadeBlocoPorTvSaidaDTO {
  andar: number;
  quantidadeUnidades: number;
  primeiraUnidade: string;
  ultimaUnidade: string;
}

export interface LinkPublicoUnidadeTvSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  tv: number;
  totalTvs: number;
  primeiroAndar: number;
  ultimoAndar: number;
  quantidadeAndares: number;
  primeiraPosicaoUnidade: number;
  ultimaPosicaoUnidade: number;
  quantidadeUnidadesPorAndar: number;
  quantidadeUnidades: number;
  primeiraUnidade: string;
  ultimaUnidade: string;
  urlPublica: string;
}

export interface LinksPublicosUnidadeBlocoPorTvSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  quantidadeTvs: number;
  totalAndares: number;
  unidadesPorAndar: number;
  quantidadeTotalUnidades: number;
  andares: AndarUnidadeBlocoPorTvSaidaDTO[];
  links: LinkPublicoUnidadeTvSaidaDTO[];
}

export interface UnidadeStatusPublicoSaidaDTO {
  unidade: string;
  andar: number;
  codigoStatusUnidade: number;
  statusUnidade: string;
}

export interface AcompanhamentoUnidadesPublicoSaidaDTO {
  empreendimentoId: string;
  empreendimento: string;
  bloco: string;
  tv: number;
  totalTvs: number;
  primeiroAndar: number;
  ultimoAndar: number;
  quantidadeAndares: number;
  primeiraPosicaoUnidade: number;
  ultimaPosicaoUnidade: number;
  quantidadeUnidadesPorAndarNaTv: number;
  quantidadeUnidades: number;
  totalAndares: number;
  unidadesPorAndar: number;
  unidades: UnidadeStatusPublicoSaidaDTO[];
}