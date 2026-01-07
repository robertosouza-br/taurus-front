import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { interval, Subscription } from 'rxjs';
import { ImageCroppedEvent, LoadedImage, ImageTransform } from 'ngx-image-cropper';

/**
 * Interface para resposta de foto
 */
export interface FotoResponse {
  url: string;
  expiresIn: number;
}

/**
 * Componente reutilizável para upload e gerenciamento de foto do usuário
 * 
 * Funcionalidades:
 * - Upload de foto (JPG, JPEG, PNG - máx 5MB)
 * - Exibição com renovação automática de URL
 * - Remoção de foto
 * - Preview em tempo real
 * - Validações automáticas
 * 
 * @example
 * <!-- Para edição de usuário -->
 * <app-upload-foto
 *   [usuarioId]="usuario.id"
 *   [uploadCallback]="uploadFotoCallback.bind(this)"
 *   [obterUrlCallback]="obterUrlCallback.bind(this)"
 *   [removerCallback]="removerCallback.bind(this)">
 * </app-upload-foto>
 * 
 * <!-- Para meus dados (sem usuarioId) -->
 * <app-upload-foto
 *   [uploadCallback]="uploadFotoCallback.bind(this)"
 *   [obterUrlCallback]="obterUrlCallback.bind(this)"
 *   [removerCallback]="removerCallback.bind(this)">
 * </app-upload-foto>
 */
@Component({
  selector: 'app-upload-foto',
  templateUrl: './upload-foto.component.html',
  styleUrls: ['./upload-foto.component.scss']
})
export class UploadFotoComponent implements OnInit, OnDestroy {
  @Input() uploadCallback!: (arquivo: File) => Promise<any>;
  @Input() obterUrlCallback!: () => Promise<FotoResponse>;
  @Input() removerCallback!: () => Promise<any>;
  @Input() tamanho: 'pequeno' | 'medio' | 'grande' = 'medio';
  @Input() somenteLeitura = false;
  
  @Output() fotoAlterada = new EventEmitter<void>();

  fotoUrl: string | null = null;
  carregando = false;
  enviando = false;
  
  // Editor de imagem
  exibirEditor = false;
  imagemParaEditar: string = '';
  imagemEditada: Blob | null = null;
  zoom = 1;
  transformacao: ImageTransform = {};
  
  private fotoCache = {
    url: null as string | null,
    expiraEm: null as number | null
  };
  
  private renovacaoSubscription?: Subscription;

  // Configurações de tamanho
  tamanhos = {
    pequeno: { width: '80px', height: '80px' },
    medio: { width: '150px', height: '150px' },
    grande: { width: '200px', height: '200px' }
  };

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregarFoto();
    this.iniciarRenovacaoAutomatica();
  }

  ngOnDestroy(): void {
    if (this.renovacaoSubscription) {
      this.renovacaoSubscription.unsubscribe();
    }
  }

  /**
   * Carrega a foto do usuário com cache inteligente
   */
  async carregarFoto(): Promise<void> {
    const agora = Date.now();
    
    // Verificar se URL em cache ainda é válida
    if (this.fotoCache.url && this.fotoCache.expiraEm && agora < this.fotoCache.expiraEm) {
      this.fotoUrl = this.fotoCache.url;
      return;
    }
    
    this.carregando = true;
    
    try {
      const response = await this.obterUrlCallback();
      
      // Armazenar em cache com margem de segurança (renovar 30s antes de expirar)
      this.fotoCache = {
        url: response.url,
        expiraEm: agora + ((response.expiresIn - 30) * 1000)
      };
      
      this.fotoUrl = response.url;
    } catch (error) {
      console.error('Erro ao carregar foto:', error);
      // Não exibe mensagem de erro - foto padrão será usada
    } finally {
      this.carregando = false;
    }
  }

  /**
   * Inicia renovação automática da URL a cada 4 minutos
   */
  private iniciarRenovacaoAutomatica(): void {
    // Renovar a cada 4 minutos (antes dos 5 minutos de expiração)
    this.renovacaoSubscription = interval(4 * 60 * 1000).subscribe(() => {
      this.carregarFoto();
    });
  }

  /**
   * Manipula seleção de arquivo
   */
  async onFileSelect(event: any): Promise<void> {
    console.log('onFileSelect chamado', event);
    const arquivo = event.target.files?.[0];
    console.log('Arquivo selecionado:', arquivo);
    
    if (!arquivo) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    // Validações iniciais
    if (!this.validarArquivoInicial(arquivo)) {
      event.target.value = '';
      return;
    }

    console.log('Iniciando leitura do arquivo...');
    
    // Carregar imagem no editor
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('Arquivo carregado:', e.target?.result);
      this.imagemParaEditar = e.target?.result as string;
      console.log('imagemParaEditar definida:', this.imagemParaEditar.substring(0, 50));
      this.exibirEditor = true;
      console.log('Editor exibido:', this.exibirEditor);
    };
    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar a imagem'
      });
    };
    reader.readAsDataURL(arquivo);
    
    event.target.value = '';
  }

  /**
   * Validação inicial do arquivo (apenas tipo)
   */
  private validarArquivoInicial(arquivo: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Tipo inválido',
        detail: 'Use apenas arquivos JPG, JPEG ou PNG'
      });
      return false;
    }

    return true;
  }

  /**
   * Callback quando imagem é recortada
   */
  onImageCropped(event: ImageCroppedEvent): void {
    this.imagemEditada = event.blob || null;
  }

  /**
   * Callback quando imagem é carregada
   */
  onImageLoaded(image: LoadedImage): void {
    // Imagem carregada com sucesso no editor
  }

  /**
   * Callback de erro ao carregar imagem
   */
  onCropperError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao carregar imagem no editor'
    });
    this.fecharEditor();
  }

  /**
   * Confirma e faz upload da imagem editada
   */
  async confirmarEdicao(): Promise<void> {
    if (!this.imagemEditada) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Aguarde o processamento da imagem'
      });
      return;
    }

    // Validar tamanho da imagem editada
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    if (this.imagemEditada.size > tamanhoMaximo) {
      this.messageService.add({
        severity: 'error',
        summary: 'Arquivo muito grande',
        detail: 'A imagem editada deve ter no máximo 5 MB'
      });
      return;
    }

    this.enviando = true;
    this.exibirEditor = false;

    try {
      // Converter Blob para File
      const arquivo = new File([this.imagemEditada], 'foto.jpg', { type: 'image/jpeg' });
      
      await this.uploadCallback(arquivo);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Foto atualizada com sucesso'
      });

      // Limpar cache e recarregar
      this.fotoCache = { url: null, expiraEm: null };
      await this.carregarFoto();
      
      this.fotoAlterada.emit();
    } catch (error: any) {
      const mensagem = error?.error?.error || 'Erro ao fazer upload da foto';
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: mensagem
      });
    } finally {
      this.enviando = false;
      this.limparEditor();
    }
  }

  /**
   * Cancela edição
   */
  cancelarEdicao(): void {
    this.fecharEditor();
  }

  /**
   * Fecha o editor
   */
  private fecharEditor(): void {
    this.exibirEditor = false;
    this.limparEditor();
  }

  /**
   * Limpa dados do editor
   */
  private limparEditor(): void {
    this.imagemParaEditar = '';
    this.imagemEditada = null;
    this.zoom = 1;
    this.transformacao = {};
  }

  /**
   * Aumenta o zoom
   */
  aumentarZoom(): void {
    if (this.zoom < 3) {
      this.zoom = Math.min(3, this.zoom + 0.1);
      this.aplicarZoom();
    }
  }

  /**
   * Diminui o zoom
   */
  diminuirZoom(): void {
    if (this.zoom > 0.5) {
      this.zoom = Math.max(0.5, this.zoom - 0.1);
      this.aplicarZoom();
    }
  }

  /**
   * Aplica o zoom à imagem
   */
  aplicarZoom(): void {
    this.transformacao = {
      ...this.transformacao,
      scale: this.zoom
    };
  }

  /**
   * Remove a foto do usuário
   */
  async removerFoto(): Promise<void> {
    this.enviando = true;

    try {
      await this.removerCallback();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Foto removida com sucesso'
      });

      // Limpar cache e recarregar (agora será a imagem padrão)
      this.fotoCache = { url: null, expiraEm: null };
      await this.carregarFoto();
      
      this.fotoAlterada.emit();
    } catch (error: any) {
      const mensagem = error?.error?.error || 'Erro ao remover foto';
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: mensagem
      });
    } finally {
      this.enviando = false;
    }
  }

  /**
   * Abre seletor de arquivo
   */
  abrirSeletorArquivo(): void {
    console.log('abrirSeletorArquivo chamado');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png';
    input.onchange = (e) => {
      console.log('Input change event:', e);
      this.onFileSelect(e);
    };
    input.click();
  }

  /**
   * Retorna estilo do container baseado no tamanho
   */
  getEstiloContainer(): any {
    return this.tamanhos[this.tamanho];
  }
}
