export interface ModalidadeTabelaPadraoSnapshotResumo {
  codEmpreendimento: number;
  nomeEmpreendimento: string;
  empreendimentoAtivo: boolean;
  dataUltimaSincronizacaoEmpreendimento: string | null;
  dataUltimaSincronizacaoModalidades: string | null;
  origemUltimaAtualizacaoModalidades: string | null;
  quantidadeModalidades: number;
  quantidadeModalidadesAtivas: number;
  quantidadeComponentes: number;
  quantidadeComponentesAtivos: number;
  quantidadeComponentesTabelaPadrao: number;
  quantidadeComponentesExtras: number;
}

export interface ModalidadeTabelaPadraoSnapshotComponente {
  id: number;
  codigoComponente: string;
  nomeComponente: string;
  tipoComponente: string | null;
  grupoComponente: number | null;
  quantidade: number | null;
  periodicidade: number | null;
  percentual: number | null;
  valorMinimo: number | null;
  valorMaximo: number | null;
  prazoMeses: number | null;
  ordem: number | null;
  tabelaPadrao: boolean;
  ativo: boolean;
  dataUltimaSincronizacao: string | null;
  origemUltimaAtualizacao: string | null;
  dataCriacao: string | null;
  dataAtualizacao: string | null;
}

export interface ModalidadeTabelaPadraoSnapshot {
  id: number;
  codEmpreendimento: number;
  nomeEmpreendimento: string;
  codigoModalidade: string;
  modalidade: string | null;
  descricao: string | null;
  tabelaPadrao: string | null;
  ativo: boolean;
  dataUltimaSincronizacao: string | null;
  origemUltimaAtualizacao: string | null;
  dataCriacao: string | null;
  dataAtualizacao: string | null;
  quantidadeComponentes: number;
  quantidadeComponentesTabelaPadrao: number;
  quantidadeComponentesExtras: number;
  componentes: ModalidadeTabelaPadraoSnapshotComponente[];
}