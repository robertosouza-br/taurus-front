import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { BancoService } from '../../../core/services/banco.service';
import { EmpreendimentoService } from '../../../core/services/empreendimento.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import {
  ImobiliariaFormDTO,
  Imobiliaria,
  DocumentoImobiliaria,
  ImagemImobiliaria,
  TipoImobiliaria,
  TipoConta,
  TipoChavePixImobiliaria,
  UF,
  TIPO_IMOBILIARIA_LABELS,
  TIPO_CONTA_LABELS,
  TIPO_CHAVE_PIX_IMOBILIARIA_LABELS,
  UF_OPTIONS
} from '../../../core/models/imobiliaria.model';
import { Banco } from '../../../core/models/banco.model';
import { Empreendimento } from '../../../core/models/empreendimento.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-imobiliaria-form',
  templateUrl: './imobiliaria-form.component.html',
  styleUrls: ['./imobiliaria-form.component.scss']
})
export class ImobiliariaFormComponent extends BaseFormComponent implements OnInit, OnDestroy {
  // Controle de modo (novo/edição)
  modoEdicao = false;
  imobiliariaId: number | null = null;
  carregando = false;

  // Campos do formulário - Dados Principais
  razaoSocial = '';
  nomeFantasia = '';
  alias = '';
  cnpj = '';
  tipoImobiliaria: TipoImobiliaria | null = null;
  tipoImobiliariaSelecionada: { label: string; value: TipoImobiliaria } | null = null;
  percentualComissao: number | null = null;

  // Campos do formulário - Endereço
  cep = '';
  logradouro = '';
  numeroImovel = '';
  complemento = '';
  bairro = '';
  cidade = '';
  uf: UF | null = null;
  ufSelecionada: { label: string; value: UF } | null = null;

  // Campos do formulário - Contato
  telefone = '';
  emailContato = '';
  responsavel = '';
  website = '';

  // Campos do formulário - Dados Bancários
  bancoSelecionado: { label: string; value: number; banco: Banco } | null = null;
  numeroAgencia = '';
  numeroContaCorrente = '';
  tipoConta: TipoConta | null = null;
  tipoContaSelecionada: { label: string; value: TipoConta } | null = null;
  tipoChavePix: TipoChavePixImobiliaria | null = null;
  tipoChavePixSelecionada: { label: string; value: TipoChavePixImobiliaria } | null = null;
  chavePix = '';

  // Empreendimentos vinculados
  empreendimentosSelecionados: number[] = [];

  // Documentos
  documentos: DocumentoImobiliaria[] = [];
  documentosParaUpload: File[] = [];
  enviandoDocumento = false;

  // Portfólio de imagens
  imagensPortfolio: ImagemImobiliaria[] = [];
  enviandoImagem = false;
  carregandoImagens = false;
  descricaoImagem = '';
  tipoImagem = '';
  ordemImagem: number | null = null;
  tipoImagemSelecionada: { label: string; value: string } | null = null;
  tiposImagemOptions: { label: string; value: string }[] = [
    { label: 'Portfolio', value: 'portfolio' },
    { label: 'Logo', value: 'logo' },
    { label: 'Fachada', value: 'fachada' },
    { label: 'Escritório', value: 'escritorio' },
    { label: 'Equipe', value: 'equipe' },
    { label: 'Outros', value: 'outros' }
  ];
  tiposImagemFiltrados: { label: string; value: string }[] = [];
  private uploadsImagemPendentes = 0;
  private refreshPortfolioTimer: any = null;

  // Opções para dropdowns
  tiposImobiliariaOptions: { label: string; value: TipoImobiliaria }[] = [];
  tiposImobiliariaFiltrados: { label: string; value: TipoImobiliaria }[] = [];
  bancosOptions: { label: string; value: number; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: number; banco: Banco }[] = [];
  tiposContaOptions: { label: string; value: TipoConta }[] = [];
  tiposContaFiltrados: { label: string; value: TipoConta }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePixImobiliaria }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePixImobiliaria }[] = [];
  ufsOptions: { label: string; value: UF }[] = [];
  ufsFiltradas: { label: string; value: UF }[] = [];
  empreendimentosOptions: Empreendimento[] = [];
  empreendimentosFiltrados: Empreendimento[] = [];

  breadcrumbItems: BreadcrumbItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private imobiliariaService: ImobiliariaService,
    private bancoService: BancoService,
    private empreendimentoService: EmpreendimentoService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.verificarModo();
    this.configurarBreadcrumb();
    this.carregarOpcoes();
    this.tiposImagemFiltrados = [...this.tiposImagemOptions];
  }

  ngOnDestroy(): void {
    if (this.refreshPortfolioTimer) {
      clearTimeout(this.refreshPortfolioTimer);
      this.refreshPortfolioTimer = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarModo(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao = true;
      this.imobiliariaId = parseInt(id, 10);
      this.carregarImobiliaria();
    }
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Imobiliárias', url: '/imobiliarias' },
      { label: this.modoEdicao ? 'Editar Imobiliária' : 'Nova Imobiliária' }
    ];
  }

  private carregarOpcoes(): void {
    // Tipos de imobiliária
    this.tiposImobiliariaOptions = Object.values(TipoImobiliaria).map(tipo => ({
      label: TIPO_IMOBILIARIA_LABELS[tipo],
      value: tipo
    }));
    this.tiposImobiliariaFiltrados = [...this.tiposImobiliariaOptions];

    // Tipos de conta
    this.tiposContaOptions = Object.keys(TipoConta)
      .filter(key => !isNaN(Number(key)))
      .map(key => ({
        label: TIPO_CONTA_LABELS[Number(key) as TipoConta],
        value: Number(key) as TipoConta
      }));
    this.tiposContaFiltrados = [...this.tiposContaOptions];

    // Tipos de chave PIX
    this.tiposChavePixOptions = Object.keys(TipoChavePixImobiliaria)
      .filter(key => !isNaN(Number(key)))
      .map(key => ({
        label: TIPO_CHAVE_PIX_IMOBILIARIA_LABELS[Number(key) as TipoChavePixImobiliaria],
        value: Number(key) as TipoChavePixImobiliaria
      }));
    this.tiposChavePixFiltrados = [...this.tiposChavePixOptions];

    // UFs
    this.ufsOptions = UF_OPTIONS.map(uf => ({
      label: uf,
      value: uf
    }));
    this.ufsFiltradas = [...this.ufsOptions];

    // Carregar lista de bancos
    this.bancoService.listarTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bancos) => {
          this.bancosOptions = bancos.map(banco => ({
            label: `${banco.codigo} - ${banco.nome}`,
            value: banco.id,
            banco: banco
          }));
          this.bancosFiltrados = [...this.bancosOptions];
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Não foi possível carregar a lista de bancos'
          });
        }
      });

    // Carregar lista de empreendimentos
    this.carregarEmpreendimentos();
  }

  private carregarEmpreendimentos(): void {
    this.empreendimentoService.listarEmpreendimentos(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.empreendimentosOptions = response.content;
          this.empreendimentosFiltrados = [...this.empreendimentosOptions];
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Não foi possível carregar a lista de empreendimentos'
          });
        }
      });
  }

  private carregarImobiliaria(): void {
    if (!this.imobiliariaId) return;

    this.carregando = true;
    this.imobiliariaService.buscarPorId(this.imobiliariaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imobiliaria) => {
          console.log('Imobiliária carregada da API:', imobiliaria);
          this.preencherFormulario(imobiliaria);
          this.carregarImagensPortfolio();
          this.carregando = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao carregar imobiliária'
          });
          this.carregando = false;
          this.voltar();
        }
      });
  }

  private preencherFormulario(imobiliaria: Imobiliaria): void {
    // Dados Principais
    this.razaoSocial = imobiliaria.razaoSocial;
    this.nomeFantasia = imobiliaria.nomeFantasia;
    this.alias = imobiliaria.alias || '';
    this.cnpj = imobiliaria.cnpj;
    this.tipoImobiliaria = imobiliaria.tipoImobiliaria;
    this.tipoImobiliariaSelecionada = this.tiposImobiliariaOptions.find(opt => opt.value === imobiliaria.tipoImobiliaria) || null;
    this.percentualComissao = imobiliaria.percentualComissao || null;

    // Endereço
    this.cep = imobiliaria.cep;
    this.logradouro = imobiliaria.logradouro;
    this.numeroImovel = imobiliaria.numeroImovel || '';
    this.complemento = imobiliaria.complemento || '';
    this.bairro = imobiliaria.bairro;
    this.cidade = imobiliaria.cidade;
    this.uf = imobiliaria.uf;
    this.ufSelecionada = this.ufsOptions.find(opt => opt.value === imobiliaria.uf) || null;

    // Contato
    this.telefone = imobiliaria.telefone || '';
    this.emailContato = imobiliaria.emailContato;
    this.responsavel = imobiliaria.responsavel || '';
    this.website = imobiliaria.website || '';

    // Dados Bancários
    if (imobiliaria.bancoId) {
      this.bancoSelecionado = this.bancosOptions.find(opt => opt.value === imobiliaria.bancoId) || null;
    }
    this.numeroAgencia = imobiliaria.numeroAgencia || '';
    this.numeroContaCorrente = imobiliaria.numeroContaCorrente || '';
    if (imobiliaria.tipoConta) {
      this.tipoConta = imobiliaria.tipoConta;
      this.tipoContaSelecionada = this.tiposContaOptions.find(opt => opt.value === imobiliaria.tipoConta) || null;
    }
    if (imobiliaria.tipoChavePix) {
      this.tipoChavePix = imobiliaria.tipoChavePix;
      this.tipoChavePixSelecionada = this.tiposChavePixOptions.find(opt => opt.value === imobiliaria.tipoChavePix) || null;
    }
    this.chavePix = imobiliaria.chavePix || '';

    // Empreendimentos
    if (imobiliaria.codigosEmpreendimentos && imobiliaria.codigosEmpreendimentos.length > 0) {
      this.empreendimentosSelecionados = [...imobiliaria.codigosEmpreendimentos];
    }

    // Documentos - Filtrar apenas objetos válidos com path
    if (imobiliaria.documentos && Array.isArray(imobiliaria.documentos)) {
      this.documentos = imobiliaria.documentos.filter(doc => doc && doc.path && typeof doc.path === 'string');
      console.log('Documentos carregados:', this.documentos);
    } else {
      this.documentos = [];
      console.log('Nenhum documento encontrado na resposta da API');
    }
  }

  // Métodos de filtro para autocompletes
  filtrarTiposImobiliaria(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposImobiliariaFiltrados = this.tiposImobiliariaOptions.filter(tipo => 
      tipo.label.toLowerCase().includes(query)
    );
  }

  carregarTodosTiposImobiliaria(): void {
    this.tiposImobiliariaFiltrados = [...this.tiposImobiliariaOptions];
  }

  filtrarUfs(event: any): void {
    const query = event.query.toLowerCase();
    this.ufsFiltradas = this.ufsOptions.filter(uf => 
      uf.label.toLowerCase().includes(query)
    );
  }

  carregarTodasUfs(): void {
    this.ufsFiltradas = [...this.ufsOptions];
  }

  filtrarBancos(event: any): void {
    const query = event.query.toLowerCase();
    this.bancosFiltrados = this.bancosOptions.filter(banco => 
      banco.label.toLowerCase().includes(query)
    );
  }

  carregarTodosBancos(): void {
    this.bancosFiltrados = [...this.bancosOptions];
  }

  filtrarTiposConta(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposContaFiltrados = this.tiposContaOptions.filter(tipo => 
      tipo.label.toLowerCase().includes(query)
    );
  }

  carregarTodosTiposConta(): void {
    this.tiposContaFiltrados = [...this.tiposContaOptions];
  }

  filtrarTiposChavePix(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposChavePixFiltrados = this.tiposChavePixOptions.filter(tipo => 
      tipo.label.toLowerCase().includes(query)
    );
  }

  carregarTodosTiposChavePix(): void {
    this.tiposChavePixFiltrados = [...this.tiposChavePixOptions];
  }

  filtrarEmpreendimentos(event: any): void {
    const query = event.query.toLowerCase();
    this.empreendimentosFiltrados = this.empreendimentosOptions.filter(emp => 
      emp.nome.toLowerCase().includes(query)
    );
  }

  carregarTodosEmpreendimentos(): void {
    this.empreendimentosFiltrados = [...this.empreendimentosOptions];
  }

  // Métodos de seleção
  onTipoImobiliariaSelecionada(event: any): void {
    if (event) {
      this.tipoImobiliaria = event.value;
    }
  }

  onUfSelecionada(event: any): void {
    if (event) {
      this.uf = event.value;
    }
  }

  onBancoSelecionado(event: any): void {
    // Atualização automática já tratada pelo [(ngModel)]
  }

  onTipoContaSelecionada(event: any): void {
    if (event) {
      this.tipoConta = event.value;
    }
  }

  onTipoChavePixSelecionada(event: any): void {
    if (event) {
      this.tipoChavePix = event.value;
    }
  }

  onEmpreendimentosChange(event: any): void {
    this.empreendimentosSelecionados = event.value;
  }

  filtrarTiposImagem(event: any): void {
    const query = event.query?.toLowerCase() || '';
    this.tiposImagemFiltrados = this.tiposImagemOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }

  carregarTodosTiposImagem(): void {
    this.tiposImagemFiltrados = [...this.tiposImagemOptions];
  }

  onTipoImagemSelecionada(event: any): void {
    if (event?.value) {
      this.tipoImagem = event.value;
    }
  }

  onImagensSelecionadas(arquivos: File[]): void {
    if (!this.imobiliariaId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Salve a imobiliária primeiro para adicionar imagens'
      });
      return;
    }

    if (!arquivos || arquivos.length === 0) {
      return;
    }

    const ordemInicial = this.ordemImagem ?? this.imagensPortfolio.length;
    this.uploadsImagemPendentes = arquivos.length;
    this.enviandoImagem = true;

    arquivos.forEach((arquivo, index) => {
      this.enviarImagem(arquivo, ordemInicial + index);
    });
  }

  private enviarImagem(arquivo: File, ordem: number): void {
    if (!this.imobiliariaId) {
      return;
    }

    const principal = this.imagensPortfolio.length === 0;

    this.imobiliariaService.adicionarImagem(
      this.imobiliariaId,
      arquivo,
      this.descricaoImagem || undefined,
      this.tipoImagem || undefined,
      ordem,
      principal
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.finalizarUploadImagem(true, arquivo.name);
        },
        error: (error) => {
          this.finalizarUploadImagem(false, arquivo.name, error.error?.message);
        }
      });
  }

  private finalizarUploadImagem(sucesso: boolean, nomeArquivo: string, mensagemErro?: string): void {
    this.uploadsImagemPendentes -= 1;

    if (sucesso) {
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `Imagem "${nomeArquivo}" enviada com sucesso`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: mensagemErro || `Erro ao enviar imagem "${nomeArquivo}"`
      });
    }

    if (this.uploadsImagemPendentes <= 0) {
      this.enviandoImagem = false;
      this.ordemImagem = null;
      this.tipoImagem = '';
      this.descricaoImagem = '';
      this.tipoImagemSelecionada = null;
      this.carregarImagensPortfolio();
    }
  }

  carregarImagensPortfolio(silencioso = false): void {
    if (!this.imobiliariaId) {
      return;
    }

    if (!silencioso) {
      this.carregandoImagens = true;
    }

    this.imobiliariaService.listarImagens(this.imobiliariaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imagens) => {
          this.imagensPortfolio = this.ordenarImagensPortfolio(imagens || []);
          this.carregandoImagens = false;
          this.agendarRenovacaoUrlsPortfolio();
        },
        error: () => {
          this.carregandoImagens = false;
          if (!silencioso) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Aviso',
              detail: 'Não foi possível carregar as imagens do portfólio'
            });
          }
          this.refreshPortfolioTimer = setTimeout(() => this.carregarImagensPortfolio(true), 30000);
        }
      });
  }

  private ordenarImagensPortfolio(imagens: ImagemImobiliaria[]): ImagemImobiliaria[] {
    return [...imagens].sort((imagemA, imagemB) => {
      if (imagemA.principal && !imagemB.principal) return -1;
      if (!imagemA.principal && imagemB.principal) return 1;

      const ordemA = imagemA.ordem ?? 9999;
      const ordemB = imagemB.ordem ?? 9999;
      return ordemA - ordemB;
    });
  }

  definirImagemPrincipal(imagem: ImagemImobiliaria): void {
    if (!imagem.id || imagem.principal) {
      return;
    }

    this.imobiliariaService.definirImagemPrincipal(imagem.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem definida como principal'
          });
          this.carregarImagensPortfolio();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao definir imagem principal'
          });
        }
      });
  }

  confirmarRemocaoImagem(imagem: ImagemImobiliaria): void {
    if (!imagem.id) {
      return;
    }

    this.confirmationService.confirmCustom(
      'Confirmar Exclusão de Imagem',
      'Tem certeza que deseja excluir esta imagem do portfólio? Esta ação não pode ser desfeita.',
      {
        confirmLabel: 'Sim, excluir',
        cancelLabel: 'Cancelar',
        severity: 'danger',
        icon: 'pi pi-trash'
      }
    ).subscribe((confirmed) => {
      if (!confirmed) return;
      this.removerImagem(imagem.id!);
    });
  }

  private removerImagem(imagemId: number): void {
    this.imobiliariaService.removerImagem(imagemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Imagem removida com sucesso'
          });
          this.carregarImagensPortfolio();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao remover imagem'
          });
        }
      });
  }

  onImagemError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"%3E%3Crect width="400" height="240" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="16" font-family="Arial"%3EImagem indispon%C3%ADvel%3C/text%3E%3C/svg%3E';
  }

  private agendarRenovacaoUrlsPortfolio(): void {
    if (this.refreshPortfolioTimer) {
      clearTimeout(this.refreshPortfolioTimer);
    }

    this.refreshPortfolioTimer = setTimeout(() => {
      this.carregarImagensPortfolio(true);
    }, 240000);
  }

  onDocumentosSelecionados(arquivos: File[]): void {
    if (!this.imobiliariaId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Salve a imobiliária antes de adicionar documentos'
      });
      return;
    }

    // Processar cada arquivo
    arquivos.forEach(arquivo => this.enviarDocumento(arquivo));
  }

  enviarDocumento(arquivo: File): void {
    if (!this.imobiliariaId) return;

    this.enviandoDocumento = true;

    this.imobiliariaService.adicionarDocumento(this.imobiliariaId, arquivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imobiliaria) => {
          if (imobiliaria.documentos && Array.isArray(imobiliaria.documentos)) {
            this.documentos = imobiliaria.documentos.filter(doc => doc && doc.path && typeof doc.path === 'string');
          } else {
            this.documentos = [];
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Documento "${arquivo.name}" enviado com sucesso`
          });
          this.enviandoDocumento = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || `Erro ao enviar documento "${arquivo.name}"`
          });
          this.enviandoDocumento = false;
        }
      });
  }

  visualizarDocumento(doc: DocumentoImobiliaria): void {
    if (!this.imobiliariaId || !doc || !doc.path) return;
    
    this.imobiliariaService.visualizarDocumento(this.imobiliariaId, doc.path)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          
          // Liberar memória após 1 minuto
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 60000);
        },
        error: (error) => {
          let mensagem = 'Erro ao visualizar documento';
          
          if (error.status === 403) {
            mensagem = 'Você não tem permissão para visualizar este documento';
          } else if (error.status === 404) {
            mensagem = 'Documento não encontrado';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagem
          });
        }
      });
  }

  baixarDocumento(doc: DocumentoImobiliaria): void {
    if (!this.imobiliariaId || !doc || !doc.path) return;
    
    const nomeArquivo = doc.path.split('/').pop() || 'documento';
    
    this.imobiliariaService.visualizarDocumento(this.imobiliariaId, doc.path)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = nomeArquivo;
          link.click();
          
          // Liberar memória após o download
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        },
        error: (error) => {
          let mensagem = 'Erro ao baixar documento';
          
          if (error.status === 403) {
            mensagem = 'Você não tem permissão para baixar este documento';
          } else if (error.status === 404) {
            mensagem = 'Documento não encontrado';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagem
          });
        }
      });
  }

  removerDocumento(doc: DocumentoImobiliaria): void {
    if (!this.imobiliariaId || !doc || !doc.path) return;

    this.imobiliariaService.removerDocumento(this.imobiliariaId, doc.path)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imobiliaria) => {
          if (imobiliaria.documentos && Array.isArray(imobiliaria.documentos)) {
            this.documentos = imobiliaria.documentos.filter(d => d && d.path && typeof d.path === 'string');
          } else {
            this.documentos = [];
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Documento removido com sucesso'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao remover documento'
          });
        }
      });
  }

  getNomeDocumento(doc: DocumentoImobiliaria): string {
    if (!doc || !doc.path || typeof doc.path !== 'string') {
      return 'documento';
    }
    return doc.path.split('/').pop() || doc.path;
  }

  getCamposObrigatorios(): { id: string; valor: any; label?: string }[] {
    return [
      { id: 'razaoSocial', valor: this.razaoSocial, label: 'Razão Social' },
      { id: 'nomeFantasia', valor: this.nomeFantasia, label: 'Nome Fantasia' },
      { id: 'cnpj', valor: this.cnpj, label: 'CNPJ' },
      { id: 'percentualComissao', valor: this.percentualComissao, label: 'Percentual de Comissão' },
      { id: 'tipoImobiliaria', valor: this.tipoImobiliaria, label: 'Tipo de Imobiliária' },
      { id: 'cep', valor: this.cep, label: 'CEP' },
      { id: 'logradouro', valor: this.logradouro, label: 'Logradouro' },
      { id: 'bairro', valor: this.bairro, label: 'Bairro' },
      { id: 'cidade', valor: this.cidade, label: 'Cidade' },
      { id: 'uf', valor: this.uf, label: 'UF' },
      { id: 'emailContato', valor: this.emailContato, label: 'E-mail' }
    ];
  }

  private validarCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
  }

  private validarCEP(cep: string): boolean {
    cep = cep.replace(/\D/g, '');
    
    // CEP deve ter 8 dígitos
    if (cep.length !== 8) return false;
    
    // Não pode ser todos zeros ou sequência de números iguais
    if (/^0{8}$/.test(cep) || /^(\d)\1{7}$/.test(cep)) return false;
    
    return true;
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  salvar(): void {
    this.tentouSalvar = true;

    if (!this.validarFormulario()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    // Validação adicional do CNPJ
    if (!this.validarCNPJ(this.cnpj)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'CNPJ inválido'
      });
      return;
    }

    // Validação adicional do CEP
    if (!this.validarCEP(this.cep)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'CEP inválido'
      });
      return;
    }

    // Validação adicional do Email
    if (!this.validarEmail(this.emailContato)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'E-mail inválido'
      });
      return;
    }

    // Confirmação após validação
    this.confirmationService.confirmSave().subscribe(confirmed => {
      if (!confirmed) return;

      this.executarSalvamento();
    });
  }

  private executarSalvamento(): void {

    const dados: ImobiliariaFormDTO = {
      razaoSocial: this.razaoSocial,
      nomeFantasia: this.nomeFantasia,
      alias: this.alias || undefined,
      cnpj: this.cnpj,
      tipoImobiliaria: this.tipoImobiliaria!,
      percentualComissao: this.percentualComissao || undefined,
      cep: this.cep,
      logradouro: this.logradouro,
      numeroImovel: this.numeroImovel || undefined,
      complemento: this.complemento || undefined,
      bairro: this.bairro,
      cidade: this.cidade,
      uf: this.uf!,
      telefone: this.telefone || undefined,
      emailContato: this.emailContato,
      responsavel: this.responsavel || undefined,
      website: this.website || undefined,
      bancoId: this.bancoSelecionado?.value || undefined,
      numeroAgencia: this.numeroAgencia || undefined,
      numeroContaCorrente: this.numeroContaCorrente || undefined,
      tipoConta: this.tipoConta || undefined,
      tipoChavePix: this.tipoChavePix || undefined,
      chavePix: this.chavePix || undefined,
      codigosEmpreendimentos: this.empreendimentosSelecionados
    };

    this.salvando = true;

    const request = this.modoEdicao && this.imobiliariaId
      ? this.imobiliariaService.atualizar(this.imobiliariaId, dados)
      : this.imobiliariaService.criar(dados);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: this.modoEdicao ? 'Imobiliária atualizada com sucesso' : 'Imobiliária criada com sucesso'
          });
          this.salvando = false;
          this.voltar();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao salvar imobiliária'
          });
          this.salvando = false;
        }
      });
  }

  voltar(): void {
    this.router.navigate(['/imobiliarias']);
  }
}
