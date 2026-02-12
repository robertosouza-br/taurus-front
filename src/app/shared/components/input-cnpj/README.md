# InputCnpjComponent

Componente de input customizado para CNPJ com máscara e validação automática.

## Características

- ✅ **Máscara automática**: Formata para `00.000.000/0000-00` automaticamente
- ✅ **Validação de CNPJ**: Valida dígitos verificadores segundo regras da Receita Federal
- ✅ **Float Label**: Label animado com padrão PrimeNG
- ✅ **ControlValueAccessor**: Funciona com `[(ngModel)]` e Reactive Forms
- ✅ **Validação dupla**: Exibe erros ao tocar no campo OU quando `showValidation` está ativo
- ✅ **Estados visuais**: Suporte para disabled, readonly, required
- ✅ **Mensagens personalizadas**: Suporte para mensagens de erro customizadas

## Uso Básico

### Template-driven Forms (ngModel)
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ"
  [(ngModel)]="cnpj"
  [required]="true"
  [showValidation]="tentouSalvar"
  placeholder="00.000.000/0000-00">
</app-input-cnpj>
```

### Reactive Forms
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ da Empresa"
  formControlName="cnpj"
  [required]="true">
</app-input-cnpj>
```

## Inputs

| Propriedade | Tipo | Default | Descrição |
|-------------|------|---------|-----------|
| `id` | string | auto-gerado | ID único do input |
| `label` | string | 'CNPJ' | Label do campo |
| `placeholder` | string | '' | Placeholder do input |
| `required` | boolean | false | Se o campo é obrigatório |
| `disabled` | boolean | false | Se o campo está desabilitado |
| `readonly` | boolean | false | Se o campo é somente leitura |
| `styleClass` | string | '' | Classes CSS adicionais |
| `showValidation` | boolean | false | Força exibição de validação |
| `errorMessage` | string | '' | Mensagem de erro customizada |

## Validações

### Validação Automática
O componente valida:
1. **Campo obrigatório**: Se `required=true` e campo vazio
2. **CNPJ inválido**: Valida dígitos verificadores
3. **Formato**: Aceita apenas dígitos (máscara é automática)
4. **Sequências**: Rejeita CNPJs com todos dígitos iguais (00.000.000/0000-00, etc)

### Algoritmo de Validação
Implementa o algoritmo oficial da Receita Federal:
- Valida 14 dígitos
- Calcula e verifica dois dígitos verificadores
- Rejeita CNPJs conhecidos como inválidos

## Exemplos

### CNPJ Obrigatório
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ"
  [(ngModel)]="cnpj"
  [required]="true"
  [showValidation]="tentouSalvar">
</app-input-cnpj>
```

### CNPJ Opcional
```html
<app-input-cnpj
  id="cnpjSecundario"
  label="CNPJ Secundário (Opcional)"
  [(ngModel)]="cnpjSecundario">
</app-input-cnpj>
```

### Desabilitado
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ"
  [(ngModel)]="cnpj"
  [disabled]="true">
</app-input-cnpj>
```

### Somente Leitura
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ"
  [(ngModel)]="cnpj"
  [readonly]="true">
</app-input-cnpj>
```

### Com Mensagem de Erro Customizada
```html
<app-input-cnpj
  id="cnpj"
  label="CNPJ"
  [(ngModel)]="cnpj"
  [required]="true"
  [showValidation]="true"
  errorMessage="Por favor, informe um CNPJ válido da empresa">
</app-input-cnpj>
```

## Comportamento

### Formato de Entrada
- **Usuário digita**: `12345678000190`
- **Componente exibe**: `12.345.678/0001-90`
- **Modelo recebe**: `12345678000190` (sem formatação)

### Validação de Exibição
A validação é exibida quando:
1. Campo foi tocado (`touched=true`) E está inválido
2. OU `showValidation=true` E está inválido

Isso permite validação em dois momentos:
- **Durante digitação**: Usuário vê erro ao sair do campo inválido
- **Ao salvar**: `showValidation=true` exibe todos os erros

## Mensagens de Erro Padrão

- **Campo obrigatório vazio**: "CNPJ é obrigatório"
- **CNPJ inválido**: "CNPJ inválido"
- **Customizada**: Use `errorMessage` para sobrescrever

## Estilização

### Classes CSS Aplicadas
- `.input-cnpj-container`: Container principal
- `.p-float-label`: Wrapper do float label
- `.p-inputtext`: Input do PrimeNG
- `.ng-invalid.ng-dirty`: Quando campo está inválido
- `.p-error`: Mensagem de erro

### Customização
```html
<app-input-cnpj
  styleClass="minha-classe-custom"
  ...>
</app-input-cnpj>
```

```scss
.minha-classe-custom {
  // Seus estilos customizados
}
```

## Integração com Formulários

### Template-driven Forms
```typescript
export class MeuComponent {
  cnpj = '';
  tentouSalvar = false;

  salvar() {
    this.tentouSalvar = true;
    
    if (this.validarCNPJ(this.cnpj)) {
      // CNPJ válido, prosseguir
    }
  }
}
```

### Reactive Forms
```typescript
export class MeuComponent implements OnInit {
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      cnpj: ['', [Validators.required, this.cnpjValidator]]
    });
  }

  cnpjValidator(control: AbstractControl): ValidationErrors | null {
    const cnpj = control.value;
    // Implementar validação customizada se necessário
    return null;
  }
}
```

## Notas Importantes

1. **Valor sem formatação**: O componente sempre envia o CNPJ sem formatação (apenas dígitos) para o modelo
2. **Máscara automática**: A formatação é apenas visual, facilitando digitação
3. **14 caracteres**: Limita automaticamente a 14 dígitos
4. **Compatibilidade**: Funciona com ngModel e Reactive Forms
5. **Acessibilidade**: IDs únicos garantem associação correta entre label e input

## Exemplo Completo

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-cadastro-empresa',
  template: `
    <form>
      <app-input-cnpj
        id="cnpj"
        label="CNPJ da Empresa"
        [(ngModel)]="empresa.cnpj"
        [required]="true"
        [showValidation]="tentouSalvar"
        placeholder="00.000.000/0000-00">
      </app-input-cnpj>

      <button type="button" (click)="salvar()">Salvar</button>
    </form>
  `
})
export class CadastroEmpresaComponent {
  empresa = {
    cnpj: ''
  };
  tentouSalvar = false;

  salvar() {
    this.tentouSalvar = true;
    
    if (this.empresa.cnpj && this.empresa.cnpj.length === 14) {
      console.log('CNPJ válido:', this.empresa.cnpj);
      // Prosseguir com o salvamento
    }
  }
}
```
