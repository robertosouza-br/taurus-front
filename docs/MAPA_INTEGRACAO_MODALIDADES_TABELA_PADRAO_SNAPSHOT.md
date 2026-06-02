# Mapa de Integracao - Snapshot de Modalidades de Tabela Padrao

## Objetivo
Este documento descreve o contrato atual da funcionalidade de consulta de snapshots internos de modalidades de tabela padrao, com foco no repasse para a equipe de front-end.

Essa funcionalidade foi criada para permitir que o front consulte o estado interno persistido na base da API apos a sincronizacao de modalidades e componentes do empreendimento.

> Importante:
> estes endpoints nao consultam a TOTVS em tempo real.
>
> Eles retornam o snapshot interno sincronizado que foi salvo no banco da API, incluindo metadados de sincronizacao.

---

## Fonte de verdade da implementacao
Este mapa foi consolidado a partir dos seguintes artefatos da API:

- `ModalidadeTabelaPadraoSnapshotController`
- `ModalidadeTabelaPadraoSnapshotConsultaService`
- `ModalidadeTabelaPadraoSnapshotResumoSaidaDTO`
- `ModalidadeTabelaPadraoSnapshotSaidaDTO`
- `ModalidadeTabelaPadraoSnapshotComponenteSaidaDTO`
- `ModalidadeTabelaPadraoSnapshotRepositoryImpl`
- `ModalidadeTabelaPadraoComponenteSnapshotRepositoryImpl`
- `GlobalExceptionHandler`
- `ModalidadeTabelaPadraoSnapshotControllerTest`
- `ModalidadeTabelaPadraoSnapshotConsultaServiceTest`
- `application.yml`

---

## Contexto base da API
Todos os endpoints abaixo estao sob o contexto:

```text
http://localhost:8080/taurus-api
```

---

## 1. Visao geral funcional

## 1.1. O que o front consegue fazer com essa funcionalidade
O front pode usar esses endpoints para:

- consultar um resumo consolidado da ultima sincronizacao de modalidades de um empreendimento
- listar as modalidades sincronizadas no snapshot interno
- abrir o detalhe de uma modalidade especifica com seus componentes
- opcionalmente incluir registros inativos para telas administrativas, auditoria ou suporte

## 1.2. Quando usar esses endpoints
Esses endpoints sao recomendados para telas administrativas como:

- painel de conferencia da sincronizacao
- aba de diagnostico interno
- comparacao entre o estado sincronizado e a regra comercial exibida no front
- apoio operacional quando houver divergencia de modalidade ou componente

## 1.3. Quando nao usar esses endpoints
Se a tela precisar da consulta funcional principal de modalidades para simulacao comercial, o endpoint mais aderente continua sendo o fluxo de modalidades do modulo principal:

```http
GET /api/v1/modalidades-tabela-padrao/empreendimento/{codigoEmpreendimento}
```

### Diferenca pratica

| Endpoint | Finalidade |
|---|---|
| `/api/v1/modalidades-tabela-padrao/empreendimento/{codigoEmpreendimento}` | Consulta funcional da API de modalidades para uso comercial |
| `/api/v1/modalidades-tabela-padrao/snapshots/...` | Consulta administrativa do snapshot interno persistido |

---

## 2. Seguranca

### Autenticacao
Todos os endpoints desta funcionalidade sao protegidos por JWT.

### Header obrigatorio
```http
Authorization: Bearer {token}
```

### Permissao exigida
- usuario administrador
- ou permissao `PROPOSTA:CONSULTAR`

### Observacao importante
Mesmo sendo um modulo de modalidades, a seguranca atual do controller esta vinculada a permissao `PROPOSTA:CONSULTAR`.

---

## 3. Fluxo recomendado para o front

## 3.1. Fluxo de tela administrativa
1. o front carrega o resumo do empreendimento
2. exibe indicadores de sincronizacao e contadores
3. carrega a lista de snapshots do empreendimento
4. o usuario seleciona uma modalidade
5. o front carrega o detalhe da modalidade
6. opcionalmente habilita um toggle `Incluir inativos`
7. ao alterar o toggle, refaz a consulta da lista e do detalhe com `incluirInativos=true`

## 3.2. Regra recomendada de UX
- usar o endpoint de resumo para cards superiores ou cabecalho da tela
- usar o endpoint de listagem para grid ou tabela principal
- usar o endpoint de detalhe para drawer, modal ou aba lateral
- manter uma sinalizacao visual clara de `ativo/inativo`
- exibir a origem e a data da ultima sincronizacao sempre que possivel

---

## 4. Endpoint de resumo do snapshot por empreendimento

### Metodo e rota
```http
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/{codigoEmpreendimento}/resumo
```

### Objetivo funcional
Retornar os metadados do empreendimento e os contadores consolidados do snapshot sincronizado.

### Path Param

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `codigoEmpreendimento` | `integer` | Sim | Codigo do empreendimento |

### Exemplo de chamada
```bash
curl -X GET "http://localhost:8080/taurus-api/api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214/resumo" \
  -H "Authorization: Bearer {jwt}"
```

---

## 5. Response do resumo

### HTTP 200
```json
{
  "codEmpreendimento": 214,
  "nomeEmpreendimento": "WIDE RESIDENCES",
  "empreendimentoAtivo": true,
  "dataUltimaSincronizacaoEmpreendimento": "2026-05-29T03:00:00",
  "dataUltimaSincronizacaoModalidades": "2026-05-29T03:05:00",
  "origemUltimaAtualizacaoModalidades": "TOTVS_MODALIDADE_TABELA_PADRAO",
  "quantidadeModalidades": 2,
  "quantidadeModalidadesAtivas": 2,
  "quantidadeComponentes": 4,
  "quantidadeComponentesAtivos": 4,
  "quantidadeComponentesTabelaPadrao": 3,
  "quantidadeComponentesExtras": 1
}
```

### Leitura funcional do payload

| Campo | Descricao para o front |
|---|---|
| `codEmpreendimento` | Codigo do empreendimento consultado |
| `nomeEmpreendimento` | Nome exibivel no cabecalho da tela |
| `empreendimentoAtivo` | Situacao atual do empreendimento na base interna |
| `dataUltimaSincronizacaoEmpreendimento` | Ultima sincronizacao geral do empreendimento |
| `dataUltimaSincronizacaoModalidades` | Ultima sincronizacao especifica de modalidades |
| `origemUltimaAtualizacaoModalidades` | Origem tecnica da carga, por exemplo `TOTVS_MODALIDADE_TABELA_PADRAO` |
| `quantidadeModalidades` | Quantidade de modalidades retornadas no snapshot |
| `quantidadeModalidadesAtivas` | Quantidade de modalidades ativas |
| `quantidadeComponentes` | Quantidade de componentes contabilizados no resumo atual |
| `quantidadeComponentesAtivos` | Quantidade de componentes ativos |
| `quantidadeComponentesTabelaPadrao` | Quantidade de componentes marcados como tabela padrao |
| `quantidadeComponentesExtras` | Quantidade de componentes marcados como extras |

### Observacao importante de contrato
Na implementacao atual do backend, os contadores de componentes do resumo sao calculados a partir da consulta de componentes ativos do empreendimento.

Em outras palavras, hoje o campo `quantidadeComponentes` representa o conjunto de componentes ativos considerados no resumo atual.

---

## 6. Endpoint de listagem de snapshots por empreendimento

### Metodo e rota
```http
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/{codigoEmpreendimento}?incluirInativos=false
```

### Objetivo funcional
Listar os snapshots de modalidades sincronizadas de um empreendimento, incluindo o resumo da propria modalidade e seus componentes.

### Path Param

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `codigoEmpreendimento` | `integer` | Sim | Codigo do empreendimento |

### Query Param

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `incluirInativos` | `boolean` | Nao | Quando `true`, inclui snapshots inativos e componentes inativos. Default `false` |

### Comportamento padrao
Se `incluirInativos` nao for enviado, o backend assume:

```text
false
```

### Ordenacao atual
O backend retorna a lista ordenada por:

```text
codigoModalidade ascendente
```

### Exemplo de chamada
```bash
curl -X GET "http://localhost:8080/taurus-api/api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214?incluirInativos=false" \
  -H "Authorization: Bearer {jwt}"
```

---

## 7. Response da listagem

### HTTP 200
```json
[
  {
    "id": 10,
    "codEmpreendimento": 214,
    "nomeEmpreendimento": "WIDE RESIDENCES",
    "codigoModalidade": "1",
    "modalidade": "1",
    "descricao": "Modalidade 1",
    "tabelaPadrao": "SIM",
    "ativo": true,
    "dataUltimaSincronizacao": "2026-05-29T03:05:00",
    "origemUltimaAtualizacao": "TOTVS_MODALIDADE_TABELA_PADRAO",
    "dataCriacao": "2026-05-29T03:05:00",
    "dataAtualizacao": "2026-05-29T03:05:00",
    "quantidadeComponentes": 1,
    "quantidadeComponentesTabelaPadrao": 1,
    "quantidadeComponentesExtras": 0,
    "componentes": []
  }
]
```

### Leitura funcional do payload

| Campo | Descricao para o front |
|---|---|
| `id` | Identificador interno do snapshot da modalidade |
| `codEmpreendimento` | Codigo do empreendimento |
| `nomeEmpreendimento` | Nome do empreendimento |
| `codigoModalidade` | Codigo tecnico da modalidade |
| `modalidade` | Valor textual da modalidade conforme snapshot salvo |
| `descricao` | Nome legivel para exibicao na UI |
| `tabelaPadrao` | Indicador textual atual vindo do snapshot, por exemplo `SIM` |
| `ativo` | Situacao da modalidade no snapshot interno |
| `dataUltimaSincronizacao` | Data/hora em que a modalidade foi sincronizada |
| `origemUltimaAtualizacao` | Origem tecnica da atualizacao |
| `dataCriacao` | Data/hora de criacao do registro interno |
| `dataAtualizacao` | Data/hora da ultima atualizacao interna |
| `quantidadeComponentes` | Quantidade de componentes retornados dentro do item |
| `quantidadeComponentesTabelaPadrao` | Quantidade de componentes com `tabelaPadrao=true` |
| `quantidadeComponentesExtras` | Quantidade de componentes com `tabelaPadrao=false` |
| `componentes` | Lista de componentes desta modalidade no snapshot |

### Observacao importante
Mesmo no endpoint de listagem, o backend ja devolve a propriedade `componentes` em cada modalidade.

Ou seja, o front pode:
- exibir uma lista simples ignorando o array de componentes
- ou aproveitar a mesma resposta para expor expansao inline sem nova chamada, quando o detalhe adicional nao for necessario

---

## 8. Endpoint de detalhe por modalidade

### Metodo e rota
```http
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/{codigoEmpreendimento}/modalidade/{codigoModalidade}?incluirInativos=false
```

### Objetivo funcional
Retornar o detalhe completo do snapshot de uma modalidade especifica, incluindo a lista de componentes relacionados.

### Path Params

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `codigoEmpreendimento` | `integer` | Sim | Codigo do empreendimento |
| `codigoModalidade` | `string` | Sim | Codigo da modalidade |

### Query Param

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `incluirInativos` | `boolean` | Nao | Quando `true`, permite consultar modalidade inativa e incluir componentes inativos. Default `false` |

### Regra importante
Se a modalidade existir mas estiver inativa, a consulta com `incluirInativos=false` retorna `404`.

### Exemplo de chamada
```bash
curl -X GET "http://localhost:8080/taurus-api/api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214/modalidade/1?incluirInativos=false" \
  -H "Authorization: Bearer {jwt}"
```

---

## 9. Response do detalhe da modalidade

### HTTP 200
```json
{
  "id": 10,
  "codEmpreendimento": 214,
  "nomeEmpreendimento": "WIDE RESIDENCES",
  "codigoModalidade": "1",
  "modalidade": "1",
  "descricao": "Modalidade 1",
  "tabelaPadrao": "SIM",
  "ativo": true,
  "dataUltimaSincronizacao": "2026-05-29T03:05:00",
  "origemUltimaAtualizacao": "TOTVS_MODALIDADE_TABELA_PADRAO",
  "dataCriacao": "2026-05-29T03:05:00",
  "dataAtualizacao": "2026-05-29T03:05:00",
  "quantidadeComponentes": 1,
  "quantidadeComponentesTabelaPadrao": 1,
  "quantidadeComponentesExtras": 0,
  "componentes": [
    {
      "id": 100,
      "codigoComponente": "ATO",
      "nomeComponente": "ATO",
      "tipoComponente": "ENTRADA",
      "grupoComponente": 1,
      "quantidade": 1,
      "periodicidade": 0,
      "percentual": 10,
      "valorMinimo": null,
      "valorMaximo": null,
      "prazoMeses": 1,
      "ordem": 1,
      "tabelaPadrao": true,
      "ativo": true,
      "dataUltimaSincronizacao": "2026-05-29T03:05:00",
      "origemUltimaAtualizacao": "TOTVS_MODALIDADE_TABELA_PADRAO",
      "dataCriacao": "2026-05-29T03:05:00",
      "dataAtualizacao": "2026-05-29T03:05:00"
    }
  ]
}
```

---

## 10. Campos do componente para a UI

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `number` | Identificador interno do componente no snapshot |
| `codigoComponente` | `string` | Codigo tecnico do componente |
| `nomeComponente` | `string` | Nome legivel do componente |
| `tipoComponente` | `string` | Tipo funcional do componente |
| `grupoComponente` | `number` | Agrupador numerico do componente |
| `quantidade` | `number` | Quantidade configurada no snapshot |
| `periodicidade` | `number` | Periodicidade salva no snapshot |
| `percentual` | `number` | Percentual configurado, quando houver |
| `valorMinimo` | `number \| null` | Valor minimo, quando aplicavel |
| `valorMaximo` | `number \| null` | Valor maximo, quando aplicavel |
| `prazoMeses` | `number` | Prazo em meses |
| `ordem` | `number` | Ordem de apresentacao/calculo |
| `tabelaPadrao` | `boolean` | `true` para componente padrao, `false` para extra |
| `ativo` | `boolean` | Situacao atual do componente no snapshot |
| `dataUltimaSincronizacao` | `string` | Data/hora da ultima sincronizacao do componente |
| `origemUltimaAtualizacao` | `string` | Origem tecnica do dado |
| `dataCriacao` | `string` | Criacao interna do registro |
| `dataAtualizacao` | `string` | Ultima atualizacao interna do registro |

### Ordenacao atual dos componentes
O backend retorna os componentes ordenados por:

```text
ordem ascendente
codigoComponente ascendente
```

### Regra recomendada para o front
O front deve respeitar a ordenacao recebida da API e nao reordenar arbitrariamente quando a tela tiver foco de auditoria ou diagnostico.

---

## 11. Regras de interpretacao para o front

## 11.1. Indicadores recomendados na tela
A UI pode destacar, por modalidade:

- codigo e descricao
- se a modalidade esta ativa ou inativa
- se e tabela padrao
- total de componentes
- quantidade de componentes padrao
- quantidade de componentes extras
- data da ultima sincronizacao
- origem da ultima atualizacao

## 11.2. Toggle `incluirInativos`
Com o toggle desligado:
- a lista traz apenas modalidades ativas
- os componentes retornados em cada modalidade tambem sao apenas os ativos
- a consulta de detalhe retorna `404` se a modalidade estiver inativa

Com o toggle ligado:
- a lista pode trazer modalidades inativas
- os componentes inativos passam a ser retornados
- o detalhe de modalidade inativa deixa de ser filtrado

## 11.3. Campos nulos
O front deve aceitar campos nulos em propriedades opcionais como:

- `valorMinimo`
- `valorMaximo`
- datas de sincronizacao, dependendo do estado do cadastro
- metadados de origem, quando nao informados

---

## 12. Responses de erro

## 12.1. Nao autenticado
### HTTP 401
O usuario nao enviou JWT valido.

Exemplo esperado:
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Full authentication is required to access this resource"
}
```

---

## 12.2. Sem permissao
### HTTP 403
O usuario esta autenticado, mas nao possui permissao `PROPOSTA:CONSULTAR` e nao e administrador.

Exemplo esperado:
```json
{
  "timestamp": "2026-05-29T10:00:00",
  "status": 403,
  "error": "Acesso negado",
  "message": "Usuario sem permissao para realizar esta acao"
}
```

---

## 12.3. Empreendimento nao encontrado
### HTTP 404
Esse erro ocorre quando o codigo do empreendimento nao existe na base interna.

Exemplo esperado:
```json
{
  "timestamp": "2026-05-29T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Empreendimento nao encontrado para o codigo: 214"
}
```

---

## 12.4. Snapshot de modalidade nao encontrado
### HTTP 404
Esse erro ocorre quando:

- a modalidade informada nao existe para o empreendimento
- ou a modalidade existe, mas esta inativa e a consulta foi feita com `incluirInativos=false`

Exemplo esperado:
```json
{
  "timestamp": "2026-05-29T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Snapshot de modalidade nao encontrado para o empreendimento 214 e modalidade 1"
}
```

---

## 13. Exemplo de fluxo completo

## 13.1. Cabecalho e indicadores
```text
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214/resumo
-> retorna datas da ultima sincronizacao
-> retorna quantidade de modalidades e componentes
-> front monta cards de resumo
```

## 13.2. Lista principal
```text
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214?incluirInativos=false
-> retorna modalidades ativas ordenadas por codigoModalidade
-> cada item ja pode trazer componentes ativos
-> front monta grid, tabela ou accordion
```

## 13.3. Detalhe da modalidade
```text
GET /api/v1/modalidades-tabela-padrao/snapshots/empreendimento/214/modalidade/1?incluirInativos=false
-> retorna a modalidade especifica
-> retorna componentes ordenados por ordem e codigoComponente
-> front abre painel de detalhe
```

---

## 14. Exemplo de contrato para TypeScript

### Resumo
```typescript
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
```

### Item de modalidade
```typescript
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
```

---

## 15. Resumo executivo para o front

### O que o front precisa fazer
- autenticar a chamada com JWT
- garantir permissao `PROPOSTA:CONSULTAR` ou perfil administrador
- usar o endpoint de resumo para indicadores da tela
- usar o endpoint de listagem para a visao principal
- usar o endpoint de detalhe para abrir uma modalidade especifica
- expor um filtro opcional `incluirInativos`
- preservar a ordenacao retornada pela API
- tratar `401`, `403` e `404` explicitamente

### Regra mais importante
```text
Esses endpoints representam o snapshot interno sincronizado da API e nao a consulta em tempo real da TOTVS.
```

---

**Ultima atualizacao:** 29/05/2026