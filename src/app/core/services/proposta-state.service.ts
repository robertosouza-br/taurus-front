import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  DadosIniciaisReservaResponse,
  ProfissionalPropostaDTO 
} from '../models/proposta-fluxo.model';

/**
 * Serviço para gerenciar o estado da proposta durante o fluxo multi-step
 * Armazena dados localmente sem persistir no backend até o final
 */
@Injectable({
  providedIn: 'root'
})
export class PropostaStateService {
  private propostaState: PropostaState = this.getInitialState();
  private propostaState$ = new BehaviorSubject<PropostaState>(this.propostaState);

  constructor() {
    // Tenta carregar do localStorage ao iniciar
    this.carregarDoLocalStorage();
  }

  private getInitialState(): PropostaState {
    return {
      reservaId: null,
      stepAtual: 1,
      dadosIniciais: {
        imobiliariaPrincipalId: null,
        imobiliariaSecundariaId: null,
        profissionaisPrincipal: [],
        profissionaisSecundaria: [],
        midiaConhecimento: null,
        motivoCompra: null,
        observacoes: null
      },
      dadosCliente: null,
      dadosReserva: null // Dados carregados do backend (readonly)
    };
  }

  /**
   * Obtém o estado completo da proposta como Observable
   */
  getState(): Observable<PropostaState> {
    return this.propostaState$.asObservable();
  }

  /**
   * Obtém o estado atual (snapshot)
   */
  getStateSnapshot(): PropostaState {
    return this.propostaState;
  }

  /**
   * Inicia uma nova proposta com a reserva selecionada
   */
  iniciarProposta(reservaId: number, dadosReserva: DadosIniciaisReservaResponse): void {
    this.propostaState = {
      ...this.getInitialState(),
      reservaId,
      dadosReserva,
      stepAtual: 1
    };
    this.atualizarState();
  }

  /**
   * Salva os dados do Step 1 (Dados Iniciais)
   */
  salvarDadosIniciais(dados: DadosIniciaisStep): void {
    this.propostaState.dadosIniciais = dados;
    this.propostaState.stepAtual = 2;
    this.atualizarState();
  }

  /**
   * Salva os dados do Step 2 (Dados do Cliente)
   */
  salvarDadosCliente(dados: any): void {
    this.propostaState.dadosCliente = dados;
    this.propostaState.stepAtual = 3;
    this.atualizarState();
  }

  /**
   * Obtém dados de um step específico
   */
  getDadosStep(step: number): any {
    switch (step) {
      case 1:
        return this.propostaState.dadosIniciais;
      case 2:
        return this.propostaState.dadosCliente;
      default:
        return null;
    }
  }

  /**
   * Volta para um step anterior (para edição)
   */
  voltarParaStep(step: number): void {
    this.propostaState.stepAtual = step;
    this.atualizarState();
  }

  /**
   * Limpa todo o estado (cancelar proposta)
   */
  limparState(): void {
    this.propostaState = this.getInitialState();
    this.atualizarState();
    localStorage.removeItem('proposta-state');
  }

  /**
   * Atualiza o state e notifica observadores
   */
  private atualizarState(): void {
    this.propostaState$.next(this.propostaState);
    this.salvarNoLocalStorage();
  }

  /**
   * Salva no localStorage para não perder dados se fechar navegador
   */
  private salvarNoLocalStorage(): void {
    try {
      localStorage.setItem('proposta-state', JSON.stringify(this.propostaState));
    } catch (error) {
      console.warn('Erro ao salvar proposta no localStorage:', error);
    }
  }

  /**
   * Carrega do localStorage se existir
   */
  private carregarDoLocalStorage(): void {
    try {
      const saved = localStorage.getItem('proposta-state');
      if (saved) {
        this.propostaState = JSON.parse(saved);
        this.propostaState$.next(this.propostaState);
      }
    } catch (error) {
      console.warn('Erro ao carregar proposta do localStorage:', error);
    }
  }

  /**
   * Verifica se há uma proposta em andamento
   */
  temPropostaEmAndamento(): boolean {
    return this.propostaState.reservaId !== null;
  }

  /**
   * Obtém o payload completo para enviar ao backend
   */
  getPayloadCompleto(): any {
    return {
      reservaId: this.propostaState.reservaId,
      dadosIniciais: this.propostaState.dadosIniciais,
      dadosCliente: this.propostaState.dadosCliente
      // Adicionar outros steps conforme necessário
    };
  }
}

/**
 * Interface do estado completo da proposta
 */
export interface PropostaState {
  reservaId: number | null;
  stepAtual: number;
  dadosIniciais: DadosIniciaisStep;
  dadosCliente: any | null;
  dadosReserva: DadosIniciaisReservaResponse | null; // Dados readonly da reserva
}

/**
 * Interface dos dados do Step 1
 */
export interface DadosIniciaisStep {
  imobiliariaPrincipalId: number | null;
  imobiliariaSecundariaId: number | null;
  profissionaisPrincipal: ProfissionalPropostaDTO[];
  profissionaisSecundaria: ProfissionalPropostaDTO[];
  midiaConhecimento: string | null;
  motivoCompra: string | null;
  observacoes: string | null;
}
