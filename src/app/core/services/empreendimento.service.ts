import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Empreendimento,
  EmpreendimentoImagem,
  EmpreendimentoImagemUploadDTO,
  EmpreendimentoImagemUpdateDTO,
  TipoImagemEmpreendimento,
  TipoImagemDetalhes,
  PageResponse
} from '../models/empreendimento.model';

/**
 * Serviço consolidado para gerenciar empreendimentos e suas imagens
 * 
 * Funcionalidade: IMOVEL
 */
@Injectable({
  providedIn: 'root'
})
export class EmpreendimentoService {
  private readonly apiUrl = `${environment.apiUrl}/empreendimentos`;

  constructor(private http: HttpClient) {}

  // ==================== EMPREENDIMENTOS ====================

  /**
   * Lista empreendimentos com paginação e busca
   */
  listarEmpreendimentos(
    page: number = 0,
    size: number = 50,
    search?: string
  ): Observable<PageResponse<Empreendimento>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<Empreendimento>>(this.apiUrl, { params });
  }

  // ==================== IMAGENS ====================

  /**
   * Lista os tipos de imagem disponíveis
   */
  getTiposImagem(): Observable<TipoImagemDetalhes[]> {
    return this.http.get<TipoImagemDetalhes[]>(`${this.apiUrl}/imagens/tipos`);
  }

  /**
   * Faz upload de uma nova imagem
   */
  uploadImagem(codigoEmpreendimento: string, dados: EmpreendimentoImagemUploadDTO): Observable<EmpreendimentoImagem> {
    const formData = new FormData();
    formData.append('arquivo', dados.arquivo);
    
    if (dados.ordem !== undefined && dados.ordem !== null) {
      formData.append('ordem', dados.ordem.toString());
    }
    if (dados.principal !== undefined && dados.principal !== null) {
      formData.append('principal', dados.principal.toString());
    }
    if (dados.tipo) {
      formData.append('tipo', dados.tipo);
    }

    return this.http.post<EmpreendimentoImagem>(`${this.apiUrl}/${codigoEmpreendimento}/imagens`, formData);
  }

  /**
   * Lista imagens ativas de um empreendimento
   */
  listarImagensAtivas(codigoEmpreendimento: string): Observable<EmpreendimentoImagem[]> {
    return this.http.get<EmpreendimentoImagem[]>(`${this.apiUrl}/${codigoEmpreendimento}/imagens`);
  }

  /**
   * Lista todas as imagens (ativas e inativas)
   */
  listarTodasImagens(codigoEmpreendimento: string): Observable<EmpreendimentoImagem[]> {
    return this.http.get<EmpreendimentoImagem[]>(`${this.apiUrl}/${codigoEmpreendimento}/imagens/todas`);
  }

  /**
   * Busca a imagem principal
   */
  buscarImagemPrincipal(codigoEmpreendimento: string): Observable<EmpreendimentoImagem> {
    return this.http.get<EmpreendimentoImagem>(`${this.apiUrl}/${codigoEmpreendimento}/imagens/principal`);
  }

  /**
   * Atualiza metadados da imagem
   */
  atualizarImagem(id: number, dados: EmpreendimentoImagemUpdateDTO): Observable<EmpreendimentoImagem> {
    return this.http.put<EmpreendimentoImagem>(`${this.apiUrl}/imagens/${id}`, dados);
  }

  /**
   * Marca uma imagem como principal
   */
  marcarComoPrincipal(id: number): Observable<EmpreendimentoImagem> {
    return this.http.patch<EmpreendimentoImagem>(`${this.apiUrl}/imagens/${id}/marcar-principal`, {});
  }

  /**
   * Inativa uma imagem (soft delete)
   */
  inativarImagem(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/imagens/${id}/inativar`, {});
  }

  /**
   * Exclui permanentemente uma imagem
   */
  excluirImagem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/imagens/${id}`);
  }
}
