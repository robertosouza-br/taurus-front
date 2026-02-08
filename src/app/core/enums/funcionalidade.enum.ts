export enum Funcionalidade {
  VENDA = 'VENDA',
  RESERVA = 'RESERVA',
  IMOVEL = 'IMOVEL',
  EMPREENDIMENTO = 'EMPREENDIMENTO',
  EMPREENDIMENTO_IMAGEM = 'EMPREENDIMENTO_IMAGEM',
  CLIENTE = 'CLIENTE',
  FINANCEIRO = 'FINANCEIRO',
  RELATORIO = 'RELATORIO',
  USUARIO = 'USUARIO',
  PERFIL = 'PERFIL',
  CORRETOR = 'CORRETOR',
  BANCO = 'BANCO',
  AUDITORIA = 'AUDITORIA',
  CONTATO = 'CONTATO',
  ADMINISTRACAO = 'ADMINISTRACAO'
}

export const FuncionalidadeLabel: Record<Funcionalidade, string> = {
  [Funcionalidade.VENDA]: 'Vendas',
  [Funcionalidade.RESERVA]: 'Reservas',
  [Funcionalidade.IMOVEL]: 'Imóveis',
  [Funcionalidade.EMPREENDIMENTO]: 'Empreendimentos',
  [Funcionalidade.EMPREENDIMENTO_IMAGEM]: 'Imagens de Empreendimentos',
  [Funcionalidade.CLIENTE]: 'Clientes',
  [Funcionalidade.FINANCEIRO]: 'Financeiro',
  [Funcionalidade.RELATORIO]: 'Relatórios',
  [Funcionalidade.USUARIO]: 'Usuários',
  [Funcionalidade.CORRETOR]: 'Corretores',
  [Funcionalidade.PERFIL]: 'Perfis',
  [Funcionalidade.BANCO]: 'Bancos',
  [Funcionalidade.AUDITORIA]: 'Auditoria',
  [Funcionalidade.CONTATO]: 'Contatos',
  [Funcionalidade.ADMINISTRACAO]: 'Administração'
};
