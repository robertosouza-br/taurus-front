import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { PropostaService } from '../../../core/services/proposta.service';
import { PropostaStateService } from '../../../core/services/proposta-state.service';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { ImobiliariaComboDTO } from '../../../core/models/imobiliaria.model';
import { 
  DadosUnidadeHeaderDTO, 
  PropostaCompletaResponse,
  DadosIniciaisPropostaDTO,
  DadosClientePropostaDTO,
  ProfissionalPropostaDTO,
  TipoProfissional,
  TIPO_PROFISSIONAL_LABELS,
  MidiaOrigem,
  MIDIA_ORIGEM_LABELS,
  MIDIA_CONHECIMENTO_LABELS,
  MotivoCompra,
  MOTIVO_COMPRA_LABELS,
  EstadoCivil,
  ESTADO_CIVIL_LABELS,
  CriarPropostaRequest
} from '../../../core/models/proposta-fluxo.model';
import { forkJoin } from 'rxjs';

/**
 * Componente unificado de criação/edição de proposta
 * Combina todos os dados em uma única tela (anteriormente dividido em Step1 e Step2)
 */
@Component({
  selector: 'app-proposta-nova',
  templateUrl: './proposta-nova.component.html',
  styleUrls: ['./proposta-nova.component.scss'],
  providers: [MessageService]
})
export class PropostaNovaComponent extends BaseFormComponent implements OnInit {
  formulario!: FormGroup;
  reservaId!: number;
  propostaId?: number;
  dadosUnidade?: DadosUnidadeHeaderDTO;
  carregando = false;
  override salvando = false;
  
  // Controle de collapse das seções
  expandirDadosIniciaisDetalhes = false;
  expandirDadosBasicosDetalhes = false;
  
  // Lista de imobiliárias para autocomplete
  imobiliarias: ImobiliariaComboDTO[] = [];
  
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
  
  // Options para autocompletes - Dados Iniciais
  tiposProfissional = Object.keys(TipoProfissional).map(key => ({
    label: TIPO_PROFISSIONAL_LABELS[key as TipoProfissional],
    value: key
  }));
  tiposProfissionalFiltrados: any[] = [];
  
  midiasConhecimento = Object.keys(MidiaOrigem).map(key => ({
    label: MIDIA_CONHECIMENTO_LABELS[key as MidiaOrigem],
    value: key
  }));
  midiasConhecimentoFiltradas: any[] = [];
  
  // Options para autocompletes - Dados do Cliente
  estadosCivis = Object.keys(EstadoCivil).map(key => ({
    label: ESTADO_CIVIL_LABELS[key as EstadoCivil],
    value: key
  }));
  estadosCivisFiltrados: any[] = [];
  
  midiasOrigem = Object.keys(MidiaOrigem).map(key => ({
    label: MIDIA_ORIGEM_LABELS[key as MidiaOrigem],
    value: key
  }));
  midiasOrigemFiltradas: any[] = [];
  
  motivosCompra = Object.keys(MotivoCompra).map(key => ({
    label: MOTIVO_COMPRA_LABELS[key as MotivoCompra],
    value: key
  }));
  motivosCompraFiltrados: any[] = [];
  
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
  ufsFiltradas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propostaService: PropostaService,
    private propostaStateService: PropostaStateService,
    private imobiliariaService: ImobiliariaService,
    private messageService: MessageService
  ) {
    super();
  }

  ngOnInit(): void {
    console.log('=== PropostaNovaComponent ngOnInit ===');
    console.log('Route snapshot:', this.route.snapshot);
    console.log('Query params:', this.route.snapshot.queryParams);
    this.inicializarFormulario();
    this.obterReservaId();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      // ===== DADOS INICIAIS (anteriormente Step 1) =====
      imobiliariaPrincipal: [null],
      imobiliariaSecundaria: [null],
      profissionaisPrincipal: this.fb.array([]),
      profissionaisSecundaria: this.fb.array([]),
      midiaConhecimento: [null],
      motivoCompraInicial: [null], // Renomeado para diferenciar
      observacoes: [''],
      
      // ===== DADOS DO CLIENTE (anteriormente Step 2) =====
      // Seção 1: Dados Básicos (campos complementares)
      dataNascimento: [''],
      estadoCivil: [''],
      
      // Seção 2: Informações Profissionais
      profissao: [''],
      empresaTrabalho: [''],
      tempoEmpresaMeses: [null],
      cnpjEmpresa: [''],
      
      // Seção 3: Informações Financeiras
      rendaMensal: [null],
      rendaComprovada: [null],
      outrasRendas: [null],
      bancoPrincipal: [''],
      agencia: [''],
      
      // Seção 4: Endereço Residencial
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: [''],
      
      // Seção 5: Origem da Venda
      midiaOrigem: [''],
      motivoCompra: ['']
    });
  }

  get profissionaisPrincipal(): FormArray {
    return this.formulario.get('profissionaisPrincipal') as FormArray;
  }

  get profissionaisSecundaria(): FormArray {
    return this.formulario.get('profissionaisSecundaria') as FormArray;
  }

  criarProfissional(profissional?: ProfissionalPropostaDTO): FormGroup {
    return this.fb.group({
      tipo: [profissional?.tipoProfissional || null, Validators.required],
      nomeTexto: [profissional?.nomeTexto || ''],
      corretorId: [profissional?.corretorId || null],
      cpfCorretor: [{ value: profissional?.cpfCorretor || '', disabled: true }]
    });
  }

  adicionarProfissional(tipo: 'principal' | 'secundaria' = 'principal'): void {
    if (tipo === 'principal') {
      this.profissionaisPrincipal.push(this.criarProfissional());
    } else {
      this.profissionaisSecundaria.push(this.criarProfissional());
    }
  }

  removerProfissional(index: number, tipo: 'principal' | 'secundaria' = 'principal'): void {
    if (tipo === 'principal') {
      this.profissionaisPrincipal.removeAt(index);
    } else {
      this.profissionaisSecundaria.removeAt(index);
    }
  }

  onTipoProfissionalChange(index: number, tipo: 'principal' | 'secundaria' = 'principal'): void {
    const arrayProfissionais = tipo === 'principal' ? this.profissionaisPrincipal : this.profissionaisSecundaria;
    const profissionalGroup = arrayProfissionais.at(index) as FormGroup;
    const tipoProfissional = profissionalGroup.get('tipo')?.value;
    
    if (tipoProfissional === TipoProfissional.CORRETOR) {
      // CORRETOR: habilita busca por CPF, desabilita nomeTexto
      profissionalGroup.get('cpfCorretor')?.enable();
      profissionalGroup.get('nomeTexto')?.disable();
      profissionalGroup.get('nomeTexto')?.clearValidators();
    } else {
      // Outros tipos: desabilita CPF, habilita nomeTexto
      profissionalGroup.get('cpfCorretor')?.disable();
      profissionalGroup.get('cpfCorretor')?.setValue('');
      profissionalGroup.get('corretorId')?.setValue(null);
      profissionalGroup.get('nomeTexto')?.enable();
      profissionalGroup.get('nomeTexto')?.setValidators(Validators.required);
    }
    profissionalGroup.get('nomeTexto')?.updateValueAndValidity();
  }

  obterReservaId(): void {
    this.route.queryParams.subscribe(params => {
      this.reservaId = +params['reservaId'];
      if (this.reservaId) {
        this.carregarDadosIniciais();
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

  /**
   * Carrega dados iniciais: imobiliárias (para combo) e dados completos da proposta
   */
  carregarDadosIniciais(): void {
    this.carregando = true;
    
    forkJoin({
      imobiliarias: this.imobiliariaService.listarCombo(),
      dadosCompletos: this.propostaService.buscarDadosCompletos(this.reservaId)
    }).subscribe({
      next: (results) => {
        console.log('=== Dados carregados ===');
        console.log('Imobiliárias:', results.imobiliarias);
        console.log('Dados Completos:', results.dadosCompletos);
        
        this.imobiliarias = results.imobiliarias;
        
        // Constrói o objeto dadosUnidade a partir do cabeçalho
        this.dadosUnidade = this.mapearDadosUnidade(results.dadosCompletos);
        
        // Preenche dados básicos readonly da reserva
        this.preencherDadosBasicosReserva(results.dadosCompletos.dadosCliente);
        
        // Preenche o formulário com dados iniciais e do cliente
        this.preencherFormulario(results.dadosCompletos);
        
        // Verifica se já existe proposta criada através dos metadados
        if (results.dadosCompletos.metadata?.existeProposta && results.dadosCompletos.metadata?.propostaId) {
          this.propostaId = results.dadosCompletos.metadata.propostaId;
        }
        
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados iniciais:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar os dados da proposta'
        });
        this.carregando = false;
      }
    });
  }

  /**
   * Mapeia a resposta do backend para o objeto DadosUnidadeHeaderDTO
   */
  private mapearDadosUnidade(dados: PropostaCompletaResponse): DadosUnidadeHeaderDTO {
    const cabecalho = dados.cabecalho;
    return {
      reservaId: dados.dadosIniciais.reservaId,
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
  }

  /**
   * Preenche dados básicos readonly (nome, CPF, contatos) vindos da reserva
   */
  private preencherDadosBasicosReserva(dadosCliente: DadosClientePropostaDTO): void {
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
  }

  /**
   * Preenche formulário completo com todos os dados
   */
  preencherFormulario(dados: PropostaCompletaResponse): void {
    const dadosIniciais = dados.dadosIniciais;
    const dadosCliente = dados.dadosCliente;
    
    // === DADOS INICIAIS ===
    // Preenche profissionais ANTES de setar os IDs das imobiliárias
    this.profissionaisPrincipal.clear();
    dadosIniciais.profissionaisPrincipal?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisPrincipal.push(this.criarProfissional(prof));
    });
    
    this.profissionaisSecundaria.clear();
    dadosIniciais.profissionaisSecundaria?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisSecundaria.push(this.criarProfissional(prof));
    });
    
    // Se não houver profissionais principais, adiciona um vazio
    if (this.profissionaisPrincipal.length === 0) {
      this.adicionarProfissional('principal');
    }

    // === PREENCHE TODOS OS CAMPOS ===
    this.formulario.patchValue({
      // Dados Iniciais
      imobiliariaPrincipal: dadosIniciais.imobiliariaPrincipalId,
      imobiliariaSecundaria: dadosIniciais.imobiliariaSecundariaId || null,
      midiaConhecimento: null, // Não vem na resposta de dados iniciais
      motivoCompraInicial: null, // Não vem na resposta de dados iniciais
      observacoes: dadosIniciais.observacoes || '',
      
      // Dados do Cliente - Básicos
      dataNascimento: dadosCliente.dataNascimento ? new Date(dadosCliente.dataNascimento) : null,
      estadoCivil: dadosCliente.estadoCivil || '',
      
      // Dados do Cliente - Profissionais
      profissao: dadosCliente.profissao || '',
      empresaTrabalho: dadosCliente.empresaTrabalho || '',
      tempoEmpresaMeses: dadosCliente.tempoEmpresaMeses || null,
      cnpjEmpresa: dadosCliente.cnpjEmpresa || '',
      
      // Dados do Cliente - Financeiros
      rendaMensal: dadosCliente.rendaMensal || null,
      rendaComprovada: dadosCliente.rendaComprovada || null,
      outrasRendas: dadosCliente.outrasRendas || null,
      bancoPrincipal: dadosCliente.bancoPrincipal || '',
      agencia: dadosCliente.agencia || '',
      
      // Dados do Cliente - Endereço
      cep: dadosCliente.cep || '',
      logradouro: dadosCliente.logradouro || '',
      numero: dadosCliente.numero || '',
      complemento: dadosCliente.complemento || '',
      bairro: dadosCliente.bairro || '',
      cidade: dadosCliente.cidade || '',
      uf: dadosCliente.uf || '',
      
      // Dados do Cliente - Origem
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
    // Validação dinâmica baseada nos profissionais
    const campos: Array<{ id: string; valor: any; label?: string }> = [];
    
    this.profissionaisPrincipal.controls.forEach((control, index) => {
      const tipo = control.get('tipo')?.value;
      if (!tipo) {
        campos.push({ id: `tipo_principal_${index}`, valor: tipo, label: `Tipo do profissional principal ${index + 1}` });
      } else if (tipo === TipoProfissional.CORRETOR && !control.get('corretorId')?.value) {
        campos.push({ id: `corretor_principal_${index}`, valor: control.get('corretorId')?.value, label: `CPF do corretor principal ${index + 1}` });
      } else if (tipo !== TipoProfissional.CORRETOR && !control.get('nomeTexto')?.value) {
        campos.push({ id: `nome_principal_${index}`, valor: control.get('nomeTexto')?.value, label: `Nome do profissional principal ${index + 1}` });
      }
    });
    
    return campos;
  }

  /**
   * Salva proposta completa no backend
   * POST /api/v1/propostas (se não existe) ou PUT (se já existe)
   */
  salvar(): void {
    this.tentouSalvar = true;
    
    if (!this.validarFormulario()) {
      return;
    }

    const formValues = this.formulario.getRawValue();
    
    // Monta o payload conforme API (CriarPropostaRequest contém apenas reservaId e dadosCliente)
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
        
        // Limpa state local (se houver)
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

  // ===== Métodos de filtro para autocompletes =====
  
  filtrarTiposProfissional(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.tiposProfissionalFiltrados = query 
      ? this.tiposProfissional.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.tiposProfissional];
  }

  mostrarTodosTiposProfissional(): void {
    this.tiposProfissionalFiltrados = [...this.tiposProfissional];
  }

  filtrarEstadosCivis(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.estadosCivisFiltrados = query 
      ? this.estadosCivis.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.estadosCivis];
  }

  mostrarTodosEstadosCivis(): void {
    this.estadosCivisFiltrados = [...this.estadosCivis];
  }

  filtrarMidiasConhecimento(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.midiasConhecimentoFiltradas = query 
      ? this.midiasConhecimento.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.midiasConhecimento];
  }

  mostrarTodasMidiasConhecimento(): void {
    this.midiasConhecimentoFiltradas = [...this.midiasConhecimento];
  }

  filtrarMidiasOrigem(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.midiasOrigemFiltradas = query 
      ? this.midiasOrigem.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.midiasOrigem];
  }

  mostrarTodasMidiasOrigem(): void {
    this.midiasOrigemFiltradas = [...this.midiasOrigem];
  }

  filtrarMotivosCompra(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.motivosCompraFiltrados = query 
      ? this.motivosCompra.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.motivosCompra];
  }

  mostrarTodosMotivosCompra(): void {
    this.motivosCompraFiltrados = [...this.motivosCompra];
  }

  filtrarUfs(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.ufsFiltradas = query 
      ? this.ufs.filter(opt => opt.label.toLowerCase().includes(query))
      : [...this.ufs];
  }

  mostrarTodasUfs(): void {
    this.ufsFiltradas = [...this.ufs];
  }

  formatarContatoReserva(contato?: string | null, tipo?: string | null): string {
    if (!contato) {
      return '';
    }

    return tipo ? `${contato} (${tipo})` : contato;
  }

  voltar(): void {
    this.router.navigate(['/propostas/lista']);
  }

  cancelar(): void {
    // Limpa state local (se houver)
    this.propostaStateService.limparState();
    
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Criação de proposta cancelada'
    });
    
    this.router.navigate(['/propostas/lista']);
  }
}
