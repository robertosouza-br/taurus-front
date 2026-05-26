import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  ProfissionalCadastroRapidoDTO,
  ProfissionalCreateDTO,
  ProfissionalDTO,
  ProfissionalHabilitarAcessoDTO
} from '../models/profissional.model';
import { TipoProfissional } from '../models/reserva.model';

@Injectable({
  providedIn: 'root'
})
export class ProfissionalService {
  private readonly baseUrl = `${environment.apiUrl}/profissionais`;

  constructor(private http: HttpClient) {}

  listar(
    page: number = 0,
    size: number = 50,
    search?: string,
    tipoProfissional?: TipoProfissional,
    imobiliariaId?: number
  ): Observable<Page<ProfissionalDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (tipoProfissional) {
      params = params.set('tipoProfissional', tipoProfissional);
    }

    if (imobiliariaId) {
      params = params.set('imobiliariaId', imobiliariaId.toString());
    }

    return this.http.get<Page<ProfissionalDTO>>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<ProfissionalDTO> {
    return this.http.get<ProfissionalDTO>(`${this.baseUrl}/${id}`);
  }

  buscarPorCpf(cpf: string): Observable<ProfissionalDTO> {
    const cpfSanitizado = (cpf || '').replace(/\D/g, '');
    return this.http.get<ProfissionalDTO>(`${this.baseUrl}/cpf/${cpfSanitizado}`);
  }

  buscarPorTelefone(telefone: string): Observable<ProfissionalDTO> {
    const telefoneSanitizado = (telefone || '').replace(/\D/g, '');
    return this.http.get<ProfissionalDTO>(`${this.baseUrl}/telefone/${telefoneSanitizado}`);
  }

  cadastrar(payload: ProfissionalCreateDTO): Observable<ProfissionalDTO> {
    return this.http.post<ProfissionalDTO>(this.baseUrl, payload);
  }

  cadastroRapido(payload: ProfissionalCadastroRapidoDTO): Observable<ProfissionalDTO> {
    return this.http.post<ProfissionalDTO>(`${this.baseUrl}/cadastro-rapido`, payload);
  }

  atualizar(id: number, payload: ProfissionalCreateDTO): Observable<ProfissionalDTO> {
    return this.http.put<ProfissionalDTO>(`${this.baseUrl}/${id}`, payload);
  }

  habilitarAcesso(id: number, payload: ProfissionalHabilitarAcessoDTO): Observable<ProfissionalDTO> {
    return this.http.post<ProfissionalDTO>(`${this.baseUrl}/${id}/habilitar-acesso`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}