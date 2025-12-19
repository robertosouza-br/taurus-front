import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CorretorDTO, CorretorSaidaDTO, Banco } from '../models/corretor.model';

/**
 * Serviço público para cadastro de corretores (sem autenticação)
 */
@Injectable({
  providedIn: 'root'
})
export class CorretorPublicoService {
  private readonly baseUrl = `${environment.apiUrl}/corretores`;

  constructor(private http: HttpClient) {}

  /**
   * Cadastra corretor (endpoint público)
   * @param corretor Dados do corretor
   */
  cadastrar(corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.post<CorretorSaidaDTO>(this.baseUrl, corretor);
  }

  /**
   * Lista bancos disponíveis (endpoint público)
   */
  listarBancos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(`${environment.apiUrl}/bancos`);
  }
}
