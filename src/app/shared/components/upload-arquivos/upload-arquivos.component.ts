import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MessageService } from 'primeng/api';

/**
 * Interface para arquivo no componente
 */
export interface ArquivoUpload {
  arquivo: File;
  nome: string;
  tamanho: number;
  url?: string;
  uploading?: boolean;
  progress?: number;
}

/**
 * Componente reutilizável para upload de múltiplos arquivos
 * 
 * Funcionalidades:
 * - Upload de múltiplos arquivos
 * - Drag and drop
 * - Validação de tipo e tamanho
 * - Preview de arquivos
 * - Remoção de arquivos
 * - Progress bar por arquivo
 * - Suporte a ControlValueAccessor
 * 
 * @example
 * <app-upload-arquivos
 *   id="documentos"
 *   label="Documentos"
 *   [(ngModel)]="arquivos"
 *   [multiple]="true"
 *   [accept]="'.pdf,.doc,.docx'"
 *   [maxFileSize]="10485760"
 *   [disabled]="false"
 *   (onUpload)="salvarArquivo($event)"
 *   (onRemove)="removerArquivo($event)">
 * </app-upload-arquivos>
 */
@Component({
  selector: 'app-upload-arquivos',
  templateUrl: './upload-arquivos.component.html',
  styleUrls: ['./upload-arquivos.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UploadArquivosComponent),
      multi: true
    }
  ]
})
export class UploadArquivosComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = 'Arquivos';
  @Input() placeholder: string = 'Clique para selecionar ou arraste arquivos aqui';
  @Input() multiple: boolean = true;
  @Input() accept: string = '*';
  @Input() maxFileSize: number = 10485760; // 10MB por padrão
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() required: boolean = false;
  @Input() errorMessage: string = '';
  @Input() autoUpload: boolean = false; // Se true, faz upload automaticamente ao selecionar
  @Input() showPreview: boolean = true; // Mostra lista de arquivos selecionados
  @Input() chooseLabel: string = 'Adicionar Arquivo';
  @Input() chooseIcon: string = 'pi pi-plus';
  
  @Output() onUpload = new EventEmitter<ArquivoUpload>();
  @Output() onRemove = new EventEmitter<ArquivoUpload>();
  @Output() onSelect = new EventEmitter<File[]>();
  @Output() onChange = new EventEmitter<File[]>();

  arquivos: ArquivoUpload[] = [];
  isDragging: boolean = false;
  touched: boolean = false;

  private onChangeCallback: (value: any) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  constructor(private messageService: MessageService) {}

  writeValue(value: any): void {
    if (value) {
      this.arquivos = value;
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragging = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processarArquivos(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processarArquivos(Array.from(input.files));
      input.value = ''; // Limpa input para permitir selecionar o mesmo arquivo novamente
    }
  }

  private processarArquivos(files: File[]): void {
    const arquivosValidos: File[] = [];

    for (const file of files) {
      // Validar tamanho
      if (file.size > this.maxFileSize) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: `Arquivo "${file.name}" excede o tamanho máximo de ${this.formatarTamanho(this.maxFileSize)}`
        });
        continue;
      }

      // Validar tipo (se accept não for *)
      if (this.accept !== '*') {
        const extensoesAceitas = this.accept.split(',').map(ext => ext.trim().toLowerCase());
        const extensaoArquivo = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!extensoesAceitas.includes(extensaoArquivo)) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: `Tipo de arquivo "${extensaoArquivo}" não permitido`
          });
          continue;
        }
      }

      arquivosValidos.push(file);
    }

    if (arquivosValidos.length > 0) {
      this.adicionarArquivos(arquivosValidos);
    }
  }

  private adicionarArquivos(files: File[]): void {
    const novosArquivos: ArquivoUpload[] = files.map(file => ({
      arquivo: file,
      nome: file.name,
      tamanho: file.size,
      uploading: false,
      progress: 0
    }));

    if (!this.multiple) {
      this.arquivos = novosArquivos;
    } else {
      this.arquivos = [...this.arquivos, ...novosArquivos];
    }

    this.touched = true;
    this.onTouchedCallback();
    this.onChangeCallback(this.arquivos);
    this.onChange.emit(files);
    this.onSelect.emit(files);

    if (this.autoUpload) {
      novosArquivos.forEach(arquivo => this.uploadArquivo(arquivo));
    }
  }

  uploadArquivo(arquivo: ArquivoUpload): void {
    arquivo.uploading = true;
    arquivo.progress = 0;
    this.onUpload.emit(arquivo);
  }

  removerArquivo(arquivo: ArquivoUpload): void {
    const index = this.arquivos.indexOf(arquivo);
    if (index > -1) {
      this.arquivos.splice(index, 1);
      this.onChangeCallback(this.arquivos);
      this.onChange.emit(this.arquivos.map(a => a.arquivo));
      this.onRemove.emit(arquivo);
    }
  }

  limparArquivos(): void {
    this.arquivos = [];
    this.onChangeCallback(this.arquivos);
    this.onChange.emit([]);
  }

  formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getIconeArquivo(nomeArquivo: string): string {
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
    
    switch (extensao) {
      case 'pdf':
        return 'pi pi-file-pdf';
      case 'doc':
      case 'docx':
        return 'pi pi-file-word';
      case 'xls':
      case 'xlsx':
        return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'pi pi-image';
      case 'zip':
      case 'rar':
        return 'pi pi-folder';
      default:
        return 'pi pi-file';
    }
  }

  get inputId(): string {
    return this.id || `upload-arquivos-${Math.random().toString(36).substr(2, 9)}`;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    return this.showValidation && this.required && this.arquivos.length === 0 && this.touched;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) {
      return this.errorMessage;
    }
    return this.required ? `${this.label} é obrigatório` : '';
  }

  get acceptInfo(): string {
    if (this.accept === '*') {
      return 'Todos os tipos de arquivo';
    }
    return this.accept.replace(/\./g, '').toUpperCase();
  }
}
