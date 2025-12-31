export enum Funcionalidade {
  VENDA = 'VENDA',
  RESERVA = 'RESERVA',
  IMOVEL = 'IMOVEL',
  CLIENTE = 'CLIENTE',
  FINANCEIRO = 'FINANCEIRO',
  RELATORIO = 'RELATORIO',
  USUARIO = 'USUARIO',
  PERFIL = 'PERFIL',
  CORRETOR = 'CORRETOR',
  AUDITORIA = 'AUDITORIA',
  ADMINISTRACAO = 'ADMINISTRACAO'
}

export const FuncionalidadeLabel: Record<Funcionalidade, string> = {
  [Funcionalidade.VENDA]: 'Vendas',
  [Funcionalidade.RESERVA]: 'Reservas',
  [Funcionalidade.IMOVEL]: 'Imóveis',
  [Funcionalidade.CLIENTE]: 'Clientes',
  [Funcionalidade.FINANCEIRO]: 'Financeiro',
  [Funcionalidade.RELATORIO]: 'Relatórios',
  [Funcionalidade.USUARIO]: 'Usuários',
  [Funcionalidade.CORRETOR]: 'Corretores',
  [Funcionalidade.PERFIL]: 'Perfis',
  [Funcionalidade.AUDITORIA]: 'Auditoria',
  [Funcionalidade.ADMINISTRACAO]: 'Administração'
};
