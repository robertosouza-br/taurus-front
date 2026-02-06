/**
 * Interface para representar um empreendimento (baseado na API real TOTVS)
 */
export interface Empreendimento {
  codColigada: number;
  codEmpreendimento: number;
  nome: string;
  disponivelPdc: string;
  imagens?: EmpreendimentoImagem[];
}

/**
 * Interface para representar uma imagem de empreendimento
 */
export interface EmpreendimentoImagem {
  id: number;
  codigoEmpreendimento: string;
  nomeArquivo: string;
  urlTemporaria: string | null;
  ordem: number;
  principal: boolean;
  tipo: string | null;
  descricao: string | null;
  ativo: boolean;
}

/**
 * DTO para upload de nova imagem
 */
export interface EmpreendimentoImagemUploadDTO {
  arquivo: File;
  codigoEmpreendimento: string;
  ordem?: number;
  principal?: boolean;
  tipo?: string;
  descricao?: string;
}

/**
 * DTO para atualização de dados da imagem
 */
export interface EmpreendimentoImagemUpdateDTO {
  ordem?: number;
  principal?: boolean;
  tipo?: string;
  descricao?: string;
}

/**
 * Tipos de imagem sugeridos
 */
export enum TipoImagemEmpreendimento {
  FACHADA = 'fachada',
  PLANTA = 'planta',
  AREA_LAZER = 'area_lazer',
  INTERIOR = 'interior',
  LOCALIZACAO = 'localizacao',
  OUTRO = 'outro'
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
  [TipoImagemEmpreendimento.OUTRO]: 'Outro'
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
  [TipoImagemEmpreendimento.OUTRO]: 'pi pi-image'
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
