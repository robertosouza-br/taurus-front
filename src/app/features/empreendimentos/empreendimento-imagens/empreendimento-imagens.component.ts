import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService as PrimeConfirmationService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { PermissaoService } from '../../../core/services/permissao.service';
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
export class EmpreendimentoImagensComponent implements OnInit {
  codigoEmpreendimento!: string;
  imagens: EmpreendimentoImagem[] = [];
  carregando = false;
  uploadando = false;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  
  // Dialog de upload
  displayUploadDialog = false;
  arquivoSelecionado: File | null = null;
  uploadOrdem = 0;
  uploadPrincipal = false;
  uploadTipo: TipoImagemEmpreendimento | null = null;
  
  // Dialog de edição
  displayEditDialog = false;
  imagemEdicao: EmpreendimentoImagem | null = null;
  editOrdem = 0;
  editPrincipal = false;
  editTipo: TipoImagemEmpreendimento | null = null;
  
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
    private confirmationService: PrimeConfirmationService
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.IMOVEL, Permissao.CONSULTAR)) {
      this.router.navigate(['/acesso-negado']);
      return;
    }
    
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
      { label: `Código ${this.codigoEmpreendimento}` },
      { label: 'Imagens' }
    ];
  }

  carregar(): void {
    this.carregando = true;
    
    this.empreendimentoService.listarImagensAtivas(this.codigoEmpreendimento)
      .pipe(finalize(() => this.carregando = false))
      .subscribe({
        next: (imagens: EmpreendimentoImagem[]) => {
          this.imagens = imagens;
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

  abrirUpload(): void {
    if (!this.podeIncluir) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para adicionar imagens'
      });
      return;
    }
    
    this.limparFormularioUpload();
    this.displayUploadDialog = true;
  }

  private limparFormularioUpload(): void {
    this.arquivoSelecionado = null;
    this.uploadOrdem = this.imagens.length;
    this.uploadPrincipal = this.imagens.length === 0;
    this.uploadTipo = null;
  }

  onFileSelect(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    
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
      
      this.arquivoSelecionado = file;
    }
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
      tipo: this.uploadTipo || undefined
    })
      .pipe(finalize(() => this.uploadando = false))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem enviada com sucesso'
          });
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
    this.editTipo = imagem.tipo;
    this.displayEditDialog = true;
  }

  salvarEdicao(): void {
    if (!this.imagemEdicao) return;
    
    this.uploadando = true;
    
    this.empreendimentoService.atualizarImagem(this.imagemEdicao.id!, {
      ordem: this.editOrdem,
      principal: this.editPrincipal,
      tipo: this.editTipo || undefined
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
      message: 'Deseja realmente inativar esta imagem?',
      header: 'Confirmar Inativação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        if (!imagem.id) return;
        
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
      message: 'Deseja realmente excluir permanentemente esta imagem? Esta ação não pode ser desfeita.',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (!imagem.id) return;
        
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

  voltar(): void {
    this.router.navigate(['/empreendimentos']);
  }
}
