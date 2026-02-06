/**
 * Interface para representar um empreendimento (baseado na API real TOTVS)
 */
export interface Empreendimento {
  codColigada: number;
  codEmpreendimento: number;
  nome: string;
  disponivel?: string; // 'S' ou 'N' (nova estrutura backend)
  disponivelPdc?: string; // 'S' ou 'N' (estrutura atual backend - manter compatibilidade)
  imagemCapa?: string; // URL da imagem principal (nova estrutura backend - quando implementado)
  imagens?: EmpreendimentoImagem[]; // Array completo (estrutura atual)
}

/**
 * Interface para representar uma imagem de empreendimento
 */
export interface EmpreendimentoImagem {
  id: number | null;
  codigoEmpreendimento?: string | null;
  nomeArquivo?: string;
  urlImagem?: string; // Nova estrutura backend (quando implementado)
  urlTemporaria?: string; // Estrutura atual backend (manter compatibilidade)
  ordem: number;
  principal: boolean;
  tipo: TipoImagemEmpreendimento;
  ativo?: boolean;
  dataUpload?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
}

/**
 * Enum de tipos de imagem de empreendimento
 */
export enum TipoImagemEmpreendimento {
  FACHADA = 'FACHADA',
  PLANTA = 'PLANTA',
  AREA_LAZER = 'AREA_LAZER',
  INTERIOR = 'INTERIOR',
  LOCALIZACAO = 'LOCALIZACAO',
  OUTROS = 'OUTROS'
}

/**
 * Interface para detalhes de um tipo de imagem
 */
export interface TipoImagemDetalhes {
  nome: TipoImagemEmpreendimento;
  descricao: string;
  detalhamento: string;
}

/**
 * DTO para upload de nova imagem
 */
export interface EmpreendimentoImagemUploadDTO {
  arquivo: File;
  ordem?: number;
  principal?: boolean;
  tipo?: TipoImagemEmpreendimento;
}

/**
 * DTO para atualização de dados da imagem
 */
export interface EmpreendimentoImagemUpdateDTO {
  ordem?: number;
  principal?: boolean;
  tipo?: TipoImagemEmpreendimento;
}

/**
 * Labels dos tipos de imagem
 */
export const TIPO_IMAGEM_LABELS: Record<string, string> = {
  [TipoImagemEmpreendimento.FACHADA]: 'Fachada',
  [TipoImagemEmpreendimento.PLANTA]: 'Planta',
  [TipoImagemEmpreendimento.AREA_LAZER]: 'Área de Lazer',
  [TipoImagemEmpreendimento.INTERIOR]: 'Interior',
  [TipoImagemEmpreendimento.LOCALIZACAO]: 'Localização',
  [TipoImagemEmpreendimento.OUTROS]: 'Outros'
};

/**
 * Ícones dos tipos de imagem
 */
export const TIPO_IMAGEM_ICONS: Record<string, string> = {
  [TipoImagemEmpreendimento.FACHADA]: 'pi pi-building',
  [TipoImagemEmpreendimento.PLANTA]: 'pi pi-map',
  [TipoImagemEmpreendimento.AREA_LAZER]: 'pi pi-sun',
  [TipoImagemEmpreendimento.INTERIOR]: 'pi pi-home',
  [TipoImagemEmpreendimento.LOCALIZACAO]: 'pi pi-map-marker',
  [TipoImagemEmpreendimento.OUTROS]: 'pi pi-image'
};

/**
 * Response paginado do Spring Boot
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
