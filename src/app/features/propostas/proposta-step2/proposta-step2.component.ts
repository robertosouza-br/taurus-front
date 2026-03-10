import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BaseFormComponent } from '../../../shared/base/base-form.component';
import { PropostaService } from '../../../core/services/proposta.service';
import { PropostaStateService } from '../../../core/services/proposta-state.service';
import { 
  DadosUnidadeHeaderDTO, 
  DadosClientePropostaDTO,
  EstadoCivil,
  ESTADO_CIVIL_LABELS
} from '../../../core/models/proposta-fluxo.model';

@Component({
  selector: 'app-proposta-step2',
  templateUrl: './proposta-step2.component.html',
  styleUrls: ['./proposta-step2.component.scss'],
  providers: [MessageService]
})
export class PropostaStep2Component extends BaseFormComponent implements OnInit {
  formulario!: FormGroup;
  reservaId!: number;
  dadosUnidade?: DadosUnidadeHeaderDTO;
  carregando = false;
  stepsPreenchidos = 2; // Step 2 pode acessar step 1 e 2
  
  // Options para dropdowns
  estadosCivis = Object.keys(EstadoCivil).map(key => ({
    label: ESTADO_CIVIL_LABELS[key as EstadoCivil],
    value: key
  }));

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
    this.configurarValidacaoDinamica();
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      // Dados Pessoais
      nome: ['', Validators.required],
      cpf: ['', Validators.required],
      passaporte: [''],
      dataNascimento: ['', Validators.required],
      estadoCivil: [null, Validators.required],
      profissao: [''],
      rendaMensal: [null],
      telefone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      
      // Endereço
      endereco: this.fb.group({
        cep: ['', Validators.required],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        estado: ['', Validators.required]
      }),
      
      // Cônjuge (obrigatório se CASADO)
      conjuge: this.fb.group({
        nome: [''],
        cpf: [''],
        passaporte: [''],
        dataNascimento: [''],
        profissao: [''],
        rendaMensal: [null],
        telefone: [''],
        email: ['']
      })
    });
  }

  configurarValidacaoDinamica(): void {
    this.formulario.get('estadoCivil')?.valueChanges.subscribe(estadoCivil => {
      const conjugeGroup = this.formulario.get('conjuge');
      
      if (estadoCivil === EstadoCivil.CASADO) {
        // Torna campos do cônjuge obrigatórios
        conjugeGroup?.get('nome')?.setValidators(Validators.required);
        conjugeGroup?.get('cpf')?.setValidators(Validators.required);
        conjugeGroup?.get('dataNascimento')?.setValidators(Validators.required);
        conjugeGroup?.get('telefone')?.setValidators(Validators.required);
        conjugeGroup?.get('email')?.setValidators([Validators.required, Validators.email]);
      } else {
        // Remove obrigatoriedade dos campos do cônjuge
        conjugeGroup?.get('nome')?.clearValidators();
        conjugeGroup?.get('cpf')?.clearValidators();
        conjugeGroup?.get('dataNascimento')?.clearValidators();
        conjugeGroup?.get('telefone')?.clearValidators();
        conjugeGroup?.get('email')?.clearValidators();
      }
      
      // Atualiza validação
      if (conjugeGroup) {
        Object.keys((conjugeGroup as FormGroup).controls).forEach(key => {
          conjugeGroup?.get(key)?.updateValueAndValidity();
        });
      }
    });
  }

  get mostrarConjuge(): boolean {
    return this.formulario.get('estadoCivil')?.value === EstadoCivil.CASADO;
  }

  obterReservaId(): void {
    this.route.queryParams.subscribe(params => {
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
      // State não existe ou não corresponde à reserva atual - redireciona para Step 1
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, preencha os dados iniciais primeiro'
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
      this.dadosUnidade = {
        reservaId: state.dadosReserva.id,
        codEmpreendimento: state.dadosReserva.codEmpreendimento,
        codColigada: state.dadosReserva.codColigadaEmpreendimento,
        nomeEmpreendimento: state.dadosReserva.nomeEmpreendimento,
        nomeUnidade: `${state.dadosReserva.bloco}-${state.dadosReserva.unidade}`,
        bloco: state.dadosReserva.bloco,
        unidade: state.dadosReserva.unidade,
        tipoUnidade: state.dadosReserva.tipoUnidade,
        tipologia: state.dadosReserva.tipologia,
        sigla: state.dadosReserva.tipoUnidade,
        valor: 0,
        valorTotal: 0,
        fracaoIdeal: 0,
        localizacao: '',
        posicaoSolar: '',
        fachada: '',
        garagem: ''
      };
    }
    
    // Preenche formulário se já houver dados salvos no Step 2
    const dadosCliente = state.dadosCliente;
    if (dadosCliente) {
      this.preencherFormularioComDadosSalvos(dadosCliente);
    }
    
    this.carregando = false;
  }

  preencherFormularioComDadosSalvos(dados: any): void {
    this.formulario.patchValue({
      nome: dados.nome,
      cpf: dados.cpf,
      passaporte: dados.passaporte,
      dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
      estadoCivil: dados.estadoCivil,
      profissao: dados.profissao,
      rendaMensal: dados.rendaMensal,
      telefone: dados.telefone,
      email: dados.email,
      endereco: dados.endereco || {},
      conjuge: dados.conjuge || {}
    });
  }

  getCamposObrigatorios(): Array<{ id: string; valor: any; label?: string }> {
    const campos = [
      { id: 'nome', valor: this.formulario.get('nome')?.value, label: 'Nome' },
      { id: 'cpf', valor: this.formulario.get('cpf')?.value, label: 'CPF' },
      { id: 'dataNascimento', valor: this.formulario.get('dataNascimento')?.value, label: 'Data de Nascimento' },
      { id: 'estadoCivil', valor: this.formulario.get('estadoCivil')?.value, label: 'Estado Civil' },
      { id: 'telefone', valor: this.formulario.get('telefone')?.value, label: 'Telefone' },
      { id: 'email', valor: this.formulario.get('email')?.value, label: 'Email' }
    ];
    
    // Endereço
    const endereco = this.formulario.get('endereco');
    campos.push(
      { id: 'endereco.cep', valor: endereco?.get('cep')?.value, label: 'CEP' },
      { id: 'endereco.logradouro', valor: endereco?.get('logradouro')?.value, label: 'Logradouro' },
      { id: 'endereco.numero', valor: endereco?.get('numero')?.value, label: 'Número' },
      { id: 'endereco.bairro', valor: endereco?.get('bairro')?.value, label: 'Bairro' },
      { id: 'endereco.cidade', valor: endereco?.get('cidade')?.value, label: 'Cidade' },
      { id: 'endereco.estado', valor: endereco?.get('estado')?.value, label: 'Estado' }
    );
    
    // Cônjuge (se CASADO)
    if (this.mostrarConjuge) {
      const conjuge = this.formulario.get('conjuge');
      campos.push(
        { id: 'conjuge.nome', valor: conjuge?.get('nome')?.value, label: 'Nome do Cônjuge' },
        { id: 'conjuge.cpf', valor: conjuge?.get('cpf')?.value, label: 'CPF do Cônjuge' },
        { id: 'conjuge.dataNascimento', valor: conjuge?.get('dataNascimento')?.value, label: 'Data de Nascimento do Cônjuge' },
        { id: 'conjuge.telefone', valor: conjuge?.get('telefone')?.value, label: 'Telefone do Cônjuge' },
        { id: 'conjuge.email', valor: conjuge?.get('email')?.value, label: 'Email do Cônjuge' }
      );
    }
    
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
    
    // Monta o objeto para armazenar no state
    const dados = {
      nome: formValues.nome,
      cpf: formValues.cpf,
      estrangeiro: !!formValues.passaporte,
      passaporte: formValues.passaporte,
      dataNascimento: formValues.dataNascimento,
      estadoCivil: formValues.estadoCivil,
      profissao: formValues.profissao,
      rendaMensal: formValues.rendaMensal,
      telefone: formValues.telefone,
      email: formValues.email,
      endereco: formValues.endereco,
      conjuge: this.mostrarConjuge ? formValues.conjuge : null
    };

    // Salva no state local
    this.propostaStateService.salvarDadosCliente(dados);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Dados salvos! Prossiga para o próximo passo.'
    });
    
    // TODO: Quando Step 3 estiver pronto, navegar para ele
    // Por enquanto, volta para a lista
    setTimeout(() => {
      this.router.navigate(['/propostas/lista']);
    }, 1500);
  }

  voltar(): void {
    // Volta para Step 1
    this.propostaStateService.voltarParaStep(1);
    this.router.navigate(['/propostas/step1'], {
      queryParams: { reservaId: this.reservaId }
    });
  }

  /**
   * Navega para o step selecionado no header
   */
  onStepChange(step: number): void {
    if (step === 2) {
      return; // Já está no step 2
    }
    if (step === 1) {
      this.voltar();
    }
  }
}
