# Componente Autocomplete

Componente reutilizável de autocomplete com validação integrada, baseado no PrimeNG AutoComplete.

## Características

- ✅ Validação integrada com feedback visual
- ✅ Suporte a templates customizados para itens
- ✅ Ícone de dropdown para mostrar todas as opções
- ✅ Mensagens de erro customizáveis
- ✅ Compatível com ngModel (ControlValueAccessor)
- ✅ Estilo consistente com os demais componentes do sistema

## Uso Básico

```html
<app-autocomplete
  id="perfil"
  label="Perfil"
  [(ngModel)]="perfilSelecionado"
  [suggestions]="perfisFiltrados"
  (completeMethod)="filtrarPerfis($event)"
  field="nome"
  [required]="true"
  [showValidation]="tentouSalvar">
</app-autocomplete>
```

## Propriedades

### Inputs

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `id` | string | auto-gerado | ID do elemento HTML |
| `label` | string | '' | Label do campo |
| `placeholder` | string | 'Digite para buscar...' | Placeholder do input |
| `required` | boolean | false | Se o campo é obrigatório |
| `disabled` | boolean | false | Se o campo está desabilitado |
| `showValidation` | boolean | false | Se deve mostrar validação |
| `errorMessage` | string | '' | Mensagem de erro customizada |
| `field` | string | 'nome' | Campo a ser exibido do objeto |
| `suggestions` | any[] | [] | Lista de sugestões filtradas |
| `emptyMessage` | string | 'Nenhum resultado encontrado' | Mensagem quando não há resultados |
| `itemTemplate` | TemplateRef | null | Template customizado para os itens |

### Outputs

| Evento | Tipo | Descrição |
|--------|------|-----------|
| `completeMethod` | EventEmitter<any> | Emitido quando o usuário digita para filtrar |
| `onSelect` | EventEmitter<any> | Emitido quando um item é selecionado |

## Exemplos

### Com Template Customizado

```html
<app-autocomplete
  id="perfil"
  label="Perfil"
  [(ngModel)]="perfilSelecionado"
  [suggestions]="perfisFiltrados"
  (completeMethod)="filtrarPerfis($event)"
  field="nome"
  [required]="true"
  [showValidation]="tentouSalvar"
  [itemTemplate]="perfilTemplate">
</app-autocomplete>

<ng-template #perfilTemplate let-perfil>
  <div>
    <div><strong>{{perfil.nome}}</strong></div>
    <small>{{perfil.descricao}}</small>
  </div>
</ng-template>
```

### No TypeScript

```typescript
export class MeuComponent {
  perfilSelecionado: PerfilDTO | null = null;
  perfis: PerfilDTO[] = [];
  perfisFiltrados: PerfilDTO[] = [];
  tentouSalvar: boolean = false;

  filtrarPerfis(event: any): void {
    const query = event.query.toLowerCase();
    this.perfisFiltrados = this.perfis.filter(perfil => 
      perfil.nome.toLowerCase().includes(query) || 
      (perfil.descricao && perfil.descricao.toLowerCase().includes(query))
    );
  }
}
```

### Com Mensagem de Erro Customizada

```html
<app-autocomplete
  id="categoria"
  label="Categoria"
  [(ngModel)]="categoriaSelecionada"
  [suggestions]="categoriasFiltradas"
  (completeMethod)="filtrarCategorias($event)"
  [required]="true"
  [showValidation]="tentouSalvar"
  errorMessage="Por favor, selecione uma categoria válida">
</app-autocomplete>
```

## Validação

O componente suporta validação automática quando `required="true"` e `showValidation="true"`:

```typescript
salvar(): void {
  this.tentouSalvar = true; // Ativa a validação visual
  
  if (!this.perfilSelecionado) {
    // Campo inválido
    return;
  }
  
  // Prosseguir com salvamento
}
```

## Estilo

O componente já vem com estilos predefinidos que seguem o padrão do sistema:
- Input com borda de 2px e border-radius de 8px
- Efeito de focus com cor primária
- Ícone de chevron para abrir dropdown
- Items com padding adequado e hover effect
- Separadores entre items
- Mensagem de "nenhum resultado" estilizada

## Acessibilidade

- Labels vinculadas aos inputs via `for`/`id`
- Suporte a navegação por teclado (herança do PrimeNG)
- Feedback visual para estados inválidos
- Mensagens de erro descritivas
