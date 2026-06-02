import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ModalidadeTabelaPadraoSnapshot,
  ModalidadeTabelaPadraoSnapshotResumo
} from '../models/modalidade-tabela-padrao-snapshot.model';

@Injectable({
  providedIn: 'root'
})
export class ModalidadeTabelaPadraoSnapshotService {
  private readonly baseUrl = `${environment.apiUrl}/modalidades-tabela-padrao/snapshots`;

  constructor(private http: HttpClient) {}

  consultarResumo(codigoEmpreendimento: number | string): Observable<ModalidadeTabelaPadraoSnapshotResumo> {
    return this.http.get<ModalidadeTabelaPadraoSnapshotResumo>(
      `${this.baseUrl}/empreendimento/${codigoEmpreendimento}/resumo`
    );
  }

  listarPorEmpreendimento(
    codigoEmpreendimento: number | string,
    incluirInativos: boolean = false
  ): Observable<ModalidadeTabelaPadraoSnapshot[]> {
    const params = new HttpParams().set('incluirInativos', String(incluirInativos));

    return this.http.get<ModalidadeTabelaPadraoSnapshot[]>(
      `${this.baseUrl}/empreendimento/${codigoEmpreendimento}`,
      { params }
    );
  }

  consultarDetalhe(
    codigoEmpreendimento: number | string,
    codigoModalidade: string,
    incluirInativos: boolean = false
  ): Observable<ModalidadeTabelaPadraoSnapshot> {
    const params = new HttpParams().set('incluirInativos', String(incluirInativos));

    return this.http.get<ModalidadeTabelaPadraoSnapshot>(
      `${this.baseUrl}/empreendimento/${codigoEmpreendimento}/modalidade/${codigoModalidade}`,
      { params }
    );
  }
}