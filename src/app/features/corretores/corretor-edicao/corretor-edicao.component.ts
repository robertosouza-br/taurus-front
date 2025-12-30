import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CorretorService } from '../../../core/services/corretor.service';
import { BancoService } from '../../../core/services/banco.service';
import { CorretorDTO, CorretorCargo, TipoChavePix, CARGO_LABELS, TIPO_CHAVE_PIX_LABELS } from '../../../core/models/corretor.model';
import { Banco } from '../../../core/models/banco.model';
import { BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PermissaoService } from '../../../core/services';
import { Funcionalidade } from '../../../core/enums/funcionalidade.enum';
import { Permissao } from '../../../core/enums/permissao.enum';

@Component({
  selector: 'app-corretor-edicao',
  templateUrl: './corretor-edicao.component.html',
  styleUrls: ['./corretor-edicao.component.scss']
})
export class CorretorEdicaoComponent implements OnInit {
  cpfCorretor!: string;
  
  // Campos do formulário
  nome = '';
  cpf = '';
  email = '';
  nomeGuerra = '';
  telefone = '';
  numeroCreci = '';
  cargo: CorretorCargo = CorretorCargo.CORRETOR;
  cargoSelecionado: { label: string; value: CorretorCargo } | null = null;
  numeroBanco = '';
  bancoSelecionado: { label: string; value: string; banco: Banco } | null = null;
  numeroAgencia = '';
  numeroContaCorrente = '';
  tipoConta = '';
  tipoChavePix: TipoChavePix = TipoChavePix.CPF;
  tipoChavePixSelecionado: { label: string; value: TipoChavePix } | null = null;
  chavePix = '';
  ativo = true;
  
  carregando = false;
  salvando = false;
  tentouSalvar = false;
  corretor: CorretorDTO | null = null;
  
  cargosOptions: { label: string; value: CorretorCargo }[] = [];
  cargosFiltrados: { label: string; value: CorretorCargo }[] = [];
  bancosOptions: { label: string; value: string; banco: Banco }[] = [];
  bancosFiltrados: { label: string; value: string; banco: Banco }[] = [];
  tiposChavePixOptions: { label: string; value: TipoChavePix }[] = [];
  tiposChavePixFiltrados: { label: string; value: TipoChavePix }[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private corretorService: CorretorService,
    private bancoService: BancoService,
    private router: Router,
    private messageService: MessageService,
    private permissaoService: PermissaoService
  ) {}

  ngOnInit(): void {
    if (!this.permissaoService.temPermissao(Funcionalidade.CORRETOR, Permissao.ALTERAR)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Acesso Negado',
        detail: 'Você não tem permissão para alterar corretores'
      });
      this.router.navigate(['/cadastros/corretores']);
      return;
    }

    this.cpfCorretor = this.route.snapshot.params['id']; // O parâmetro ainda é 'id' mas agora contém CPF
    this.configurarBreadcrumb();
    this.carregarOpcoes();
    this.carregarCorretor();
  }

  private configurarBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', icon: 'pi pi-database' },
      { label: 'Corretores', url: '/cadastros/corretores' },
      { label: 'Editar Corretor' }
    ];
  }

  private carregarOpcoes(): void {
    this.cargosOptions = Object.keys(CorretorCargo).map(key => ({
      label: CARGO_LABELS[key as CorretorCargo],
      value: key as CorretorCargo
    }));

    this.tiposChavePixOptions = Object.keys(TipoChavePix).map(key => ({
      label: TIPO_CHAVE_PIX_LABELS[key as TipoChavePix],
      value: key as TipoChavePix
    }));

    // Carregar lista de bancos
    this.bancoService.listar().subscribe({
      next: (bancos) => {
        this.bancosOptions = bancos.map(banco => ({
          label: `${banco.codigo} - ${banco.nome}`,
          value: banco.codigo,
          banco: banco
        }));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Não foi possível carregar a lista de bancos'
        });
      }
    });
  }

  private carregarCorretor(): void {
    this.carregando = true;
    this.corretorService.buscarPorCpf(this.cpfCorretor).subscribe({
      next: (corretor) => {
        this.corretor = corretor;
        this.preencherFormulario(corretor);
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        let mensagem = 'Erro ao carregar dados do corretor';
        if (error.status === 404) {
          mensagem = 'Corretor não encontrado';
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
        this.router.navigate(['/cadastros/corretores']);
      }
    });
  }

  private preencherFormulario(corretor: CorretorDTO): void {
    this.nome = corretor.nome;
    this.cpf = corretor.cpf;
    this.email = corretor.email || '';
    this.nomeGuerra = corretor.nomeGuerra || '';
    this.telefone = corretor.telefone || '';
    this.numeroCreci = corretor.numeroCreci || '';
    this.cargo = corretor.cargo;
    this.numeroBanco = corretor.numeroBanco || '';
    this.numeroAgencia = corretor.numeroAgencia || '';
    this.numeroContaCorrente = corretor.numeroContaCorrente || '';
    this.tipoConta = corretor.tipoConta || '';
    this.tipoChavePix = corretor.tipoChavePix || TipoChavePix.CPF;
    this.chavePix = corretor.chavePix || '';
    this.ativo = corretor.ativo;

    // Preencher autocompletes
    this.cargoSelecionado = this.cargosOptions.find(c => c.value === corretor.cargo) || null;
    
    // Preencher banco se houver numeroBanco
    if (corretor.numeroBanco) {
      this.bancoSelecionado = this.bancosOptions.find(b => b.value === corretor.numeroBanco) || null;
    }
    
    this.tipoChavePixSelecionado = corretor.tipoChavePix 
      ? this.tiposChavePixOptions.find(t => t.value === corretor.tipoChavePix) || null 
      : null;
  }

  // Métodos para Autocomplete de Cargo
  filtrarCargos(event: any): void {
    const query = event.query.toLowerCase();
    this.cargosFiltrados = this.cargosOptions.filter(cargo =>
      cargo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosCargos(): void {
    this.cargosFiltrados = [...this.cargosOptions];
  }

  // Métodos para Autocomplete de Tipo Chave PIX
  filtrarTiposChavePix(event: any): void {
    const query = event.query.toLowerCase();
    this.tiposChavePixFiltrados = this.tiposChavePixOptions.filter(tipo =>
      tipo.label.toLowerCase().includes(query)
    );
  }

  mostrarTodosTiposChavePix(): void {
    this.tiposChavePixFiltrados = [...this.tiposChavePixOptions];
  }

  // Métodos para Autocomplete de Banco
  filtrarBancos(event: any): void {
    const query = event.query.toLowerCase();
    this.bancosFiltrados = this.bancosOptions.filter(banco =>
      banco.label.toLowerCase().includes(query) ||
      banco.value.includes(query)
    );
  }

  mostrarTodosBancos(): void {
    this.bancosFiltrados = [...this.bancosOptions];
  }

  salvarCorretor(): void {
    this.tentouSalvar = true;

    // Validação básica
    if (!this.nome || !this.cpf || !this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    this.salvando = true;

    // Extrair valor do cargo se for objeto
    const cargoValue = this.cargoSelecionado ? this.cargoSelecionado.value : this.cargo;
    const tipoChavePixValue = this.tipoChavePixSelecionado ? this.tipoChavePixSelecionado.value : this.tipoChavePix;

    const corretorAtualizado: CorretorDTO = {
      nome: this.nome,
      cpf: this.cpf,
      email: this.email,
      nomeGuerra: this.nomeGuerra || undefined,
      telefone: this.telefone || undefined,
      numeroCreci: this.numeroCreci || undefined,
      cargo: cargoValue,
      numeroBanco: this.bancoSelecionado ? this.bancoSelecionado.value : undefined, // Envia apenas o código
      numeroAgencia: this.numeroAgencia || undefined,
      numeroContaCorrente: this.numeroContaCorrente || undefined,
      tipoConta: this.tipoConta || undefined,
      tipoChavePix: tipoChavePixValue,
      chavePix: this.chavePix || undefined,
      ativo: this.ativo
    };

    // Usa o ID retornado pela API na busca por CPF
    const corretorId = this.corretor?.id;
    if (!corretorId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do corretor não encontrado'
      });
      this.salvando = false;
      return;
    }

    this.corretorService.atualizar(corretorId, corretorAtualizado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Corretor atualizado com sucesso!'
        });
        this.router.navigate(['/cadastros/corretores']);
      },
      error: (error) => {
        this.salvando = false;
        let mensagem = 'Erro ao atualizar corretor';
        
        if (error.status === 400) {
          mensagem = error.error?.message || 'Dados inválidos';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: mensagem
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/cadastros/corretores']);
  }
}
