/**
 * DTO de saída contendo o item detalhado de sincronização por empreendimento
 */
export interface SincronizacaoEmpreendimentoItemSaidaDTO {
  /**
   * Código do empreendimento processado
   */
  codEmpreendimento: number;

  /**
   * Nome do empreendimento processado
   */
  nomeEmpreendimento: string;

  /**
   * Resultado do processamento (SUCESSO ou ERRO)
   */
  status: 'SUCESSO' | 'ERRO';

  /**
   * Mensagem resumida de retorno
   */
  mensagem: string;

  /**
   * Quantidade de blocos sincronizados naquele empreendimento
   */
  blocosSincronizados: number;

  /**
   * Quantidade de unidades sincronizadas naquele empreendimento
   */
  unidadesSincronizadas: number;
}

/**
 * DTO de saída contendo o resumo consolidado da sincronização de empreendimentos e unidades
 */
export interface SincronizacaoEmpreendimentosSaidaDTO {
  /**
   * Data e hora em que a carga foi executada
   */
  dataHoraSincronizacao: string;

  /**
   * Quantidade total retornada pela fonte externa
   */
  totalEmpreendimentosRecebidos: number;

  /**
   * Quantidade processada com sucesso
   */
  totalEmpreendimentosSincronizados: number;

  /**
   * Quantidade com erro
   */
  totalEmpreendimentosComErro: number;

  /**
   * Total consolidado de blocos sincronizados
   */
  totalBlocosSincronizados: number;

  /**
   * Total consolidado de unidades sincronizadas
   */
  totalUnidadesSincronizadas: number;

  /**
   * Detalhamento por empreendimento
   */
  itens: SincronizacaoEmpreendimentoItemSaidaDTO[];
}

/**
 * DTO de saída contendo o resumo da última sincronização registrada na base interna
 */
export interface UltimaSincronizacaoEmpreendimentosSaidaDTO {
  /**
   * Indica se já existe alguma sincronização registrada
   */
  sincronizacaoRealizada: boolean;

  /**
   * Data/hora consolidada mais recente entre empreendimento, bloco e unidade
   */
  dataHoraUltimaSincronizacao: string | null;

  /**
   * Última data/hora registrada em empreendimentos
   */
  dataHoraUltimaSincronizacaoEmpreendimentos: string | null;

  /**
   * Última data/hora registrada em blocos
   */
  dataHoraUltimaSincronizacaoBlocos: string | null;

  /**
   * Última data/hora registrada em unidades
   */
  dataHoraUltimaSincronizacaoUnidades: string | null;

  /**
   * Origem da última atualização das unidades
   */
  origemUltimaAtualizacaoUnidades: string | null;

  /**
   * Quantidade atual de empreendimentos ativos internamente
   */
  quantidadeEmpreendimentosAtivos: number;

  /**
   * Quantidade atual de blocos ativos internamente
   */
  quantidadeBlocosAtivos: number;

  /**
   * Quantidade atual de unidades ativas internamente
   */
  quantidadeUnidadesAtivas: number;
}
