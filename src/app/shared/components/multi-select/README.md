# MultiSelectComponent

Componente customizado de seleção múltipla (multiselect) com float label, seguindo o padrão dos componentes do sistema Taurus.

## Uso Básico

```html
<app-multi-select
  id="empreendimentos"
  label="Empreendimentos"
  [(ngModel)]="empreendimentosSelecionados"
  [options]="empreendimentosOptions"
  optionLabel="nome"
  placeholder="Selecione os empreendimentos">
</app-multi-select>
```

## Propriedades

### Básicas
| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `id` | `string` | (gerado) | ID único do campo |
| `label` | `string` | `''` | Label do campo (suporta float label) |
| `placeholder` | `string` | `'Selecione'` | Placeholder do campo |
| `required` | `boolean` | `false` | Se o campo é obrigatório |
| `disabled` | `boolean` | `false` | Se o campo está desabilitado |
| `showValidation` | `boolean` | `false` | Exibir validação de erro |
| `errorMessage` | `string` | `''` | Mensagem de erro customizada |

### Opções
| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `options` | `any[]` | `[]` | Array de opções para seleção |
| `optionLabel` | `string` | `'label'` | Campo do objeto usado como label |
| `optionValue` | `string` | `''` | Campo do objeto usado como value (vazio = objeto inteiro) |

**⚠️ Importante sobre `optionValue`:** 
- Se **não especificado**, o componente trabalha com o **objeto inteiro**
- Se **especificado**, o value será apenas o campo informado (ex: `'id'`, `'codigo'`)
- Use quando precisar trabalhar com valores primitivos ao invés de objetos
- Exemplo: `optionValue="codEmpreendimento"` retorna array de números ao invés de objetos

### Filtro
| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `filter` | `boolean` | `true` | Habilita filtro de busca |
| `filterBy` | `string` | `optionLabel` | Campo usado para filtrar |
| `emptyMessage` | `string` | `'Nenhum resultado encontrado'` | Mensagem quando não há opções |
| `emptyFilterMessage` | `string` | `'Nenhum resultado encontrado'` | Mensagem quando filtro não retorna resultados |

### Display
| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `display` | `string` | `'chip'` | Modo de exibição (`'chip'` ou `'comma'`) |
| `showClear` | `boolean` | `true` | Exibir botão de limpar |
| `maxSelectedLabels` | `number` | `3` | Máximo de labels visíveis antes de mostrar contador |
| `selectedItemsLabel` | `string` | `'{0} itens selecionados'` | Label do contador de itens |

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `onChange` | `any` | Emitido quando a seleção muda |

## Exemplos

### Exemplo com Objetos Complexos

```typescript
// Component
empreendimentosOptions: Empreendimento[] = [
  { id: 1, nome: 'Empreendimento A', codEmpreendimento: 214 },
  { id: 2, nome: 'Empreendimento B', codEmpreendimento: 212 }
];
empreendimentosSelecionados: Empreendimento[] = [];

onEmpreendimentosChange(event: any): void {
  console.log('Selecionados:', event.value);
}
```

```html
<!-- Template -->
<app-multi-select
  id="empreendimentos"
  label="Empreendimentos"
  [(ngModel)]="empreendimentosSelecionados"
  [options]="empreendimentosOptions"
  optionLabel="nome"
  placeholder="Selecione os empreendimentos"
  [filter]="true"
  filterBy="nome"
  display="chip"
  [maxSelectedLabels]="3"
  selectedItemsLabel="{0} empreendimentos selecionados"
  (onChange)="onEmpreendimentosChange($event)">
</app-multi-select>
```

### Exemplo com Valores Simples

```typescript
// Component
categoriasOptions = [
  { label: 'Categoria A', value: 'A' },
  { label: 'Categoria B', value: 'B' },
  { label: 'Categoria C', value: 'C' }
];
categoriasSelecionadas: string[] = [];
```

```html
<!-- Template -->
<app-multi-select
  id="categorias"
  label="Categorias"
  [(ngModel)]="categoriasSelecionadas"
  [options]="categoriasOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Selecione as categorias">
</app-multi-select>
```

### Exemplo com Validação

```typescript
// Component
tentouSalvar = false;

salvar(): void {
  this.tentouSalvar = true;
  
  if (this.empreendimentosSelecionados.length === 0) {
    // Mostrar mensagem de erro
    return;
  }
  
  // Prosseguir com salvamento
}
```

```html
<!-- Template -->
<app-multi-select
  id="empreendimentos"
  label="Empreendimentos"
  [(ngModel)]="empreendimentosSelecionados"
  [options]="empreendimentosOptions"
  optionLabel="nome"
  [required]="true"
  [showValidation]="tentouSalvar"
  errorMessage="Selecione pelo menos um empreendimento">
</app-multi-select>
```

### Exemplo Modo Comma (Separado por Vírgula)

```html
<app-multi-select
  id="tags"
  label="Tags"
  [(ngModel)]="tagsSelecionadas"
  [options]="tagsOptions"
  display="comma"
  placeholder="Selecione as tags">
</app-multi-select>
```

## Características

✅ **Float Label**: Label flutua para cima quando há valor selecionado  
✅ **Validação**: Suporta validação de campo obrigatório  
✅ **Filtro**: Busca integrada nas opções  
✅ **Chips**: Exibição visual dos itens selecionados  
✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela  
✅ **Acessibilidade**: Suporte a navegação por teclado  
✅ **ControlValueAccessor**: Compatível com Angular Forms  

## Integração com PrimeNG

Este componente encapsula o `p-multiSelect` do PrimeNG, adicionando:
- Float label automático
- Validação integrada
- Estilos consistentes com o sistema
- API simplificada e padronizada

## Observações

- O componente usa `ControlValueAccessor`, sendo compatível com `ngModel` e `FormControl`
- O valor retornado é sempre um array (mesmo vazio quando nada está selecionado)
- Para objetos complexos, certifique-se de que o `optionLabel` aponta para uma propriedade válida
- O `maxSelectedLabels` controla quantos chips são exibidos antes de mostrar "X itens selecionados"
- Use `display="comma"` para exibição compacta em vez de chips
