# Exemplos Práticos - Taurus Auth

## 📝 Exemplos de Uso Comum

### 1. Criando uma Nova Página Protegida

#### Passo 1: Gere o componente
```bash
ng generate module features/meu-modulo
ng generate component features/meu-modulo/minha-pagina --module=features/meu-modulo/meu-modulo.module
```

#### Passo 2: Configure a rota
```typescript
// Em app-routing.module.ts
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [AuthGuard],
  children: [
    // ... outras rotas
    {
      path: 'minha-pagina',
      loadChildren: () => import('./features/meu-modulo/meu-modulo.module')
        .then(m => m.MeuModuloModule),
      data: { 
        roles: ['ADMIN', 'MANAGER'] // Opcional
      }
    }
  ]
}
```

#### Passo 3: Use permissões no template
```html
<!-- minha-pagina.component.html -->
<div class="page-container">
  <h1>Minha Página</h1>
  
  <!-- Botão visível apenas para ADMIN -->
  <button 
    *appHasRole="'ADMIN'" 
    pButton 
    label="Ação Administrativa"
    (click)="acaoAdministrativa()"
  ></button>
  
  <!-- Seção visível para quem tem permissão -->
  <div *appHasPermission="'VIEW_SENSITIVE_DATA'">
    <p>Dados sensíveis aqui</p>
  </div>
</div>
```

### 2. Chamando API Protegida

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeuServicoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // O token JWT é adicionado automaticamente pelo JwtInterceptor
  
  listarDados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/meus-dados`);
  }

  criarItem(dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/meus-dados`, dados);
  }

  atualizarItem(id: string, dados: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/meus-dados/${id}`, dados);
  }

  deletarItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/meus-dados/${id}`);
  }
}
```

Uso no componente:

```typescript
import { Component, OnInit } from '@angular/core';
import { MeuServicoService } from './services/meu-servico.service';

@Component({
  selector: 'app-minha-lista',
  templateUrl: './minha-lista.component.html'
})
export class MinhaListaComponent implements OnInit {
  dados: any[] = [];
  loading = false;

  constructor(private meuServico: MeuServicoService) {}

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.loading = true;
    this.meuServico.listarDados().subscribe({
      next: (dados) => {
        this.dados = dados;
        this.loading = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar dados:', erro);
        this.loading = false;
      }
    });
  }
}
```

### 3. Verificando Permissões no Código

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthorizationService } from '@core/services';

@Component({
  selector: 'app-meu-componente',
  templateUrl: './meu-componente.component.html'
})
export class MeuComponenteComponent implements OnInit {
  podeEditar = false;
  podeDeletar = false;
  isAdmin = false;

  constructor(private authorizationService: AuthorizationService) {}

  ngOnInit() {
    // Verificar permissões
    this.podeEditar = this.authorizationService.hasPermission('EDIT_USERS');
    this.podeDeletar = this.authorizationService.hasPermission('DELETE_USERS');
    
    // Verificar role
    this.isAdmin = this.authorizationService.hasRole('ADMIN');
    
    // Verificar múltiplas roles
    const isGerente = this.authorizationService.hasAnyRole(['ADMIN', 'MANAGER']);
    
    if (isGerente) {
      this.carregarDadosGerenciais();
    }
  }

  deletar(id: string) {
    if (!this.podeDeletar) {
      alert('Você não tem permissão para deletar');
      return;
    }
    // Lógica de deleção
  }

  carregarDadosGerenciais() {
    // Carregar dados específicos para gerentes
  }
}
```

### 4. Adicionando Item ao Menu Sidebar

```typescript
// Em sidebar.component.ts, método initializeMenu()

private initializeMenu(): void {
  const allMenuItems: MenuItem[] = [
    // ... itens existentes
    
    // Novo módulo
    {
      label: 'Cadastros',
      icon: 'pi pi-database',
      items: [
        {
          label: 'Clientes',
          icon: 'pi pi-users',
          routerLink: '/cadastros/clientes',
          permissions: ['VIEW_CLIENTS']
        },
        {
          label: 'Produtos',
          icon: 'pi pi-box',
          routerLink: '/cadastros/produtos',
          permissions: ['VIEW_PRODUCTS']
        },
        {
          label: 'Fornecedores',
          icon: 'pi pi-building',
          routerLink: '/cadastros/fornecedores',
          roles: ['ADMIN', 'MANAGER']
        }
      ]
    },
    
    // Item simples
    {
      label: 'Relatórios',
      icon: 'pi pi-chart-bar',
      routerLink: '/relatorios',
      permissions: ['VIEW_REPORTS']
    }
  ];

  this.menuItems = this.filterMenuItems(allMenuItems);
}
```

### 5. Formulário com Validação

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cadastro-usuario',
  templateUrl: './cadastro-usuario.component.html'
})
export class CadastroUsuarioComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
      role: ['USER', Validators.required],
      ativo: [true]
    }, {
      validators: this.senhasIguais
    });
  }

  get f() {
    return this.form.controls;
  }

  senhasIguais(group: FormGroup) {
    const senha = group.get('senha')?.value;
    const confirmar = group.get('confirmarSenha')?.value;
    return senha === confirmar ? null : { senhasDiferentes: true };
  }

  salvar() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    
    // Chamar serviço para salvar
    console.log('Dados do formulário:', this.form.value);
    
    // Simular salvamento
    setTimeout(() => {
      this.loading = false;
      alert('Usuário cadastrado com sucesso!');
      this.form.reset();
      this.submitted = false;
    }, 1000);
  }
}
```

Template correspondente:

```html
<div class="form-container">
  <h2>Cadastro de Usuário</h2>
  
  <form [formGroup]="form" (ngSubmit)="salvar()">
    <!-- Nome -->
    <div class="form-field">
      <span class="p-float-label">
        <input 
          id="nome" 
          type="text" 
          pInputText 
          formControlName="nome"
          [class.ng-invalid]="submitted && f['nome'].errors"
        >
        <label for="nome">Nome Completo</label>
      </span>
      <small class="p-error" *ngIf="submitted && f['nome'].errors?.['required']">
        Nome é obrigatório
      </small>
      <small class="p-error" *ngIf="submitted && f['nome'].errors?.['minlength']">
        Nome deve ter no mínimo 3 caracteres
      </small>
    </div>

    <!-- Email -->
    <div class="form-field">
      <span class="p-float-label">
        <input 
          id="email" 
          type="email" 
          pInputText 
          formControlName="email"
          [class.ng-invalid]="submitted && f['email'].errors"
        >
        <label for="email">E-mail</label>
      </span>
      <small class="p-error" *ngIf="submitted && f['email'].errors?.['required']">
        E-mail é obrigatório
      </small>
      <small class="p-error" *ngIf="submitted && f['email'].errors?.['email']">
        E-mail inválido
      </small>
    </div>

    <!-- Senha -->
    <div class="form-field">
      <span class="p-float-label">
        <p-password 
          formControlName="senha"
          [toggleMask]="true"
          [feedback]="true"
          [class.ng-invalid]="submitted && f['senha'].errors"
        ></p-password>
        <label for="senha">Senha</label>
      </span>
      <small class="p-error" *ngIf="submitted && f['senha'].errors?.['required']">
        Senha é obrigatória
      </small>
    </div>

    <!-- Confirmar Senha -->
    <div class="form-field">
      <span class="p-float-label">
        <p-password 
          formControlName="confirmarSenha"
          [toggleMask]="true"
          [feedback]="false"
          [class.ng-invalid]="submitted && (f['confirmarSenha'].errors || form.errors?.['senhasDiferentes'])"
        ></p-password>
        <label for="confirmarSenha">Confirmar Senha</label>
      </span>
      <small class="p-error" *ngIf="submitted && form.errors?.['senhasDiferentes']">
        As senhas não coincidem
      </small>
    </div>

    <!-- Role -->
    <div class="form-field">
      <span class="p-float-label">
        <p-dropdown 
          formControlName="role"
          [options]="[
            {label: 'Usuário', value: 'USER'},
            {label: 'Gerente', value: 'MANAGER'},
            {label: 'Administrador', value: 'ADMIN'}
          ]"
          optionLabel="label"
          optionValue="value"
        ></p-dropdown>
        <label for="role">Perfil</label>
      </span>
    </div>

    <!-- Ativo -->
    <div class="form-field">
      <p-checkbox 
        formControlName="ativo" 
        [binary]="true"
        label="Usuário ativo"
      ></p-checkbox>
    </div>

    <!-- Botões -->
    <div class="form-actions">
      <p-button 
        type="submit"
        label="Salvar" 
        icon="pi pi-check"
        [loading]="loading"
      ></p-button>
      
      <p-button 
        type="button"
        label="Cancelar" 
        icon="pi pi-times"
        styleClass="p-button-secondary"
        (onClick)="form.reset()"
      ></p-button>
    </div>
  </form>
</div>
```

### 6. Tabela com Dados da API

```typescript
import { Component, OnInit } from '@angular/core';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html'
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  loading = false;
  podeEditar = false;
  podeDeletar = false;

  constructor(
    private usuarioService: UsuarioService,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.podeEditar = this.authorizationService.hasPermission('EDIT_USERS');
    this.podeDeletar = this.authorizationService.hasPermission('DELETE_USERS');
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
      },
      error: (erro) => {
        console.error(erro);
        this.loading = false;
      }
    });
  }

  editar(usuario: Usuario) {
    // Navegar para edição
  }

  deletar(usuario: Usuario) {
    if (confirm(`Deseja realmente deletar ${usuario.nome}?`)) {
      this.usuarioService.deletar(usuario.id).subscribe({
        next: () => {
          this.carregar();
        }
      });
    }
  }
}
```

Template:

```html
<div class="lista-container">
  <div class="header">
    <h2>Usuários</h2>
    <p-button 
      *appHasPermission="'CREATE_USERS'"
      label="Novo Usuário" 
      icon="pi pi-plus"
      routerLink="/usuarios/novo"
    ></p-button>
  </div>

  <p-table 
    [value]="usuarios" 
    [loading]="loading"
    [paginator]="true"
    [rows]="10"
    [rowsPerPageOptions]="[10, 25, 50]"
    responsiveLayout="scroll"
  >
    <ng-template pTemplate="header">
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Perfil</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </ng-template>
    
    <ng-template pTemplate="body" let-usuario>
      <tr>
        <td>{{ usuario.nome }}</td>
        <td>{{ usuario.email }}</td>
        <td>{{ usuario.role }}</td>
        <td>
          <p-tag 
            [value]="usuario.ativo ? 'Ativo' : 'Inativo'"
            [severity]="usuario.ativo ? 'success' : 'danger'"
          ></p-tag>
        </td>
        <td>
          <button 
            *ngIf="podeEditar"
            pButton 
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text"
            (click)="editar(usuario)"
          ></button>
          
          <button 
            *ngIf="podeDeletar"
            pButton 
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-danger"
            (click)="deletar(usuario)"
          ></button>
        </td>
      </tr>
    </ng-template>
  </p-table>
</div>
```

### 7. Tratamento de Erros

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Requisição inválida';
          break;
        case 401:
          errorMessage = 'Não autorizado';
          break;
        case 403:
          errorMessage = 'Acesso negado';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        default:
          errorMessage = error.error?.message || errorMessage;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

---

**Estes exemplos cobrem os casos de uso mais comuns no desenvolvimento com Taurus Auth!**
