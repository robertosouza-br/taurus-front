import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CorretorCargo, CorretorComboDTO, CorretorDTO, CorretorSaidaDTO } from '../models/corretor.model';
import { Page } from '../models/page.model';

/**
 * Serviço para gestão de corretores
 * 
 * ENDPOINTS DISPONÍVEIS:
 * - POST /corretores (cadastrar): Público, cria corretor + usuário local
 * - POST /corretores/incluir (incluir): Requer auth, apenas cria no TOTVS RM
 * - PATCH /corretores/cpf/{cpf} (atualizar): Requer auth + permissão
 * 
 * IMPORTANTE: A API RMS não suporta paginação tradicional com offset.
 * O backend busca TODOS os registros (~3496) e faz paginação em memória.
 * A primeira requisição pode ter latência de 2-3 segundos.
 */
@Injectable({
  providedIn: 'root'
})
export class CorretorService {
  private readonly baseUrl = `${environment.apiUrl}/corretores`;

  constructor(private http: HttpClient) {}

  /**
   * Lista corretores com paginação e busca
   * 
   * ATENÇÃO: A primeira requisição busca TODOS os ~3496 corretores da API RMS
   * e pode demorar 2-3 segundos. Implemente loading/spinner na UI.
   * 
   * @param page Número da página (base 0)
   * @param size Tamanho da página (padrão: 50)
   * @param search Termo de busca (nome ou CPF) - ainda não implementado
   */
  listar(page: number = 0, size: number = 50, search?: string): Observable<Page<CorretorSaidaDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Page<CorretorSaidaDTO>>(this.baseUrl, { params });
  }

  listarCombo(): Observable<CorretorSaidaDTO[]> {
    return this.http.get<CorretorComboDTO[]>(`${this.baseUrl}/combo`).pipe(
      map((lista) =>
        lista.map((c) => ({
          idExterno: c.codigo,
          nome: c.nome,
          cpf: c.cpf,
          cargo: CorretorCargo.CORRETOR,
          ativo: true
        }))
      )
    );
  }

  buscarPorCpfReserva(cpf: string): Observable<CorretorSaidaDTO> {
    const cpfSanitizado = (cpf || '').replace(/\D/g, '');
    return this.http.get<any>(`${this.baseUrl}/buscar-para-reserva/${cpfSanitizado}`).pipe(
      map((c) => ({
        idExterno: c.codigo || c.idExterno || (c.id ? String(c.id) : ''),
        nome: c.nome,
        cpf: c.cpf,
        email: c.email,
        telefone: c.telefone,
        numeroCreci: c.numeroCreci,
        cargo: c.cargo || CorretorCargo.CORRETOR,
        ativo: c.ativo ?? true,
        nomeGuerra: c.nomeGuerra
      }))
    );
  }

  /**
   * Busca corretor por ID
   * @param id ID do corretor
   */
  buscarPorId(id: string): Observable<CorretorSaidaDTO> {
    return this.http.get<CorretorSaidaDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Busca corretor por CPF (usado na listagem/busca)
   * O CPF pode ser enviado com ou sem formatação
   * @param cpf CPF do corretor (ex: "029.377.527-30" ou "02937752730")
   */
  buscarPorCpf(cpf: string): Observable<CorretorDTO> {
    return this.http.get<CorretorDTO>(`${this.baseUrl}/cpf/${cpf}`);
  }

  /**
   * Busca corretor por CODCFO (usado na edição)
   * Retorna dados completos do corretor incluindo endereço e dados bancários
   * @param codcfo Código do corretor no sistema TOTVS RM (ex: "00043576")
   */
  buscarPorCodigo(codcfo: string): Observable<CorretorSaidaDTO> {
    return this.http.get<CorretorSaidaDTO>(`${this.baseUrl}/codigo/${codcfo}`);
  }

  /**
   * Cadastro rápido de corretor a partir da tela de reserva
   * POST /api/v1/corretores/cadastro-rapido
   * @param payload Dados mínimos: cpf, nome e opcionalmente email e telefone
   */
  cadastroRapido(payload: { cpf: string; nome: string; email?: string; telefone?: string }): Observable<CorretorSaidaDTO> {
    return this.http.post<CorretorSaidaDTO>(`${this.baseUrl}/rapido`, payload);
  }

  /**
   * Cadastra novo corretor (uso interno administrativo)
   * POST /api/v1/corretores
   * Endpoint público - cria corretor E usuário local automaticamente
   * @param corretor Dados do corretor
   */
  cadastrar(corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.post<CorretorSaidaDTO>(this.baseUrl, corretor);
  }

  /**
   * Inclui corretor via SOAP TOTVS RM
   * POST /api/v1/corretores/incluir
   * Requer autenticação e permissão CORRETOR:INCLUIR
   * Apenas cria corretor no sistema externo (não cria usuário local)
   * @param corretor Dados do corretor
   */
  incluir(corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.post<CorretorSaidaDTO>(`${this.baseUrl}/incluir`, corretor);
  }

  /**
   * Atualiza corretor usando CPF como identificador
   * PATCH /api/v1/corretores/cpf/{cpf}
   * @param cpf CPF do corretor (com ou sem formatação)
   * @param corretor Dados do corretor a serem atualizados
   */
  atualizar(cpf: string, corretor: CorretorDTO): Observable<CorretorSaidaDTO> {
    return this.http.patch<CorretorSaidaDTO>(`${this.baseUrl}/cpf/${cpf}`, corretor);
  }

  /**
   * Exclui corretor
   * @param id ID do corretor
   */
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
