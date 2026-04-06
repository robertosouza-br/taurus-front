# Taurus Auth - Sistema de Autenticação e Controle de Acesso

Sistema moderno de autenticação e controle de acesso desenvolvido com Angular 17, integrado com API REST Java Spring Boot usando tokens JWT.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Executando o Projeto](#executando-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Segurança](#segurança)
- [API Integration](#api-integration)
- [Controle de Permissões](#controle-de-permissões)
- [Build para Produção](#build-para-produção)

## ✨ Características

- ✅ **Autenticação JWT** - Integração completa com Spring Boot
- ✅ **Controle de Acesso** - Sistema de roles e permissões
- ✅ **Guards** - Proteção de rotas por autenticação e permissões
- ✅ **Interceptors** - Adição automática de tokens e tratamento de erros
- ✅ **Layout Responsivo** - Design moderno e adaptável
- ✅ **Menu Lateral Expansível** - Sidebar com ícones que expande ao clicar
- ✅ **Otimizado para Performance** - Suporte a múltiplos usuários simultâneos
- ✅ **Refresh Token** - Renovação automática de tokens
- ✅ **Diretivas Customizadas** - Controle de visibilidade por permissões

## 🚀 Tecnologias

- **Angular 17** - Framework principal (sem standalone components)
- **PrimeNG 17** - Biblioteca de componentes UI
- **Angular Material** - Componentes adicionais
- **@auth0/angular-jwt** - Gerenciamento de JWT
- **RxJS** - Programação reativa
- **TypeScript** - Linguagem de programação
- **SCSS** - Pré-processador CSS

## 📦 Pré-requisitos

- Node.js 18+ 
- npm 9+
- Angular CLI 17
- API Spring Boot rodando (veja seção API Integration)

## 🔧 Instalação

1. Clone o repositório (ou navegue até a pasta do projeto):

```bash
cd taurus-auth
```

2. Instale as dependências:

```bash
npm install
```

## ⚙️ Configuração

### Ambiente de Desenvolvimento

Edite o arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // URL da sua API Spring Boot
  tokenWhitelistedDomains: ['localhost:8080'],
  tokenBlacklistedRoutes: ['/api/auth/login', '/api/auth/refresh']
};
```

### Ambiente de Produção

Edite o arquivo `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.seudominio.com.br/api',
  tokenWhitelistedDomains: ['api.seudominio.com.br'],
  tokenBlacklistedRoutes: ['/api/auth/login', '/api/auth/refresh']
};
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── core/                      # Módulo Core (singleton)
│   │   ├── guards/               # Guards de rota
│   │   │   ├── auth.guard.ts    # Guard de autenticação
│   │   │   ├── role.guard.ts    # Guard por role
│   │   │   └── permission.guard.ts # Guard por permissão
│   │   ├── interceptors/        # HTTP Interceptors
│   │   │   ├── jwt.interceptor.ts # Adiciona JWT às requisições
│   │   │   └── error.interceptor.ts # Tratamento de erros
│   │   ├── models/              # Interfaces e tipos
│   │   │   └── user.model.ts   # Modelos de usuário e auth
│   │   ├── services/            # Serviços globais
│   │   │   ├── auth.service.ts # Serviço de autenticação
│   │   │   └── authorization.service.ts # Controle de permissões
│   │   └── core.module.ts
│   │
│   ├── features/                 # Módulos de funcionalidades
│   │   ├── auth/                # Módulo de autenticação
│   │   │   ├── login/          # Componente de login
│   │   │   └── auth.module.ts
│   │   │
│   │   └── layout/              # Módulo de layout
│   │       ├── header/         # Cabeçalho
│   │       ├── sidebar/        # Menu lateral
│   │       ├── footer/         # Rodapé
│   │       ├── dashboard/      # Dashboard inicial
│   │       ├── main-layout/    # Layout principal
│   │       ├── not-found/      # Página 404
│   │       ├── unauthorized/   # Página 403
│   │       └── layout.module.ts
│   │
│   ├── shared/                   # Módulo compartilhado
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── directives/         # Diretivas customizadas
│   │   │   ├── has-role.directive.ts
│   │   │   └── has-permission.directive.ts
│   │   ├── pipes/              # Pipes customizados
│   │   └── shared.module.ts
│   │
│   ├── app-routing.module.ts    # Rotas principais
│   ├── app.component.ts
│   └── app.module.ts
│
├── environments/                 # Configurações de ambiente
│   ├── environment.ts          # Desenvolvimento
│   └── environment.prod.ts     # Produção
│
├── assets/                      # Recursos estáticos
└── styles.scss                  # Estilos globais
```

## 🏃 Executando o Projeto

### Modo Desenvolvimento

```bash
npm start
# ou
ng serve
```

Acesse: `http://localhost:4200`

### Com Proxy para API

Crie um arquivo `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Execute:

```bash
ng serve --proxy-config proxy.conf.json
```

## 🎯 Funcionalidades

### Autenticação

- Login com username e senha
- Validação de formulários
- Armazenamento seguro de tokens JWT
- Refresh token automático
- Logout com limpeza de sessão

### Controle de Acesso

- **Roles**: Grupos de usuários (ADMIN, MANAGER, USER, etc.)
- **Permissions**: Permissões específicas (VIEW_USERS, EDIT_REPORTS, etc.)
- Controle em Guards de rota
- Controle em template com diretivas

### Layout

- **Header Fixo**: Informações do usuário, notificações e menu
- **Sidebar Expansível**: Menu lateral com ícones que expande ao clicar
- **Footer Fixo**: Informações do sistema
- **Responsivo**: Adaptável a diferentes tamanhos de tela

## 🏗️ Arquitetura

### Módulos

- **CoreModule**: Singleton, contém serviços globais e interceptors
- **SharedModule**: Componentes, diretivas e pipes reutilizáveis
- **Feature Modules**: Módulos específicos por funcionalidade (lazy loaded quando possível)

### Padrões Utilizados

- **Reactive Programming**: Uso extensivo de RxJS Observables
- **Dependency Injection**: Injeção de dependências do Angular
- **Guards**: Proteção de rotas
- **Interceptors**: Interceptação de requisições HTTP
- **Services**: Lógica de negócio separada dos componentes

## 🔒 Segurança

### JWT Token

- Armazenado em `localStorage`
- Incluído automaticamente em todas as requisições (exceto login/refresh)
- Validação de expiração
- Renovação automática com refresh token

### Guards

```typescript
// Rota protegida por autenticação
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard]
}

// Rota protegida por role
{
  path: 'users',
  component: UsersComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN', 'MANAGER'] }
}

// Rota protegida por permissão
{
  path: 'reports',
  component: ReportsComponent,
  canActivate: [AuthGuard, PermissionGuard],
  data: { permissions: ['VIEW_REPORTS'] }
}
```

### Diretivas de Controle

```html
<!-- Exibir apenas para ADMIN -->
<div *appHasRole="'ADMIN'">
  Conteúdo apenas para administradores
</div>

<!-- Exibir para ADMIN ou MANAGER -->
<div *appHasRole="['ADMIN', 'MANAGER']">
  Conteúdo para administradores e gerentes
</div>

<!-- Exibir com permissão específica -->
<button *appHasPermission="'DELETE_USERS'">
  Deletar Usuário
</button>
```

## 🔌 API Integration

### Endpoints Esperados

A API Spring Boot deve fornecer os seguintes endpoints:

#### Login
```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "name": "string",
    "roles": ["string"],
    "permissions": ["string"]
  },
  "expiresIn": number
}
```

#### Refresh Token
```
POST /api/auth/refresh
Body: {
  "refreshToken": "string"
}
Response: {
  "token": "string"
}
```

### Exemplo de Implementação Spring Boot

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // Implementação da autenticação
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshTokenRequest request) {
        // Implementação do refresh token
    }
}
```

## 👥 Controle de Permissões

### Verificação Programática

```typescript
// No componente
constructor(private authorizationService: AuthorizationService) {}

// Verificar role
if (this.authorizationService.hasRole('ADMIN')) {
  // Código para admin
}

// Verificar múltiplas roles
if (this.authorizationService.hasAnyRole(['ADMIN', 'MANAGER'])) {
  // Código para admin ou manager
}

// Verificar permissão
if (this.authorizationService.hasPermission('VIEW_USERS')) {
  // Código com permissão
}
```

### Menu Dinâmico

O menu lateral filtra automaticamente os itens baseado nas roles e permissões do usuário:

```typescript
{
  label: 'Usuários',
  icon: 'pi pi-users',
  routerLink: '/users',
  roles: ['ADMIN', 'MANAGER'] // Visível apenas para estas roles
}
```

## 🏭 Build para Produção

```bash
npm run build
# ou
ng build --configuration production
```

Os arquivos serão gerados em `dist/taurus-auth/`.

### Deploy

Os arquivos podem ser servidos por qualquer servidor web (Nginx, Apache, etc.):

```nginx
server {
    listen 80;
    server_name seudominio.com.br;
    root /path/to/dist/taurus-auth;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📝 Licença

Copyright © 2026 CALPER Construtora - Todos os direitos reservados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@construtora.com.br

---

**Desenvolvido com ❤️ usando Angular 17**
