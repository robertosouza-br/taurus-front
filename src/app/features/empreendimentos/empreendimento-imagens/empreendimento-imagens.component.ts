import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { ConfirmationAction } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';
import {
  EmpreendimentoImagem,
  TipoImagemEmpreendimento,
  TIPO_IMAGEM_LABELS,
  TIPO_IMAGEM_ICONS
} from '../../../core/models/empreendimento.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-empreendimento-imagens',
  templateUrl: './empreendimento-imagens.component.html',
  styleUrls: ['./empreendimento-imagens.component.scss']
})
export class EmpreendimentoImagensComponent implements OnInit, OnDestroy {
  codigoEmpreendimento!: string;
  nomeEmpreendimento: string = '';
  imagens: EmpreendimentoImagem[] = [];
  carregando = false;
  uploadando = false;
  
  // Referência ao componente de file upload
  @ViewChild('fileUploadInput') fileUploadInput: any;
  
  // Galleria
  private _displayGalleria = false;
  get displayGalleria(): boolean {
    return this._displayGalleria;
  }
  set displayGalleria(value: boolean) {
    this._displayGalleria = value;
    // Controla classe no body para ajustar z-index do header
    if (value) {
      document.body.classList.add('galleria-fullscreen-open');
    } else {
      document.body.classList.remove('galleria-fullscreen-open');
    }
  }
  activeIndex = 0;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  
  // Dialog de upload
  displayUploadDialog = false;
  arquivoSelecionado: File | null = null;
  arquivoPreviewUrl: string | null = null;
  uploadOrdem = 0;
  uploadPrincipal = false;
  uploadTipo: any = null; // Objeto completo { value, label, icon }
  tiposFiltrados: any[] = [];
  
  // Dialog de edição
  displayEditDialog = false;
  imagemEdicao: EmpreendimentoImagem | null = null;
  editOrdem = 0;
  editPrincipal = false;
  editTipo: any = null; // Objeto completo { value, label, icon }
  
  // Tipos de imagem
  tiposImagem = Object.entries(TIPO_IMAGEM_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: TIPO_IMAGEM_ICONS[value]
  }));
  
  get podeIncluir(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.INCLUIR);
  }
  
  get podeAlterar(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.ALTERAR);
  }
  
  get podeExcluir(): boolean {
    return this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.EXCLUIR);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empreendimentoService: EmpreendimentoService,
    private permissaoService: PermissaoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    
    // Inicializar tipos filtrados
    this.tiposFiltrados = [...this.tiposImagem];
    
    this.codigoEmpreendimento = this.route.snapshot.paramMap.get('codigo') || '';
    
    if (!this.codigoEmpreendimento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código do empreendimento não informado'
      });
      this.router.navigate(['/empreendimentos']);
      return;
    }
    
    this.configurarBreadcrumb();
    this.carregar();
  }
  
  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Imóveis', icon: 'pi pi-building' },
      { label: 'Empreendimentos', url: '/empreendimentos' },
      { label: this.nomeEmpreendimento || `Cód. ${this.codigoEmpreendimento}` },
      { label: 'Portfólio' }
    ];
  }

  carregar(): void {
    this.carregando = true;
    
    // Busca nome do empreendimento e imagens em paralelo
    this.empreendimentoService.listarImagensAtivas(this.codigoEmpreendimento)
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (imagens: EmpreendimentoImagem[]) => {
          this.imagens = imagens;
          // Extrai nome do primeiro resultado
          if (imagens.length > 0) {
            this.buscarNomeEmpreendimento();
          }
        },
        error: (error: any) => {
          console.error('Erro ao carregar imagens:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar as imagens'
          });
        }
      });
  }

  private buscarNomeEmpreendimento(): void {
    // Tenta buscar da listagem (se vier do router state)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    
    if (state?.nomeEmpreendimento) {
      this.nomeEmpreendimento = state.nomeEmpreendimento;
      this.configurarBreadcrumb();
    } else {
      // Busca na API se não vier do state
      this.empreendimentoService.listarEmpreendimentos(0, 1000).subscribe({
        next: (response) => {
          const emp = response.content.find(e => e.codEmpreendimento.toString() === this.codigoEmpreendimento);
          if (emp) {
            this.nomeEmpreendimento = emp.nome;
            this.configurarBreadcrumb();
          }
        }
      });
    }
  }

  /**
   * Abre a galeria fullscreen no index especificado
   */
  abrirGalleria(index: number): void {
    this.activeIndex = index;
    this.displayGalleria = true;
  }

  /**
   * Fecha a galeria fullscreen
   */
  fecharGalleria(): void {
    this.displayGalleria = false;
  }

  ngOnDestroy(): void {
    // Limpa a classe do body ao sair do componente
    document.body.classList.remove('galleria-fullscreen-open');
  }

  abrirUpload(): void {
    if (!this.podeIncluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para adicionar imagens'
      });
      return;
    }
    
    // Garantir que está limpo antes de abrir
    this.limparFormularioUpload();
    this.displayUploadDialog = true;
  }

  limparFormularioUpload(): void {
    this.arquivoSelecionado = null;
    this.arquivoPreviewUrl = null;
    this.uploadOrdem = this.imagens.length;
    this.uploadPrincipal = this.imagens.length === 0;
    this.uploadTipo = null;
    this.tiposFiltrados = [...this.tiposImagem];
    
    // Limpar o componente p-fileUpload
    if (this.fileUploadInput) {
      this.fileUploadInput.clear();
    }
  }

  cancelarUpload(): void {
    this.displayUploadDialog = false;
    // A limpeza será feita automaticamente pelo evento (onHide) do dialog
  }

  cancelarEdicao(): void {
    this.imagemEdicao = null;
    this.displayEditDialog = false;
  }

  onFileSelect(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    
    console.log('onFileSelect chamado', { event, file });
    
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'error',
          summary: 'Arquivo muito grande',
          detail: 'O tamanho máximo permitido é 10 MB'
        });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Tipo inválido',
          detail: 'Apenas arquivos JPEG, JPG, PNG e WEBP são permitidos'
        });
        return;
      }
      
      console.log('Arquivo válido, criando preview...');
      this.arquivoSelecionado = file;
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.arquivoPreviewUrl = e.target.result;
        console.log('Preview carregado:', this.arquivoPreviewUrl?.substring(0, 50));
        // Forçar detecção de mudanças para atualizar o preview
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('Nenhum arquivo encontrado no evento');
    }
  }

  /**
   * Filtra tipos de imagem para o autocomplete
   */
  filtrarTipos(event: any): void {
    const query = event.query?.toLowerCase() || '';
    if (!query) {
      this.tiposFiltrados = [...this.tiposImagem];
    } else {
      this.tiposFiltrados = this.tiposImagem.filter(tipo =>
        tipo.label.toLowerCase().includes(query)
      );
    }
  }

  /**
   * Seleciona tipo do autocomplete
   */
  selecionarTipo(event: any): void {
    // Autocomplete já passa o objeto completo
    this.uploadTipo = event;
  }

  /**
   * Seleciona tipo do autocomplete (edição)
   */
  selecionarTipoEdit(event: any): void {
    // Autocomplete já passa o objeto completo
    this.editTipo = event;
  }

  fazerUpload(): void {
    if (!this.arquivoSelecionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Arquivo não selecionado',
        detail: 'Selecione um arquivo para fazer upload'
      });
      return;
    }
    
    this.uploadando = true;
    
    this.empreendimentoService.uploadImagem(this.codigoEmpreendimento, {
      arquivo: this.arquivoSelecionado,
      ordem: this.uploadOrdem,
      principal: this.uploadPrincipal,
      tipo: this.uploadTipo?.value || undefined // Extrai o value do objeto
    })
      .pipe(finalize(() => this.uploadando = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem enviada com sucesso'
          });
          this.limparFormularioUpload();
          this.displayUploadDialog = false;
          this.carregar();
        },
        error: (error: any) => {
          console.error('Erro ao fazer upload:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Não foi possível enviar a imagem'
          });
        }
      });
  }

  abrirEdicao(imagem: EmpreendimentoImagem): void {
    if (!this.podeAlterar) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para editar imagens'
      });
      return;
    }
    
    this.imagemEdicao = imagem;
    this.editOrdem = imagem.ordem;
    this.editPrincipal = imagem.principal;
    
    // Encontrar o objeto tipo correspondente
    this.editTipo = this.tiposImagem.find(t => t.value === imagem.tipo) || null;
    this.tiposFiltrados = [...this.tiposImagem];
    
    this.displayEditDialog = true;
  }

  salvarEdicao(): void {
    if (!this.imagemEdicao) return;
    
    this.uploadando = true;
    
    this.empreendimentoService.atualizarImagem(this.imagemEdicao.id!, {
      ordem: this.editOrdem,
      principal: this.editPrincipal,
      tipo: this.editTipo?.value || undefined
    })
      .pipe(finalize(() => this.uploadando = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem atualizada com sucesso'
          });
          this.displayEditDialog = false;
          this.carregar();
        },
        error: (error: any) => {
          console.error('Erro ao atualizar imagem:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Não foi possível atualizar a imagem'
          });
        }
      });
  }

  marcarComoPrincipal(imagem: EmpreendimentoImagem): void {
    if (!this.podeAlterar || imagem.principal) return;
    if (!imagem.id) return;
    
    this.empreendimentoService.marcarComoPrincipal(imagem.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem marcada como principal'
          });
          this.carregar();
        },
        error: (error: any) => {
          console.error('Erro ao marcar como principal:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível marcar a imagem como principal'
          });
        }
      });
  }

  inativar(imagem: EmpreendimentoImagem): void {
    if (!this.podeExcluir) return;
    
    this.confirmationService.confirm({
      action: ConfirmationAction.EXCLUIR,
      title: 'Confirmar Inativação',
      message: 'Deseja realmente inativar esta imagem?',
      confirmLabel: 'Sim, inativar',
      cancelLabel: 'Cancelar',
      icon: 'pi pi-exclamation-triangle',
      severity: 'warning'
    }).subscribe(confirmed => {
      if (confirmed && imagem.id) {
        this.empreendimentoService.inativarImagem(imagem.id)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Imagem inativada com sucesso'
              });
              this.carregar();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível inativar a imagem'
              });
            }
          });
      }
    });
  }

  excluir(imagem: EmpreendimentoImagem): void {
    if (!this.podeExcluir) return;
    
    this.confirmationService.confirm({
      action: ConfirmationAction.EXCLUIR,
      title: 'Confirmar Exclusão Permanente',
      message: 'Deseja realmente excluir permanentemente esta imagem? Esta ação não pode ser desfeita.',
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      icon: 'pi pi-trash',
      severity: 'danger'
    }).subscribe(confirmed => {
      if (confirmed && imagem.id) {
        this.empreendimentoService.excluirImagem(imagem.id)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Imagem excluída permanentemente'
              });
              this.carregar();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível excluir a imagem'
              });
            }
          });
      }
    });
  }

  getTipoIcon(tipo: string | null): string {
    if (!tipo) return TIPO_IMAGEM_ICONS[TipoImagemEmpreendimento.OUTROS];
    return TIPO_IMAGEM_ICONS[tipo] || TIPO_IMAGEM_ICONS[TipoImagemEmpreendimento.OUTROS];
  }

  getTipoLabel(tipo: string | null): string {
    if (!tipo) return 'Sem categoria';
    return TIPO_IMAGEM_LABELS[tipo] || tipo;
  }

  /**
   * Retorna a URL da imagem (suporta estrutura atual e futura do backend)
   */
  getImagemUrl(imagem: EmpreendimentoImagem): string {
    const url = imagem.urlImagem || imagem.urlTemporaria || this.getPlaceholder();
    console.log('getImagemUrl:', { 
      urlImagem: imagem.urlImagem, 
      urlTemporaria: imagem.urlTemporaria,
      urlFinal: url 
    });
    return url;
  }

  /**
   * Placeholder SVG para imagens com erro
   */
  private getPlaceholder(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
  }

  /**
   * Tratamento de erro ao carregar imagem
   */
  onImageError(event: Event): void {
    console.warn('Erro ao carregar imagem');
    (event.target as HTMLImageElement).src = this.getPlaceholder();
  }

  voltar(): void {
    this.router.navigate(['/empreendimentos']);
  }
}
