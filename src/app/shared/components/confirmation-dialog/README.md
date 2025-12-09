# Componente de Confirmação

Componente reutilizável para diálogos de confirmação seguindo o padrão do sistema.

## Uso Básico

### 1. Injetar o serviço no componente

```typescript
import { ConfirmationService } from '@shared/services/confirmation.service';

constructor(private confirmationService: ConfirmationService) {}
```

### 2. Exemplos de uso

#### Confirmar exclusão
```typescript
excluirPerfil(perfil: PerfilDTO): void {
  this.confirmationService.confirmDelete(perfil.nome)
    .subscribe(confirmed => {
      if (confirmed) {
        // Executar exclusão
        this.perfilService.excluir(perfil.id).subscribe(...);
      }
    });
}
```

#### Confirmar salvamento
```typescript
salvar(): void {
  this.confirmationService.confirmSave()
    .subscribe(confirmed => {
      if (confirmed) {
        // Executar save
        this.perfilService.salvar(this.perfil).subscribe(...);
      }
    });
}
```

#### Confirmar cancelamento (com alterações não salvas)
```typescript
cancelar(): void {
  if (this.formAlterado) {
    this.confirmationService.confirmCancel()
      .subscribe(confirmed => {
        if (confirmed) {
          this.router.navigate(['/perfis']);
        }
      });
  } else {
    this.router.navigate(['/perfis']);
  }
}
```

#### Confirmação customizada
```typescript
aprovar(): void {
  this.confirmationService.confirmCustom(
    'Aprovar Solicitação',
    'Ao aprovar, o usuário receberá acesso imediato. Deseja continuar?',
    {
      confirmLabel: 'Aprovar',
      severity: 'success',
      icon: 'pi pi-check-circle'
    }
  ).subscribe(confirmed => {
    if (confirmed) {
      // Executar aprovação
    }
  });
}
```

## Métodos Disponíveis

### Métodos Pré-configurados

| Método | Descrição | Uso |
|--------|-----------|-----|
| `confirmSave()` | Confirmação para salvar | Antes de salvar dados |
| `confirmDelete(itemName?)` | Confirmação para excluir | Antes de excluir registro |
| `confirmCreate()` | Confirmação para incluir | Antes de criar registro |
| `confirmCancel()` | Confirmação para cancelar | Ao cancelar com alterações |
| `confirmDiscard()` | Confirmação para descartar | Ao descartar alterações |

### Método Genérico

```typescript
confirmCustom(
  title: string,
  message: string,
  config?: Partial<ConfirmationConfig>
): Observable<boolean>
```

## Tipos de Ação

```typescript
enum ConfirmationAction {
  SALVAR = 'salvar',
  EXCLUIR = 'excluir',
  INCLUIR = 'incluir',
  CANCELAR = 'cancelar',
  DESCARTAR = 'descartar',
  CUSTOM = 'custom'
}
```

## Configuração Completa

```typescript
interface ConfirmationConfig {
  action: ConfirmationAction;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  severity?: 'success' | 'info' | 'warning' | 'danger';
  showCancel?: boolean;
}
```

## Defaults por Ação

### SALVAR
- **Título**: Confirmar Alterações
- **Mensagem**: Deseja salvar as alterações realizadas?
- **Ícone**: pi pi-save
- **Severity**: success

### EXCLUIR
- **Título**: Confirmar Exclusão
- **Mensagem**: Esta ação não poderá ser desfeita. Deseja realmente excluir?
- **Ícone**: pi pi-trash
- **Severity**: danger

### INCLUIR
- **Título**: Confirmar Inclusão
- **Mensagem**: Deseja incluir este novo registro?
- **Ícone**: pi pi-plus-circle
- **Severity**: success

### CANCELAR
- **Título**: Cancelar Operação
- **Mensagem**: Existem alterações não salvas. Deseja realmente cancelar?
- **Ícone**: pi pi-exclamation-triangle
- **Severity**: warning

### DESCARTAR
- **Título**: Descartar Alterações
- **Mensagem**: As alterações realizadas serão perdidas. Deseja continuar?
- **Ícone**: pi pi-exclamation-triangle
- **Severity**: warning
