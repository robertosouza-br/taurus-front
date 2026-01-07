# Taurus Auth - Guia para Agentes IA

Sistema Angular 17 de autenticação e controle de acesso com integração Spring Boot via JWT.

## Arquitetura Core

### Estrutura Modular (não standalone)
- **CoreModule**: Singleton com serviços globais (`auth.service`, `permissao.service`), guards e interceptors
- **SharedModule**: Componentes reutilizáveis, diretivas e classes base
- **Feature Modules**: Lazy-loaded via `loadChildren` no [app-routing.module.ts](src/app/app-routing.module.ts)
- **angular.json** configurado para gerar componentes **não standalone** (`"standalone": false`)

### Sistema de Autenticação e Permissões
O sistema usa dois níveis de controle de acesso:
1. **JWT tokens** com refresh automático em [auth.service.ts](src/app/core/services/auth.service.ts#L34-L58)
2. **Sistema de permissões granulares** com enums `Funcionalidade` e `Permissao`

**Proteger rotas:**
```typescript
// Exemplo real em src/app/app-routing.module.ts
{
  path: 'corretores',
  canActivate: [AuthGuard, PermissaoGuard],
  data: { 
    funcionalidade: Funcionalidade.CORRETOR,
    permissoes: [Permissao.CONSULTAR]
  }
}
```

**Controlar visibilidade no template:**
```html
<!-- Diretiva *appTemPermissao em shared/directives/tem-permissao.directive.ts -->
<button *appTemPermissao="{ funcionalidade: 'VENDA', permissoes: ['INCLUIR'] }">
  Criar Venda
</button>
```

## Padrões de Desenvolvimento

### ⚠️ REGRAS FUNDAMENTAIS
1. **SEMPRE use componentes customizados existentes** - Nunca reimplemente funcionalidades já disponíveis
2. **Siga rigorosamente os padrões estabelecidos** - Classes base, estrutura de pastas, nomenclaturas
3. **Código reutilizável é obrigatório** - Se copiar/colar código, crie um componente/serviço compartilhado
4. **Respeite o layout existente** - Mantenha consistência visual com páginas similares
5. **Não existe componente? Crie um reutilizável** - Sempre pergunte se deve criar novo componente em `shared/components/`
6. **Responsividade é MANDATÓRIA** - Sistema roda desde celular até monitores grandes, sempre teste layouts em múltiplos tamanhos

### Classes Base Obrigatórias
**TODOS os componentes CRUD DEVEM estender** as classes base em [shared/base/](src/app/shared/base/):

**Listas**: Extend `BaseListComponent`
- Implementa scroll automático ao paginar
- Padrão: método `handleLazyLoad(event, callback)` para lazy loading do PrimeNG
- Variáveis: `carregando`, `exportando`, `totalRegistros`

**Formulários**: Extend `BaseFormComponent`
- Auto-foco em primeiro campo com erro
- Validação automática via `validarFormulario()`
- Implementar `getCamposObrigatorios()` obrigatoriamente
- Variáveis: `salvando`, `tentouSalvar`

### Componentes Customizados (USE SEMPRE!)
**OBRIGATÓRIO usar componentes de** [shared/components/](src/app/shared/components/) **antes de criar novos**:

**Estruturais:**
- `<app-page-header>`: Cabeçalho de todas as páginas (breadcrumb, título, ações)
- `<app-data-table>`: Tabela com paginação, ordenação, ações (substitui `<p-table>` direto)
- `<app-export-speed-dial>`: Botões de exportação (PDF, Excel, CSV)

**Inputs com Validação:**
- `<app-input-text>`: Input text padrão com validação
- `<app-input-textarea>`: Textarea com contador de caracteres
- `<app-input-cpf>`: CPF com máscara e validação
- `<app-input-telefone>`: Telefone com máscara brasileira
- `<app-input-date>`: Datepicker configurado para pt-BR
- `<app-input-password>`: Password com toggle de visibilidade
- `<app-autocomplete>`: Autocomplete com busca assíncrona

**Ações:**
- `<app-action-button>`: Botões de ação com loading state
- `<app-custom-button>`: Botão customizável com ícones PrimeNG
- `<app-confirmation-dialog>`: Diálogos de confirmação padrão

**Quando criar novo componente customizado:**
- Se precisar de 3+ linhas de HTML/lógica repetida em 2+ lugares
- Se o componente PrimeNG precisar de configuração específica do projeto
- SEMPRE criar em `shared/components/` com README.md documentando uso

### Resposta Paginada da API
Todas as APIs de listagem retornam o padrão Spring Boot definido em [page.model.ts](src/app/core/models/page.model.ts):
```typescript
interface Page<T> {
  content: T[];
  totalElements: number;
  // ... outros campos Spring Data
}
```

## Desenvolvimento

### Comandos Essenciais
```bash
# Dev com proxy para API (recomendado)
npm run start:proxy  # Proxy config em proxy.conf.json

# Dev sem proxy
npm start

# Build produção
npm run build:prod

# Testes com cobertura
npm run test:coverage
```

### Configuração da API
Editar [environment.ts](src/environments/environment.ts):
- `apiUrl`: Base URL da API Spring Boot (`http://localhost:8080/taurus-api/api/v1`)
- Proxy configurado em [proxy.conf.json](proxy.conf.json) para evitar CORS

### Estrutura de Feature Module (SIGA RIGOROSAMENTE)
Cada feature DEVE seguir este padrão:
```
features/nome-feature/
├── nome-feature-routing.module.ts  # Rotas do módulo
├── nome-feature.module.ts          # Declarações e imports
├── nome-feature-lista/             # Listagem (extends BaseListComponent)
├── nome-feature-novo/              # Criação (extends BaseFormComponent)
└── nome-feature-edicao/            # Edição (extends BaseFormComponent)
```

**Padrão de nomenclatura:**
- Pasta: plural (`corretores/`, `vendas/`)
- Componentes: singular para form, plural para lista (`corretor-novo`, `corretores-lista`)
- Arquivo module: nome da pasta (`corretores.module.ts`)

**Imports obrigatórios no module:**
```typescript
// SharedModule contém PrimeNG, Material, componentes customizados
imports: [CommonModule, SharedModule, NomeFeatureRoutingModule]
```

## Bibliotecas UI

- **PrimeNG 17**: Biblioteca principal (DataTable, Dialog, Toast)
- **Angular Material**: Complementar (Sidebar, alguns inputs)
- **PrimeFlex**: Utilitários CSS (grid, spacing)

**Exemplo de DataTable PrimeNG:**
```html
<p-table [value]="dados" [lazy]="true" (onLazyLoad)="onLazyLoad($event)">
  <!-- Padrão usado em todos os componentes de lista -->
</p-table>
```

## Interceptors HTTP

1. **JwtInterceptor** ([jwt.interceptor.ts](src/app/core/interceptors/jwt.interceptor.ts)): Adiciona token `Bearer` automaticamente
2. **ErrorInterceptor**: Tratamento global de erros HTTP
3. **SecurityInterceptor**: Headers de segurança adicionais

Não adicione manualmente headers de autenticação - o interceptor faz isso.

## Convenções Rígidas

### Nomenclatura (NUNCA violar)
- Métodos públicos em serviços: retornam `Observable<T>` (RxJS)
- Variáveis de estado: `carregando`, `salvando`, `exportando` (boolean, sempre esses nomes)
- Total de registros: **SEMPRE** `totalRegistros` (nunca `total`, `count`, etc.)
- Enums em `core/enums/`: `Funcionalidade` e `Permissao` definem controle de acesso
- Métodos de carregamento: `carregar()`, `carregarPorId(id)`, `salvar()`, `excluir(id)`

### Reutilização de Código
**Se você identificar código duplicado:**
1. **Mesmo trecho em 2+ componentes** → Criar método em classe base ou serviço em `shared/services/`
2. **Lógica de formatação** → Criar pipe em `shared/pipes/`
3. **Validação customizada** → Criar validator em `shared/validators/`
4. **UI repetida** → Criar componente em `shared/components/`

**Exemplos de serviços reutilizáveis existentes:**
- `FormFocusService`: Foco em campos com erro (usado nas classes base)
- `LoadingService`: Loading global da aplicação
- `SidebarService`: Controle do menu lateral

### Respeito ao Layout
Analise páginas similares antes de criar novas funcionalidades:
- Estrutura de formulário: veja [corretor-novo](src/app/features/corretores/corretor-novo/)
- Estrutura de lista: veja [corretores-lista](src/app/features/corretores/corretores-lista/)
- Diálogos: sempre use `<app-confirmation-dialog>` ou `<p-dialog>` com classes CSS padrão
- Espaçamento: use classes PrimeFlex (`p-3`, `mt-2`, `gap-2`) ao invés de CSS customizado

### Responsividade (CRÍTICO)
**Sistema deve funcionar perfeitamente de celulares a monitores grandes**

**Grid System PrimeFlex (USE SEMPRE):**
```html
<!-- Responsivo: col-12 mobile, col-6 tablet, col-4 desktop -->
<div class="grid">
  <div class="col-12 md:col-6 lg:col-4">
    <app-input-text label="Nome" [(ngModel)]="nome"></app-input-text>
  </div>
</div>
```

**Breakpoints PrimeFlex:**
- Mobile: `< 576px` (sem prefixo, ex: `col-12`)
- Tablet: `≥ 768px` (prefixo `md:`, ex: `md:col-6`)
- Desktop: `≥ 992px` (prefixo `lg:`, ex: `lg:col-4`)
- Wide: `≥ 1200px` (prefixo `xl:`, ex: `xl:col-3`)

**Padrões Obrigatórios:**
- **Tabelas**: Use `<app-data-table>` que já é responsivo (scroll horizontal automático em mobile)
- **Formulários**: Sempre col-12 em mobile, adapte para md/lg conforme necessário
- **Botões de ação**: Stack vertical em mobile, horizontal em desktop
- **Sidebar**: Colapsa automaticamente em mobile (já implementado no layout)
- **Diálogos**: `[breakpoints]="{'960px': '75vw', '640px': '90vw'}"` para p-dialog

**TESTE sempre em:**
1. Mobile (375px - iPhone SE)
2. Tablet (768px - iPad)
3. Desktop (1920px - Full HD)

## Integração Backend

Endpoints esperados da API Spring Boot:
- `POST /api/v1/auth/login` - Retorna `{ token, refreshToken, user }`
- `POST /api/v1/auth/refresh` - Renovação de token
- APIs CRUD devem retornar `Page<T>` do Spring Data para listagens paginadas
