# Upload Arquivos Component

Componente reutilizável para upload de múltiplos arquivos com drag and drop, validações e preview.

## Características

- ✅ Upload de múltiplos arquivos
- ✅ Drag and drop
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho
- ✅ Progress bar individual por arquivo
- ✅ Preview da lista de arquivos
- ✅ Ícones por tipo de arquivo (PDF, Word, Excel, imagens, etc.)
- ✅ Suporte a ControlValueAccessor (ngModel)
- ✅ Visual responsivo e consistente com o sistema
- ✅ Feedback visual durante drag
- ✅ Remoção individual ou em lote

## Uso Básico

```html
<app-upload-arquivos
  id="documentos"
  label="Documentos"
  [(ngModel)]="arquivos"
  [multiple]="true"
  [accept]="'.pdf,.doc,.docx'"
  [maxFileSize]="10485760"
  (onSelect)="onArquivosSelecionados($event)">
</app-upload-arquivos>
```

## Inputs

| Property | Type | Default | Descrição |
|----------|------|---------|-----------|
| `id` | string | auto-gerado | ID do input |
| `label` | string | 'Arquivos' | Label do componente |
| `placeholder` | string | 'Clique para selecionar...' | Texto da dropzone |
| `multiple` | boolean | true | Permite múltiplos arquivos |
| `accept` | string | '*' | Tipos aceitos (.pdf, .doc, etc) |
| `maxFileSize` | number | 10485760 | Tamanho máximo em bytes (10MB) |
| `disabled` | boolean | false | Desabilita o componente |
| `required` | boolean | false | Campo obrigatório |
| `showValidation` | boolean | false | Mostra validação |
| `autoUpload` | boolean | false | Upload automático ao selecionar |
| `showPreview` | boolean | true | Mostra lista de arquivos |
| `chooseLabel` | string | 'Adicionar Arquivo' | Label do botão |
| `chooseIcon` | string | 'pi pi-plus' | Ícone do botão |
| `errorMessage` | string | '' | Mensagem de erro customizada |

## Outputs

| Event | Payload | Descrição |
|-------|---------|-----------|
| `onSelect` | File[] | Disparado ao selecionar arquivos |
| `onChange` | File[] | Disparado quando a lista muda |
| `onUpload` | ArquivoUpload | Disparado para upload (autoUpload) |
| `onRemove` | ArquivoUpload | Disparado ao remover arquivo |

## Exemplos de Uso

### 1. Upload Simples de PDFs

```html
<app-upload-arquivos
  label="Documentos PDF"
  [(ngModel)]="pdfs"
  [accept]="'.pdf'"
  [maxFileSize]="5242880"
  (onSelect)="salvarPdfs($event)">
</app-upload-arquivos>
```

```typescript
pdfs: File[] = [];

salvarPdfs(files: File[]): void {
  console.log('PDFs selecionados:', files);
}
```

### 2. Upload com Auto-upload

```html
<app-upload-arquivos
  label="Fotos"
  [accept]="'.jpg,.jpeg,.png'"
  [autoUpload]="true"
  (onUpload)="uploadFoto($event)">
</app-upload-arquivos>
```

```typescript
uploadFoto(arquivo: ArquivoUpload): void {
  const formData = new FormData();
  formData.append('file', arquivo.arquivo);
  
  this.service.upload(formData).subscribe({
    next: (response) => {
      arquivo.url = response.url;
      arquivo.uploading = false;
      arquivo.progress = 100;
    },
    error: () => {
      arquivo.uploading = false;
    }
  });
}
```

### 3. Upload Único (sem múltiplos)

```html
<app-upload-arquivos
  label="Contrato"
  [multiple]="false"
  [accept]="'.pdf'"
  [required]="true"
  [showValidation]="tentouSalvar"
  [(ngModel)]="contrato">
</app-upload-arquivos>
```

### 4. Upload Desabilitado com Mensagem

```html
<div class="info-message" *ngIf="!imobiliariaId">
  <i class="pi pi-info-circle"></i>
  <div class="info-content">
    <p>Salve a imobiliária primeiro para adicionar documentos</p>
  </div>
</div>

<app-upload-arquivos
  label="Documentos"
  [disabled]="!imobiliariaId"
  (onSelect)="enviarDocumentos($event)">
</app-upload-arquivos>
```

### 5. Validação de Campos Obrigatórios

```typescript
// No BaseFormComponent
getCamposObrigatorios(): { id: string; valor: any; label?: string }[] {
  return [
    { id: 'nome', valor: this.nome, label: 'Nome' },
    { id: 'documentos', valor: this.arquivos?.length > 0, label: 'Documentos' }
  ];
}
```

## Interface ArquivoUpload

```typescript
interface ArquivoUpload {
  arquivo: File;           // Objeto File do JavaScript
  nome: string;            // Nome do arquivo
  tamanho: number;         // Tamanho em bytes
  url?: string;            // URL após upload (opcional)
  uploading?: boolean;     // Estado de upload
  progress?: number;       // Progresso 0-100
}
```

## Tipos de Arquivo Suportados

O componente detecta automaticamente o ícone baseado na extensão:

- **PDF**: `pi-file-pdf`
- **Word**: `pi-file-word` (.doc, .docx)
- **Excel**: `pi-file-excel` (.xls, .xlsx)
- **Imagens**: `pi-image` (.jpg, .jpeg, .png, .gif)
- **Compactados**: `pi-folder` (.zip, .rar)
- **Outros**: `pi-file`

## Validações

### Tamanho Máximo
```html
[maxFileSize]="10485760"  <!-- 10MB -->
```

### Tipos Aceitos
```html
[accept]="'.pdf,.doc,.docx,.xls,.xlsx'"
```

### Campo Obrigatório
```html
[required]="true"
[showValidation]="tentouSalvar"
```

## Styling

O componente segue o padrão visual do sistema:
- Cores consistentes com tema
- Transições suaves
- Feedback visual em hover/drag
- Responsivo para mobile
- Ícones PrimeNG
- Progress bars do PrimeNG

## Dependências

- PrimeNG (ProgressBarModule)
- Angular FormsModule
- PrimeNG Tooltip

## Notas Importantes

1. **ControlValueAccessor**: O componente suporta `[(ngModel)]` e pode ser usado em formulários reativos
2. **Drag and Drop**: Funciona em navegadores modernos
3. **Validações**: Acontecem no client-side antes do upload
4. **Progress**: Use `arquivo.progress` para atualizar o progresso durante upload
5. **Mobile**: Interface touch-friendly e responsiva
