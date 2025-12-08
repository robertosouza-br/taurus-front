# Guia de Uso - Taurus Auth

## 🚀 Início Rápido

### 1. Primeiro Acesso

Após instalar e executar o projeto (`npm start`), acesse:
```
http://localhost:4200
```

Você será redirecionado automaticamente para a tela de login.

### 2. Credenciais de Teste

Configure sua API Spring Boot com usuários de teste. Exemplo:

```
Usuário: admin
Senha: admin123
Roles: ADMIN
Permissions: ALL

Usuário: gerente
Senha: gerente123
Roles: MANAGER
Permissions: VIEW_USERS, VIEW_REPORTS

Usuário: usuario
Senha: usuario123
Roles: USER
Permissions: VIEW_DASHBOARD
```

## 📚 Guia de Desenvolvimento

### Criando uma Nova Rota Protegida

1. **Crie o componente:**
```bash
ng generate component features/minha-feature/meu-componente --module=features/minha-feature/minha-feature.module
```

2. **Configure a rota com proteção:**
```typescript
// Em app-routing.module.ts ou no módulo de feature
{
  path: 'meu-componente',
  component: MeuComponente,
  canActivate: [AuthGuard, RoleGuard],
  data: { 
    roles: ['ADMIN', 'MANAGER'],
    title: 'Meu Componente'
  }
}
```

### Adicionando Item ao Menu

Edite `src/app/features/layout/sidebar/sidebar.component.ts`:

```typescript
private initializeMenu(): void {
  const allMenuItems: MenuItem[] = [
    // ... itens existentes
    {
      label: 'Meu Módulo',
      icon: 'pi pi-star',
      routerLink: '/meu-modulo',
      roles: ['ADMIN'], // Opcional: controle por role
      permissions: ['VIEW_MEU_MODULO'] // Opcional: controle por permissão
    }
  ];
  // ...
}
```

### Usando Controle de Permissões em Templates

```html
<!-- Exibir botão apenas para admins -->
<button 
  *appHasRole="'ADMIN'" 
  pButton 
  label="Deletar"
  (click)="deletar()"
></button>

<!-- Exibir seção para múltiplas roles -->
<div *appHasRole="['ADMIN', 'MANAGER']">
  <h2>Painel Administrativo</h2>
  <!-- conteúdo -->
</div>

<!-- Exibir com permissão específica -->
<div *appHasPermission="'EDIT_USERS'">
  <button pButton label="Editar Usuário"></button>
</div>
```

### Usando Controle de Permissões no Código

```typescript
import { AuthorizationService } from '@core/services';

export class MeuComponente {
  canEdit = false;
  canDelete = false;

  constructor(private authorizationService: AuthorizationService) {}

  ngOnInit() {
    // Verificar permissões
    this.canEdit = this.authorizationService.hasPermission('EDIT_USERS');
    this.canDelete = this.authorizationService.hasRole('ADMIN');

    // Executar ação condicionalmente
    if (this.authorizationService.hasAnyRole(['ADMIN', 'MANAGER'])) {
      this.carregarDadosAdministrativos();
    }
  }
}
```

### Criando um Novo Serviço

```bash
ng generate service features/meu-modulo/services/meu-servico
```

Exemplo de uso com autenticação:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeuServicoService {
  private apiUrl = `${environment.apiUrl}/meu-endpoint`;

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    // O JWT Interceptor adiciona automaticamente o token
    return this.http.get<any[]>(this.apiUrl);
  }

  criar(dados: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, dados);
  }
}
```

## 🎨 Customização Visual

### Alterando Tema

Edite `src/styles.scss`:

```scss
// Trocar tema do PrimeNG
@import "primeng/resources/themes/lara-dark-blue/theme.css"; // Tema escuro
// ou
@import "primeng/resources/themes/saga-blue/theme.css"; // Tema azul
```

### Cores do Sistema

Edite as variáveis em `src/app/features/layout/*/component.scss`:

```scss
// Gradiente principal
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Altere para suas cores
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

### Logo

Adicione sua logo em `src/assets/images/logo.png` e atualize:

```html
<!-- src/app/features/layout/header/header.component.html -->
<div class="logo">
  <img src="assets/images/logo.png" alt="Logo" class="logo-img">
  <span class="logo-text">Seu Sistema</span>
</div>
```

## 🔧 Configurações Avançadas

### Configurar Timeout de Sessão

Em `src/app/core/services/auth.service.ts`:

```typescript
// Adicionar verificação de timeout
private sessionTimeout = 30 * 60 * 1000; // 30 minutos

startSessionTimeout() {
  setTimeout(() => {
    this.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { sessionExpired: true }
    });
  }, this.sessionTimeout);
}
```

### Configurar Interceptor de Loading

Criar um serviço de loading global:

```typescript
// loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  show() { this.loadingSubject.next(true); }
  hide() { this.loadingSubject.next(false); }
}

// loading.interceptor.ts
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.show();
    
    return next.handle(req).pipe(
      finalize(() => this.loadingService.hide())
    );
  }
}
```

### Adicionar Notificações Toast

Usando PrimeNG Toast:

```typescript
// No componente
import { MessageService } from 'primeng/api';

constructor(private messageService: MessageService) {}

mostrarSucesso() {
  this.messageService.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: 'Operação realizada com sucesso!'
  });
}

mostrarErro() {
  this.messageService.add({
    severity: 'error',
    summary: 'Erro',
    detail: 'Ocorreu um erro na operação.'
  });
}
```

```html
<!-- No template principal -->
<p-toast></p-toast>
```

## 📱 Testes

### Teste de Autenticação

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve fazer login com sucesso', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { username: 'test' }
    };

    service.login({ username: 'test', password: 'test' }).subscribe(user => {
      expect(user.username).toBe('test');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

### Executar Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run e2e

# Cobertura de testes
npm run test -- --code-coverage
```

## 🐛 Troubleshooting

### Erro CORS

Se encontrar erros de CORS, configure no Spring Boot:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:4200")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

### Token não está sendo enviado

Verifique o `environment.ts`:
- `tokenWhitelistedDomains` deve incluir o domínio da API
- `tokenBlacklistedRoutes` não deve incluir suas rotas protegidas

### Sidebar não expande

Verifique se o evento está sendo disparado corretamente:
```typescript
// No header.component.ts
toggleSidebar(): void {
  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
}
```

## 📖 Recursos Adicionais

### Documentação Oficial

- [Angular](https://angular.dev)
- [PrimeNG](https://primeng.org)
- [RxJS](https://rxjs.dev)
- [TypeScript](https://www.typescriptlang.org)

### Tutoriais Recomendados

1. Angular Authentication & Authorization
2. JWT Best Practices
3. RxJS Operators
4. Angular Performance Optimization

---

**Dúvidas?** Consulte o README.md principal ou entre em contato com a equipe de desenvolvimento.
