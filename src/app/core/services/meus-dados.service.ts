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

  /**
   * Faz upload da foto do usuário autenticado
   * @param arquivo Arquivo de imagem (JPG, JPEG ou PNG - máx 5MB)
   */
  uploadFoto(arquivo: File): Observable<{ mensagem: string }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    
    // NÃO adicionar Content-Type manualmente - HttpClient detecta automaticamente
    return this.http.post<{ mensagem: string; arquivo: string }>(`${this.apiUrl}/foto`, formData);
  }

  /**
   * Obtém URL temporária da foto do usuário autenticado (expira em 5 minutos)
   * @returns Observable com URL assinada e tempo de expiração em segundos
   */
  obterFotoUrl(): Observable<{ url: string; expiracaoSegundos: number }> {
    return this.http.get<{ url: string; expiracaoSegundos: number }>(`${this.apiUrl}/foto`);
  }

  /**
   * Remove a foto do usuário autenticado
   */
  removerFoto(): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(`${this.apiUrl}/foto`);
  }
}
