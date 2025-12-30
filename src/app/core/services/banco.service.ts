import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Banco } from '../models/banco.model';

/**
 * Serviço para gestão de bancos
 * API pública - não requer autenticação
 */
@Injectable({
  providedIn: 'root'
})
export class BancoService {
  private readonly baseUrl = `${environment.apiUrl}/bancos`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos os bancos cadastrados
   * Retorna lista ordenada por código crescente
   * Utilizado para autocomplete no cadastro de corretores
   */
  listar(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.baseUrl);
  }
}
