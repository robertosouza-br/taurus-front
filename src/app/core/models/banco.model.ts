/**
 * Modelo para representar um Banco
 */
export interface Banco {
  id: number;
  codigo: string; // Código do banco (3 dígitos) ex: "001", "033", "104"
  nome: string;   // Nome completo do banco ex: "Banco do Brasil"
}
