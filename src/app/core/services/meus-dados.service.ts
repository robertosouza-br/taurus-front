import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeusDadosDTO, AtualizarMeusDadosDTO, TrocarSenhaDTO } from '../models/meus-dados.model';

/**
 * Serviço para gerenciamento de dados do usuário autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class MeusDadosService {
  private readonly apiUrl = `${environment.apiUrl}/meus-dados`;

  constructor(private http: HttpClient) {}

  /**
   * Busca os dados do usuário autenticado
   */
  buscarMeusDados(): Observable<MeusDadosDTO> {
    return this.http.get<MeusDadosDTO>(this.apiUrl);
  }

  /**
   * Atualiza os dados pessoais do usuário autenticado
   */
  atualizarMeusDados(dados: AtualizarMeusDadosDTO): Observable<MeusDadosDTO> {
    return this.http.put<MeusDadosDTO>(this.apiUrl, dados);
  }

  /**
   * Troca a senha do usuário autenticado
   */
  trocarSenha(dados: TrocarSenhaDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/senha`, dados);
  }
}
