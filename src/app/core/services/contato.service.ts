import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContatoDTO, ContatoRespostaDTO } from '../models/contato.model';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class ContatoService {
  private readonly apiUrl = `${environment.apiUrl}/contatos`;

  constructor(private http: HttpClient) {}

  /**
   * Envia mensagem de contato (endpoint público, sem autenticação)
   */
  enviarPublico(contato: ContatoDTO): Observable<ContatoDTO> {
    return this.http.post<ContatoDTO>(`${this.apiUrl}/publico`, contato);
  }

  /**
   * Lista todas as mensagens de contato com paginação e filtro
   * Requer autenticação e permissão CONTATO - CONSULTAR
   */
  listar(page: number = 0, size: number = 20, status?: string): Observable<Page<ContatoDTO>> {
    let params = new HttpParams()
      .set('page', page.toString());

    if (status) {
      params = params.set('status', status);
    }

    console.log('Parâmetros da requisição:', { page, status, params: params.toString() });

    return this.http.get<Page<ContatoDTO>>(this.apiUrl, { params });
  }

  /**
   * Busca mensagem de contato por ID
   * Requer autenticação e permissão CONTATO - CONSULTAR
   */
  buscarPorId(id: number): Observable<ContatoDTO> {
    return this.http.get<ContatoDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Marca mensagem como lida
   * Requer autenticação e permissão CONTATO - ALTERAR
   */
  marcarLida(id: number): Observable<ContatoDTO> {
    return this.http.patch<ContatoDTO>(`${this.apiUrl}/${id}/marcar-lida`, {});
  }

  /**
   * Responde mensagem de contato (envia email automaticamente)
   * Requer autenticação e permissão CONTATO - ALTERAR
   */
  responder(id: number, resposta: ContatoRespostaDTO): Observable<ContatoDTO> {
    return this.http.post<ContatoDTO>(`${this.apiUrl}/${id}/responder`, resposta);
  }

  /**
   * Conta mensagens pendentes
   * Requer autenticação e permissão CONTATO - CONSULTAR
   */
  contarPendentes(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/pendentes/count`);
  }
}
