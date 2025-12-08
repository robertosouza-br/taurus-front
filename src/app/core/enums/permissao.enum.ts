export enum Permissao {
  CONSULTAR = 'CONSULTAR',
  INCLUIR = 'INCLUIR',
  ALTERAR = 'ALTERAR',
  EXCLUIR = 'EXCLUIR',
  EXPORTAR = 'EXPORTAR',
  IMPRIMIR = 'IMPRIMIR',
  APROVAR = 'APROVAR',
  REPROVAR = 'REPROVAR',
  CANCELAR = 'CANCELAR',
  REATIVAR = 'REATIVAR'
}

export const PermissaoLabel: Record<Permissao, string> = {
  [Permissao.CONSULTAR]: 'Consultar',
  [Permissao.INCLUIR]: 'Incluir',
  [Permissao.ALTERAR]: 'Alterar',
  [Permissao.EXCLUIR]: 'Excluir',
  [Permissao.EXPORTAR]: 'Exportar',
  [Permissao.IMPRIMIR]: 'Imprimir',
  [Permissao.APROVAR]: 'Aprovar',
  [Permissao.REPROVAR]: 'Reprovar',
  [Permissao.CANCELAR]: 'Cancelar',
  [Permissao.REATIVAR]: 'Reativar'
};

export const PermissaoIcone: Record<Permissao, string> = {
  [Permissao.CONSULTAR]: 'pi pi-search',
  [Permissao.INCLUIR]: 'pi pi-plus',
  [Permissao.ALTERAR]: 'pi pi-pencil',
  [Permissao.EXCLUIR]: 'pi pi-trash',
  [Permissao.EXPORTAR]: 'pi pi-download',
  [Permissao.IMPRIMIR]: 'pi pi-print',
  [Permissao.APROVAR]: 'pi pi-check',
  [Permissao.REPROVAR]: 'pi pi-times',
  [Permissao.CANCELAR]: 'pi pi-ban',
  [Permissao.REATIVAR]: 'pi pi-refresh'
};
