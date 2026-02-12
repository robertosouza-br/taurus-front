import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Imobiliaria, ImobiliariaFormDTO, ImobiliariaFiltroDTO, ImagemImobiliaria } from '../models/imobiliaria.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de imobiliárias
 */
@Injectable({
  providedIn: 'root'
})
export class ImobiliariaService {
  private readonly baseUrl = `${environment.apiUrl}/imobiliarias`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as imobiliárias ativas (sem paginação)
   * Utilizado para autocomplete e dropdowns
   */
  listarTodas(): Observable<Imobiliaria[]> {
    return this.http.get<Imobiliaria[]>(`${this.baseUrl}/todos`);
  }

  /**
   * Lista imobiliárias com paginação e busca
   * @param filtro Filtros de busca
   */
  listar(filtro: ImobiliariaFiltroDTO): Observable<Page<Imobiliaria>> {
    let params = new HttpParams();
    
    if (filtro.page !== undefined) {
      params = params.set('page', filtro.page.toString());
    }
    if (filtro.size !== undefined) {
      params = params.set('size', filtro.size.toString());
    }
    if (filtro.search) {
      params = params.set('search', filtro.search);
    }

    return this.http.get<Page<Imobiliaria>>(this.baseUrl, { params });
  }

  /**
   * Busca imobiliária por ID
   * @param id ID da imobiliária
   */
  buscarPorId(id: number): Observable<Imobiliaria> {
    return this.http.get<Imobiliaria>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cria uma nova imobiliária
   * @param imobiliaria Dados da imobiliária
   */
  criar(imobiliaria: ImobiliariaFormDTO): Observable<Imobiliaria> {
    return this.http.post<Imobiliaria>(this.baseUrl, imobiliaria);
  }

  /**
   * Atualiza uma imobiliária existente
   * @param id ID da imobiliária
   * @param imobiliaria Dados atualizados
   */
  atualizar(id: number, imobiliaria: ImobiliariaFormDTO): Observable<Imobiliaria> {
    return this.http.put<Imobiliaria>(`${this.baseUrl}/${id}`, imobiliaria);
  }

  /**
   * Ativa uma imobiliária
   * @param id ID da imobiliária
   */
  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/ativar`, {});
  }

  /**
   * Inativa uma imobiliária
   * @param id ID da imobiliária
   */
  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }

  /**
   * Adiciona documento à imobiliária
   * @param id ID da imobiliária
   * @param arquivo Arquivo a ser enviado
   */
  adicionarDocumento(id: number, arquivo: File): Observable<Imobiliaria> {
    const formData = new FormData();
    formData.append('file', arquivo);
    return this.http.post<Imobiliaria>(`${this.baseUrl}/${id}/documentos`, formData);
  }

  /**
   * Remove documento da imobiliária
   * @param id ID da imobiliária
   * @param path Path completo do documento no MinIO
   */
  removerDocumento(id: number, path: string): Observable<Imobiliaria> {
    const params = new HttpParams().set('path', path);
    return this.http.delete<Imobiliaria>(`${this.baseUrl}/${id}/documentos`, { params });
  }

  /**
   * Visualiza/Baixa documento da imobiliária
   * Retorna o blob do arquivo com autenticação
   * @param id ID da imobiliária
   * @param path Path completo do documento no MinIO
   */
  visualizarDocumento(id: number, path: string): Observable<Blob> {
    const params = new HttpParams().set('path', path);
    return this.http.get(`${this.baseUrl}/${id}/documentos/visualizar`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Adiciona imagem ao portfólio da imobiliária
   * @param imobiliariaId ID da imobiliária
   * @param arquivo Arquivo de imagem a ser enviado
   * @param descricao Descrição da imagem (opcional)
   * @param tipoImagem Tipo da imagem (opcional): logo, portfolio, equipe, escritorio, fachada
   * @param ordem Ordem de exibição (opcional)
   * @param principal Se é a imagem principal (opcional)
   */
  adicionarImagem(
    imobiliariaId: number, 
    arquivo: File, 
    descricao?: string, 
    tipoImagem?: string,
    ordem?: number,
    principal?: boolean
  ): Observable<ImagemImobiliaria> {
    const formData = new FormData();
    formData.append('imobiliariaId', imobiliariaId.toString());
    formData.append('arquivo', arquivo);
    if (descricao) formData.append('descricao', descricao);
    if (tipoImagem) formData.append('tipoImagem', tipoImagem);
    if (ordem !== undefined) formData.append('ordem', ordem.toString());
    if (principal !== undefined) formData.append('principal', principal.toString());
    
    return this.http.post<ImagemImobiliaria>(`${this.baseUrl}/imagens`, formData);
  }

  /**
   * Lista todas as imagens de uma imobiliária
   * @param imobiliariaId ID da imobiliária
   */
  listarImagens(imobiliariaId: number): Observable<ImagemImobiliaria[]> {
    return this.http.get<ImagemImobiliaria[]>(`${this.baseUrl}/imagens/${imobiliariaId}`);
  }

  /**
   * Obtém a imagem principal da imobiliária
   * @param imobiliariaId ID da imobiliária
   */
  obterImagemPrincipal(imobiliariaId: number): Observable<ImagemImobiliaria> {
    return this.http.get<ImagemImobiliaria>(`${this.baseUrl}/imagens/${imobiliariaId}/principal`);
  }

  /**
   * Define uma imagem como principal
   * @param imagemId ID da imagem
   */
  definirImagemPrincipal(imagemId: number): Observable<ImagemImobiliaria> {
    return this.http.put<ImagemImobiliaria>(`${this.baseUrl}/imagens/principal/${imagemId}`, {});
  }

  /**
   * Atualiza informações da imagem
   * @param imagemId ID da imagem
   * @param descricao Nova descrição (opcional)
   * @param tipoImagem Novo tipo (opcional)
   * @param ordem Nova ordem (opcional)
   * @param principal Marcar/desmarcar como principal (opcional)
   */
  atualizarImagem(
    imagemId: number,
    descricao?: string,
    tipoImagem?: string,
    ordem?: number,
    principal?: boolean
  ): Observable<ImagemImobiliaria> {
    let params = new HttpParams();
    if (descricao) params = params.set('descricao', descricao);
    if (tipoImagem) params = params.set('tipoImagem', tipoImagem);
    if (ordem !== undefined) params = params.set('ordem', ordem.toString());
    if (principal !== undefined) params = params.set('principal', principal.toString());

    return this.http.put<ImagemImobiliaria>(`${this.baseUrl}/imagens/${imagemId}`, {}, { params });
  }

  /**
   * Remove imagem do portfólio da imobiliária
   * @param imagemId ID da imagem
   */
  removerImagem(imagemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/imagens/${imagemId}`);
  }
}
