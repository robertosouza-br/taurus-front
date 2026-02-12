# InputCepComponent

Componente de input customizado para CEP com máscara automática e validação.

## Características

- ✅ **Máscara automática**: Formata para `00000-000` automaticamente
- ✅ **Validação de CEP**: Valida formato e rejeita sequências inválidas
- ✅ **Float Label**: Label animado com padrão PrimeNG
- ✅ **ControlValueAccessor**: Funciona com `[(ngModel)]` e Reactive Forms
- ✅ **Validação dupla**: Exibe erros ao tocar no campo OU quando `showValidation` está ativo
- ✅ **Estados visuais**: Suporte para disabled, readonly, required
- ✅ **Evento onBlur**: Emite evento para integração com API ViaCEP
- ✅ **Mensagens personalizadas**: Suporte para mensagens de erro customizadas

## Uso Básico

### Template-driven Forms (ngModel)
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="cep"
  [required]="true"
  [showValidation]="tentouSalvar"
  (onBlurEvent)="buscarCep()"
  placeholder="00000-000">
</app-input-cep>
```

### Reactive Forms
```html
<app-input-cep
  id="cep"
  label="CEP"
  formControlName="cep"
  [required]="true"
  (onBlurEvent)="buscarEndereco()">
</app-input-cep>
```

## Inputs

| Propriedade | Tipo | Default | Descrição |
|-------------|------|---------|-----------|
| `id` | string | auto-gerado | ID único do input |
| `label` | string | 'CEP' | Label do campo |
| `placeholder` | string | '' | Placeholder do input |
| `required` | boolean | false | Se o campo é obrigatório |
| `disabled` | boolean | false | Se o campo está desabilitado |
| `readonly` | boolean | false | Se o campo é somente leitura |
| `styleClass` | string | '' | Classes CSS adicionais |
| `showValidation` | boolean | false | Força exibição de validação |
| `errorMessage` | string | '' | Mensagem de erro customizada |

## Outputs

| Evento | Descrição |
|--------|-----------|
| `onBlurEvent` | Emitido quando o campo perde o foco (útil para buscar endereço na API) |

## Validações

### Validação Automática
O componente valida:
1. **Campo obrigatório**: Se `required=true` e campo vazio
2. **CEP inválido**: Valida formato (8 dígitos)
3. **Formato**: Aceita apenas dígitos (máscara é automática)
4. **Sequências**: Rejeita CEPs com todos dígitos iguais (00000-000, 11111-111, etc)
5. **CEP zerado**: Rejeita 00000-000

## Exemplos

### CEP Obrigatório
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="cep"
  [required]="true"
  [showValidation]="tentouSalvar">
</app-input-cep>
```

### CEP com Busca Automática (ViaCEP)
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="endereco.cep"
  [required]="true"
  (onBlurEvent)="buscarCep()">
</app-input-cep>
```

```typescript
buscarCep(): void {
  const cepSemMascara = this.endereco.cep.replace(/\D/g, '');
  
  if (cepSemMascara.length !== 8) return;

  fetch(`https://viacep.com.br/ws/${cepSemMascara}/json/`)
    .then(response => response.json())
    .then(data => {
      if (!data.erro) {
        this.endereco.logradouro = data.logradouro;
        this.endereco.bairro = data.bairro;
        this.endereco.cidade = data.localidade;
        this.endereco.uf = data.uf;
      }
    });
}
```

### Desabilitado
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="cep"
  [disabled]="true">
</app-input-cep>
```

### Somente Leitura
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="cep"
  [readonly]="true">
</app-input-cep>
```

### Com Mensagem de Erro Customizada
```html
<app-input-cep
  id="cep"
  label="CEP"
  [(ngModel)]="cep"
  [required]="true"
  [showValidation]="true"
  errorMessage="Por favor, informe um CEP válido">
</app-input-cep>
```

## Comportamento

### Formato de Entrada
- **Usuário digita**: `12345678`
- **Componente exibe**: `12345-678`
- **Modelo recebe**: `12345678` (sem formatação)

### Validação de Exibição
A validação é exibida quando:
1. Campo foi tocado (`touched=true`) E está inválido
2. OU `showValidation=true` E está inválido

Isso permite validação em dois momentos:
- **Durante digitação**: Usuário vê erro ao sair do campo inválido
- **Ao salvar**: `showValidation=true` exibe todos os erros

## Mensagens de Erro Padrão

- **Campo obrigatório vazio**: "CEP é obrigatório"
- **CEP inválido**: "CEP inválido"
- **Customizada**: Use `errorMessage` para sobrescrever

## Integração com API ViaCEP

O componente emite evento `onBlurEvent` que pode ser usado para buscar endereço automaticamente:

```typescript
export class EnderecoFormComponent {
  cep = '';
  logradouro = '';
  bairro = '';
  cidade = '';
  uf = '';
  buscandoCep = false;

  buscarCep(): void {
    const cepLimpo = this.cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;

    this.buscandoCep = true;

    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'CEP não encontrado'
          });
        } else {
          this.logradouro = data.logradouro;
          this.bairro = data.bairro;
          this.cidade = data.localidade;
          this.uf = data.uf;
        }
        this.buscandoCep = false;
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar CEP'
        });
        this.buscandoCep = false;
      });
  }
}
```

## Usando o Pipe

Para formatar CEP em templates sem componente:

```html
<!-- Formato: 12345678 → 12345-678 -->
<p>CEP: {{ endereco.cep | cep }}</p>
```

## Estilização

### Classes CSS Aplicadas
- `.input-cep-container`: Container principal
- `.p-float-label`: Wrapper do float label
- `.p-inputtext`: Input do PrimeNG
- `.ng-invalid.ng-dirty`: Quando campo está inválido
- `.p-error`: Mensagem de erro

### Customização
```html
<app-input-cep
  styleClass="minha-classe-custom"
  ...>
</app-input-cep>
```

```scss
.minha-classe-custom {
  // Seus estilos customizados
}
```

## Notas Importantes

1. **Valor sem formatação**: O componente sempre envia o CEP sem formatação (apenas dígitos) para o modelo
2. **Máscara automática**: A formatação é apenas visual, facilitando digitação
3. **8 caracteres**: Limita automaticamente a 8 dígitos
4. **Compatibilidade**: Funciona com ngModel e Reactive Forms
5. **Evento onBlur**: Use para integração com APIs de busca de endereço
6. **Acessibilidade**: IDs únicos garantem associação correta entre label e input

## Exemplo Completo

```typescript
import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cadastro-endereco',
  template: `
    <form>
      <app-input-cep
        id="cep"
        label="CEP"
        [(ngModel)]="endereco.cep"
        [required]="true"
        [showValidation]="tentouSalvar"
        (onBlurEvent)="buscarCep()"
        placeholder="00000-000">
      </app-input-cep>

      <app-input-text
        label="Logradouro"
        [(ngModel)]="endereco.logradouro"
        [required]="true">
      </app-input-text>

      <button type="button" (click)="salvar()">Salvar</button>
    </form>
  `
})
export class CadastroEnderecoComponent {
  endereco = {
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: ''
  };
  tentouSalvar = false;
  buscandoCep = false;

  constructor(private messageService: MessageService) {}

  buscarCep(): void {
    const cepLimpo = this.endereco.cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;

    this.buscandoCep = true;

    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      .then(response => response.json())
      .then(data => {
        if (!data.erro) {
          this.endereco.logradouro = data.logradouro;
          this.endereco.bairro = data.bairro;
          this.endereco.cidade = data.localidade;
          this.endereco.uf = data.uf;
        }
        this.buscandoCep = false;
      })
      .catch(() => {
        this.buscandoCep = false;
      });
  }

  salvar() {
    this.tentouSalvar = true;
    
    if (this.endereco.cep && this.endereco.cep.length === 8) {
      console.log('CEP válido:', this.endereco.cep);
      // Prosseguir com o salvamento
    }
  }
}
```
