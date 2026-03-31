import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { PropostaService } from '../../../core/services/proposta.service';
import { PropostaStateService } from '../../../core/services/proposta-state.service';
import { 
  DadosUnidadeHeaderDTO, 
  DadosClientePropostaDTO,
  EstadoCivil,
  ESTADO_CIVIL_LABELS,
  MidiaOrigem,
  MIDIA_ORIGEM_LABELS,
  MotivoCompra,
  MOTIVO_COMPRA_LABELS,
  CriarPropostaRequest
} from '../../../core/models/proposta-fluxo.model';

/**
 * Step 2: Dados do Cliente
 * Complementação dos dados do cliente com 5 seções:
 * 1. Dados Básicos (nome/CPF readonly, dataNascimento e estadoCivil para preencher)
 * 2. Informações Profissionais
 * 3. Informações Financeiras
 * 4. Endereço Residencial
 * 5. Origem da Venda
 */
@Component({
  selector: 'app-proposta-step2',
  templateUrl: './proposta-step2.component.html',
  styleUrls: ['./proposta-step2.component.scss'],
  providers: [MessageService]
})
export class PropostaStep2Component extends BaseFormComponent implements OnInit, OnDestroy {
  formulario!: FormGroup;
  reservaId!: number;
  propostaId?: number;
  dadosUnidade?: DadosUnidadeHeaderDTO;
  carregando = false;
  override salvando = false;
  stepsPreenchidos = 2;
  private readonly destroy$ = new Subject<void>();
  
  // Dados pré-preenchidos da reserva (readonly)
  dadosBasicosReserva: {
    nomeCompleto: string;
    cpfCnpj: string;
    clienteEstrangeiro: boolean;
    passaporte?: string;
    contatoPrincipal: string;
    tipoContatoPrincipal: string;
    contatoSecundario?: string;
    tipoContatoSecundario?: string;
  } | null = null;
  
  // Options para dropdowns
  estadosCivis = Object.keys(EstadoCivil).map(key => ({
    label: ESTADO_CIVIL_LABELS[key as EstadoCivil],
    value: key
  }));
  
  midiasOrigem = Object.keys(MidiaOrigem).map(key => ({
    label: MIDIA_ORIGEM_LABELS[key as MidiaOrigem],
    value: key
  }));
  
  motivosCompra = Object.keys(MotivoCompra).map(key => ({
    label: MOTIVO_COMPRA_LABELS[key as MotivoCompra],
    value: key
  }));
  
  // UFs brasileiras
  ufs = [
    { label: 'AC', value: 'AC' },
    { label: 'AL', value: 'AL' },
    { label: 'AP', value: 'AP' },
    { label: 'AM', value: 'AM' },
    { label: 'BA', value: 'BA' },
    { label: 'CE', value: 'CE' },
    { label: 'DF', value: 'DF' },
    { label: 'ES', value: 'ES' },
    { label: 'GO', value: 'GO' },
    { label: 'MA', value: 'MA' },
    { label: 'MT', value: 'MT' },
    { label: 'MS', value: 'MS' },
    { label: 'MG', value: 'MG' },
    { label: 'PA', value: 'PA' },
    { label: 'PB', value: 'PB' },
    { label: 'PR', value: 'PR' },
    { label: 'PE', value: 'PE' },
    { label: 'PI', value: 'PI' },
    { label: 'RJ', value: 'RJ' },
    { label: 'RN', value: 'RN' },
    { label: 'RS', value: 'RS' },
    { label: 'RO', value: 'RO' },
    { label: 'RR', value: 'RR' },
    { label: 'SC', value: 'SC' },
    { label: 'SP', value: 'SP' },
    { label: 'SE', value: 'SE' },
    { label: 'TO', value: 'TO' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propostaService: PropostaService,
    private propostaStateService: PropostaStateService,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.obterReservaId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      // SEÇÃO 1: Dados Básicos (campos complementares)
      dataNascimento: [''],
      estadoCivil: [''],
      
      // SEÇÃO 2: Informações Profissionais
      profissao: [''],
      empresaTrabalho: [''],
      tempoEmpresaMeses: [null],
      cnpjEmpresa: [''],
      
      // SEÇÃO 3: Informações Financeiras
      rendaMensal: [null],
      rendaComprovada: [null],
      outrasRendas: [null],
      bancoPrincipal: [''],
      agencia: [''],
      
      // SEÇÃO 4: Endereço Residencial
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: [''],
      
      // SEÇÃO 5: Origem da Venda
      midiaOrigem: [''],
      motivoCompra: ['']
    });
  }

  obterReservaId(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.reservaId = +params['reservaId'];
      if (this.reservaId) {
        this.carregarDados();
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'ID da reserva não fornecido'
        });
        this.router.navigate(['/propostas/lista']);
      }
    });
  }

  carregarDados(): void {
    this.carregando = true;
    
    // Carrega dados do state
    const state = this.propostaStateService.getStateSnapshot();
    
    if (!state.reservaId || state.reservaId !== this.reservaId) {
      // State não existe - redireciona para Step 1
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, passe pelo Step 1 primeiro'
      });
      this.router.navigate(['/propostas/step1'], {
        queryParams: { reservaId: this.reservaId }
      });
      return;
    }
    
    // Define quantos steps estão preenchidos
    this.stepsPreenchidos = state.stepAtual;
    
    // Carrega dados da unidade do state
    if (state.dadosReserva) {
      const cabecalho = state.dadosReserva.cabecalho;
      const dadosIniciais = state.dadosReserva.dadosIniciais;
      const dadosCliente = state.dadosReserva.dadosCliente;
      
      this.dadosUnidade = {
        reservaId: dadosIniciais.reservaId,
        codEmpreendimento: cabecalho.codEmpreendimento,
        codColigada: cabecalho.codColigadaEmpreendimento,
        nomeEmpreendimento: cabecalho.nomeEmpreendimento,
        nomeUnidade: `${cabecalho.bloco}-${cabecalho.unidade}`,
        bloco: cabecalho.bloco,
        unidade: cabecalho.unidade,
        tipoUnidade: cabecalho.tipoUnidade,
        tipologia: cabecalho.tipologia,
        sigla: cabecalho.sigla,
        valor: cabecalho.valorUnidade,
        valorTotal: cabecalho.valorUnidade,
        fracaoIdeal: cabecalho.fracaoIdeal,
        localizacao: cabecalho.localizacao,
        posicaoSolar: cabecalho.posicaoSol,
        fachada: cabecalho.fachada,
        garagem: cabecalho.garagem
      };
      
      // Dados básicos da reserva (readonly)
      this.dadosBasicosReserva = {
        nomeCompleto: dadosCliente.nomeCompleto,
        cpfCnpj: dadosCliente.cpfCnpj,
        clienteEstrangeiro: dadosCliente.clienteEstrangeiro,
        passaporte: dadosCliente.passaporte || undefined,
        contatoPrincipal: dadosCliente.contatoPrincipal,
        tipoContatoPrincipal: dadosCliente.tipoContatoPrincipal,
        contatoSecundario: dadosCliente.contatoSecundario || undefined,
        tipoContatoSecundario: dadosCliente.tipoContatoSecundario || undefined
      };
      
      // Preenche formulário com dados complementares (se existirem)
      this.preencherFormularioComDadosSalvos(dadosCliente);
      
      // Verifica se já existe proposta criada
      if (state.dadosReserva.metadata.existeProposta && state.dadosReserva.metadata.propostaId) {
        this.propostaId = state.dadosReserva.metadata.propostaId;
      }
    }
    
    this.carregando = false;
  }

  preencherFormularioComDadosSalvos(dadosCliente: DadosClientePropostaDTO): void {
    this.formulario.patchValue({
      dataNascimento: dadosCliente.dataNascimento ? new Date(dadosCliente.dataNascimento) : null,
      estadoCivil: dadosCliente.estadoCivil || '',
      profissao: dadosCliente.profissao || '',
      empresaTrabalho: dadosCliente.empresaTrabalho || '',
      tempoEmpresaMeses: dadosCliente.tempoEmpresaMeses || null,
      cnpjEmpresa: dadosCliente.cnpjEmpresa || '',
      rendaMensal: dadosCliente.rendaMensal || null,
      rendaComprovada: dadosCliente.rendaComprovada || null,
      outrasRendas: dadosCliente.outrasRendas || null,
      bancoPrincipal: dadosCliente.bancoPrincipal || '',
      agencia: dadosCliente.agencia || '',
      cep: dadosCliente.cep || '',
      logradouro: dadosCliente.logradouro || '',
      numero: dadosCliente.numero || '',
      complemento: dadosCliente.complemento || '',
      bairro: dadosCliente.bairro || '',
      cidade: dadosCliente.cidade || '',
      uf: dadosCliente.uf || '',
      midiaOrigem: dadosCliente.midiaOrigem || '',
      motivoCompra: dadosCliente.motivoCompra || ''
    });
  }

  /**
   * Busca endereço via CEP
   */
  buscarCep(): void {
    const cep = this.formulario.get('cep')?.value?.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
      return;
    }
    
    this.carregando = true;
    
    // Chama ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'CEP não encontrado'
          });
        } else {
          this.formulario.patchValue({
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || ''
          });
        }
        this.carregando = false;
      })
      .catch(error => {
        console.error('Erro ao buscar CEP:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar CEP'
        });
        this.carregando = false;
      });
  }

  getCamposObrigatorios(): Array<{ id: string; valor: any; label?: string }> {
    // Conforme documento: TODOS os campos do Step2 são OPCIONAIS
    // Apenas nome, CPF e contato (da reserva) são obrigatórios, mas já vêm preenchidos
    return [];
  }

  /**
   * Salva proposta completa no backend
   * POST /api/v1/propostas (se não existe) ou PUT (se já existe)
   */
  salvar(): void {
    this.tentouSalvar = true;
    
    const formValues = this.formulario.getRawValue();
    
    // Monta o payload conforme API v2.0
    const request: CriarPropostaRequest = {
      reservaId: this.reservaId,
      dadosCliente: {
        dataNascimento: formValues.dataNascimento ? this.formatarDataISO(formValues.dataNascimento) : '',
        estadoCivil: formValues.estadoCivil || '',
        profissao: formValues.profissao || '',
        empresaTrabalho: formValues.empresaTrabalho,
        tempoEmpresaMeses: formValues.tempoEmpresaMeses,
        cnpjEmpresa: formValues.cnpjEmpresa,
        rendaMensal: formValues.rendaMensal || 0,
        rendaComprovada: formValues.rendaComprovada,
        outrasRendas: formValues.outrasRendas,
        bancoPrincipal: formValues.bancoPrincipal,
        agencia: formValues.agencia,
        cep: formValues.cep || '',
        logradouro: formValues.logradouro || '',
        numero: formValues.numero || '',
        complemento: formValues.complemento,
        bairro: formValues.bairro || '',
        cidade: formValues.cidade || '',
        uf: formValues.uf || '',
        midiaOrigem: formValues.midiaOrigem,
        motivoCompra: formValues.motivoCompra
      }
    };

    this.salvando = true;
    
    const operacao = this.propostaId 
      ? this.propostaService.atualizarProposta(this.propostaId, request)
      : this.propostaService.criarProposta(request);
    
    operacao.subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.propostaId ? 'Proposta atualizada com sucesso!' : 'Proposta criada com sucesso!'
        });
        
        // Limpa state local
        this.propostaStateService.limparState();
        
        // Redireciona para listagem de propostas
        setTimeout(() => {
          this.router.navigate(['/propostas/lista']);
        }, 1500);
      },
      error: (error) => {
        console.error('Erro ao salvar proposta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.detail || 'Erro ao salvar proposta'
        });
        this.salvando = false;
      }
    });
  }

  private formatarDataISO(data: Date | string): string {
    if (typeof data === 'string') {
      return data;
    }
    const d = new Date(data);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  voltar(): void {
    this.router.navigate(['/propostas/step1'], {
      queryParams: { reservaId: this.reservaId }
    });
  }

  onStepChange(step: number): void {
    if (step === 1) {
      this.voltar();
    }
  }

  cancelar(): void {
    // Limpa state local
    this.propostaStateService.limparState();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Criação de proposta cancelada'
    });
    
    this.router.navigate(['/propostas/lista']);
  }
}
