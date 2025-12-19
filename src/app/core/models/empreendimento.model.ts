export interface EmpreendimentoDTO {
  id: string;
  nome: string;
  descricao: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: string;
  totalUnidades: number;
  unidadesDisponiveis: number;
  valorMinimo: number;
  valorMaximo: number;
  construtora: string;
  dataPrevistaEntrega: string;
  ativo: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const STATUS_EMPREENDIMENTO_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  'Lançamento': { bg: '#e3f2fd', color: '#1976d2', icon: 'pi pi-star' },
  'Em Construção': { bg: '#fff3e0', color: '#f57c00', icon: 'pi pi-wrench' },
  'Pronto para Morar': { bg: '#e8f5e9', color: '#388e3c', icon: 'pi pi-check-circle' },
  'Entregue': { bg: '#f3e5f5', color: '#7b1fa2', icon: 'pi pi-home' },
  'Esgotado': { bg: '#ffebee', color: '#c62828', icon: 'pi pi-times-circle' }
};
