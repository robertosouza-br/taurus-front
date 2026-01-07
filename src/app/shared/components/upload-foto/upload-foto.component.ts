import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { interval, Subscription } from 'rxjs';

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
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    // Validações
    if (!this.validarArquivo(arquivo)) {
      event.target.value = '';
      return;
    }

    this.enviando = true;

    try {
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
      event.target.value = '';
    }
  }

  /**
   * Valida o arquivo selecionado
   */
  private validarArquivo(arquivo: File): boolean {
    // Validar tamanho (máx 5MB)
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB em bytes
    if (arquivo.size > tamanhoMaximo) {
      this.messageService.add({
        severity: 'error',
        summary: 'Arquivo muito grande',
        detail: 'O arquivo deve ter no máximo 5 MB'
      });
      return false;
    }

    // Validar tipo
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png';
    input.onchange = (e) => this.onFileSelect(e);
    input.click();
  }

  /**
   * Retorna estilo do container baseado no tamanho
   */
  getEstiloContainer(): any {
    return this.tamanhos[this.tamanho];
  }
}
