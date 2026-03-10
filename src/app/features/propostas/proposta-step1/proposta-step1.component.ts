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
  DadosIniciaisReservaResponse,
  ProfissionalPropostaDTO,
  TipoProfissional,
  TIPO_PROFISSIONAL_LABELS,
  MidiaConhecimento,
  MIDIA_CONHECIMENTO_LABELS,
  MotivoCompra,
  MOTIVO_COMPRA_LABELS,
  SalvarDadosIniciaisRequest
} from '../../../core/models/proposta-fluxo.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-proposta-step1',
  templateUrl: './proposta-step1.component.html',
  styleUrls: ['./proposta-step1.component.scss'],
  providers: [MessageService]
})
export class PropostaStep1Component extends BaseFormComponent implements OnInit {
  formulario!: FormGroup;
  reservaId!: number;
  dadosUnidade?: DadosUnidadeHeaderDTO;
  carregando = false;
  stepsPreenchidos = 1; // Step 1 é o mínimo
  
  // Lista de imobiliárias para autocomplete
  imobiliarias: ImobiliariaComboDTO[] = [];
  
  // Options para dropdowns
  tiposProfissional = Object.keys(TipoProfissional).map(key => ({
    label: TIPO_PROFISSIONAL_LABELS[key as TipoProfissional],
    value: key
  }));
  
  midiasConhecimento = Object.keys(MidiaConhecimento).map(key => ({
    label: MIDIA_CONHECIMENTO_LABELS[key as MidiaConhecimento],
    value: key
  }));
  
  motivosCompra = Object.keys(MotivoCompra).map(key => ({
    label: MOTIVO_COMPRA_LABELS[key as MotivoCompra],
    value: key
  }));

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
    console.log('=== PropostaStep1Component ngOnInit ===');
    console.log('Route snapshot:', this.route.snapshot);
    console.log('Query params:', this.route.snapshot.queryParams);
    this.inicializarFormulario();
    this.obterReservaId();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      imobiliariaPrincipal: [null], // ID da imobiliária
      imobiliariaSecundaria: [null], // ID da imobiliária
      profissionaisPrincipal: this.fb.array([]),
      profissionaisSecundaria: this.fb.array([]),
      midiaConhecimento: [null],
      motivoCompra: [null],
      observacoes: ['']
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
   * Carrega dados iniciais: imobiliárias (para combo) e dados da reserva
   */
  carregarDadosIniciais(): void {
    this.carregando = true;
    
    forkJoin({
      imobiliarias: this.imobiliariaService.listarCombo(),
      dadosReserva: this.propostaService.buscarDadosIniciais(this.reservaId)
    }).subscribe({
      next: (results) => {
        console.log('=== Dados carregados ===');
        console.log('Imobiliárias:', results.imobiliarias);
        console.log('Dados Reserva:', results.dadosReserva);
        
        this.imobiliarias = results.imobiliarias;
        
        // Constrói o objeto dadosUnidade a partir dos campos da resposta
        this.dadosUnidade = this.mapearDadosUnidade(results.dadosReserva);
        
        // Inicializa o state da proposta
        this.propostaStateService.iniciarProposta(this.reservaId, results.dadosReserva);
        
        // Define quantos steps estão preenchidos
        const state = this.propostaStateService.getStateSnapshot();
        this.stepsPreenchidos = state.stepAtual;
        
        // Verifica se há dados salvos no state (edição/navegação de volta)
        const dadosSalvos = this.propostaStateService.getDadosStep(1);
        if (dadosSalvos && (dadosSalvos.imobiliariaPrincipalId || dadosSalvos.profissionaisPrincipal?.length > 0)) {
          console.log('Preenchendo formulário com dados salvos no state:', dadosSalvos);
          this.preencherFormularioComDadosSalvos(dadosSalvos);
        } else {
          // Preenche o formulário com dados da reserva
          this.preencherFormulario(results.dadosReserva);
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
  private mapearDadosUnidade(dados: DadosIniciaisReservaResponse): DadosUnidadeHeaderDTO {
    return {
      reservaId: dados.id,
      codEmpreendimento: dados.codEmpreendimento,
      codColigada: dados.codColigadaEmpreendimento,
      nomeEmpreendimento: dados.nomeEmpreendimento,
      nomeUnidade: `${dados.bloco}-${dados.unidade}`,
      bloco: dados.bloco,
      unidade: dados.unidade,
      tipoUnidade: dados.tipoUnidade,
      tipologia: dados.tipologia,
      sigla: dados.tipoUnidade,
      valor: 0, // Não vem na resposta atual
      valorTotal: 0, // Não vem na resposta atual
      fracaoIdeal: 0, // Não vem na resposta atual
      localizacao: '', // Não vem na resposta atual
      posicaoSolar: '', // Não vem na resposta atual
      fachada: '', // Não vem na resposta atual
      garagem: '' // Não vem na resposta atual
    };
  }



  preencherFormulario(dados: DadosIniciaisReservaResponse): void {
    // Preenche profissionais ANTES de setar os IDs das imobiliárias
    this.profissionaisPrincipal.clear();
    dados.profissionaisPrincipal?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisPrincipal.push(this.criarProfissional(prof));
    });
    
    this.profissionaisSecundaria.clear();
    dados.profissionaisSecundaria?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisSecundaria.push(this.criarProfissional(prof));
    });
    
    // Se não houver profissionais principais, adiciona um vazio
    if (this.profissionaisPrincipal.length === 0) {
      this.adicionarProfissional('principal');
    }

    // Preenche os outros campos
    this.formulario.patchValue({
      imobiliariaPrincipal: dados.imobiliariaPrincipalId,
      imobiliariaSecundaria: dados.imobiliariaSecundariaId || null,
      midiaConhecimento: null, // Não vem na resposta
      motivoCompra: null, // Não vem na resposta
      observacoes: dados.observacoes || ''
    });
  }

  /**
   * Preenche formulário com dados salvos no state (edição/navegação de volta)
   */
  private preencherFormularioComDadosSalvos(dados: any): void {
    this.profissionaisPrincipal.clear();
    dados.profissionaisPrincipal?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisPrincipal.push(this.criarProfissional(prof));
    });
    
    this.profissionaisSecundaria.clear();
    dados.profissionaisSecundaria?.forEach((prof: ProfissionalPropostaDTO) => {
      this.profissionaisSecundaria.push(this.criarProfissional(prof));
    });
    
    if (this.profissionaisPrincipal.length === 0) {
      this.adicionarProfissional('principal');
    }

    this.formulario.patchValue({
      imobiliariaPrincipal: dados.imobiliariaPrincipalId,
      imobiliariaSecundaria: dados.imobiliariaSecundariaId || null,
      midiaConhecimento: dados.midiaConhecimento,
      motivoCompra: dados.motivoCompra,
      observacoes: dados.observacoes || ''
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
   * Salva dados no state local e navega para próximo step
   * NÃO persiste no backend - salvamento completo acontece na tela de resumo
   */
  salvar(): void {
    this.tentouSalvar = true;
    
    if (!this.validarFormulario()) {
      return;
    }

    const formValues = this.formulario.getRawValue();
    
    // Monta o objeto no formato esperado
    const dados = {
      imobiliariaPrincipalId: formValues.imobiliariaPrincipal || null,
      imobiliariaSecundariaId: formValues.imobiliariaSecundaria || null,
      profissionaisPrincipal: this.profissionaisPrincipal.controls.map(control => {
        const value = control.getRawValue();
        return {
          tipoProfissional: value.tipo,
          corretorId: value.corretorId,
          cpfCorretor: value.cpfCorretor,
          nomeCorretor: undefined, // Será preenchido no backend
          nomeTexto: value.nomeTexto
        };
      }),
      profissionaisSecundaria: this.profissionaisSecundaria.controls.map(control => {
        const value = control.getRawValue();
        return {
          tipoProfissional: value.tipo,
          corretorId: value.corretorId,
          cpfCorretor: value.cpfCorretor,
          nomeCorretor: undefined,
          nomeTexto: value.nomeTexto
        };
      }),
      midiaConhecimento: formValues.midiaConhecimento,
      motivoCompra: formValues.motivoCompra,
      observacoes: formValues.observacoes
    };

    // Salva no state local
    this.propostaStateService.salvarDadosIniciais(dados);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Dados salvos! Prossiga para o próximo passo.'
    });
    
    // Navega para Step 2
    this.router.navigate(['/propostas/step2'], {
      queryParams: { reservaId: this.reservaId }
    });
  }

  voltar(): void {
    this.router.navigate(['/propostas/lista']);
  }

  /**
   * Navega para o step selecionado no header
   */
  onStepChange(step: number): void {
    if (step === 1) {
      return; // Já está no step 1
    }
    if (step === 2) {
      this.router.navigate(['/propostas/step2'], {
        queryParams: { reservaId: this.reservaId }
      });
    }
  }
}
