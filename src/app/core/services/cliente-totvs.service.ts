import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClienteTotvsCadastroBasicoRequest,
  ClienteTotvsCadastroBasicoResponse,
  ClienteTotvsConsultaResponse,
  PessoaFisOuJur
} from '../models/cliente-totvs.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteTotvsService {
  private readonly baseUrl = `${environment.apiUrl}/clientes/totvs`;

  constructor(private http: HttpClient) {}

  consultarPorCpfCnpj(cpfCnpj: string, codColigada: number = 0): Observable<ClienteTotvsConsultaResponse> {
    return this.consultarPorDocumento(cpfCnpj, codColigada, false);
  }

  consultarPorDocumento(
    documento: string,
    codColigada: number = 0,
    clienteEstrangeiro: boolean = false
  ): Observable<ClienteTotvsConsultaResponse> {
    const identificador = this.normalizarDocumentoConsulta(documento, clienteEstrangeiro);
    const params = new HttpParams().set('codColigada', codColigada.toString());

    return this.http.get<ClienteTotvsConsultaResponse>(
      `${this.baseUrl}/consultar/${encodeURIComponent(identificador)}`,
      {
        params: params.set('clienteEstrangeiro', clienteEstrangeiro.toString())
      }
    );
  }

  cadastrarBasico(payload: ClienteTotvsCadastroBasicoRequest): Observable<ClienteTotvsCadastroBasicoResponse> {
    return this.http.post<ClienteTotvsCadastroBasicoResponse>(`${this.baseUrl}/cadastrar-basico`, payload);
  }

  sanitizarDocumento(valor?: string | null): string {
    return (valor || '').replace(/\D/g, '');
  }

  normalizarDocumentoConsulta(valor?: string | null, clienteEstrangeiro: boolean = false): string {
    if (clienteEstrangeiro) {
      return (valor || '').trim().replace(/\s+/g, '').toUpperCase();
    }

    return this.sanitizarDocumento(valor);
  }

  sanitizarTelefone(valor?: string | null): string | null {
    const telefone = this.sanitizarDocumento(valor);
    return telefone || null;
  }

  sanitizarCep(valor?: string | null): string | null {
    const cep = this.sanitizarDocumento(valor);
    return cep || null;
  }

  determinarTipoPessoa(documento: string): PessoaFisOuJur {
    return this.sanitizarDocumento(documento).length > 11 ? 'J' : 'F';
  }

  criarPayloadCadastroBasico(
    nome: string,
    documento: string,
    clienteEstrangeiro: boolean
  ): ClienteTotvsCadastroBasicoRequest {
    return {
      cpfCnpj: this.sanitizarDocumento(documento),
      nome: (nome || '').trim(),
      clienteEstrangeiro: clienteEstrangeiro ? 'true' : 'false'
    };
  }

  obterMensagemErro(error: any, fallback: string): string {
    const mensagem = error?.error?.mensagem || error?.error?.message;
    const detalhe = error?.error?.erro;

    if (typeof mensagem === 'string' && mensagem.trim()) {
      if (typeof detalhe === 'string' && detalhe.trim()) {
        return `${mensagem} ${detalhe}`;
      }

      return mensagem;
    }

    if (typeof detalhe === 'string' && detalhe.trim()) {
      return detalhe;
    }

    return fallback;
  }
}