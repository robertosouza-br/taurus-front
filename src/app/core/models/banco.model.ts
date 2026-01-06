/**
 * Modelo para representar um Banco
 */
export interface Banco {
  id: number;
  codigo: string; // Código do banco (3 dígitos) ex: "001", "033", "104"
  nome: string;   // Nome completo do banco ex: "Banco do Brasil"
}

/**
 * DTO para criação e edição de banco
 */
export interface BancoFormDTO {
  codigo: string;
  nome: string;
}

/**
 * DTO para filtros de busca
 */
export interface BancoFiltroDTO {
  page?: number;
  size?: number;
  search?: string;
}

/**
 * Enum de tipos de relatório
 */
export enum TipoRelatorioBanco {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
  TXT = 'TXT'
}

/**
 * Mapeamento de ícones por tipo de relatório
 */
export const TIPO_RELATORIO_BANCO_ICONS: Record<TipoRelatorioBanco, string> = {
  [TipoRelatorioBanco.PDF]: 'pi pi-file-pdf',
  [TipoRelatorioBanco.XLSX]: 'pi pi-file-excel',
  [TipoRelatorioBanco.CSV]: 'pi pi-file',
  [TipoRelatorioBanco.TXT]: 'pi pi-file-edit'
};
