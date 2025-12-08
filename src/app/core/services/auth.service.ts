import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User, LoginCredentials, AuthResponse, JwtPayload, LoginResponse, UsuarioLogado } from '../models';
import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';
import { environment } from '../../../environments/environment';

/**
 * Serviço de autenticação
 * Gerencia login, logout, validação de tokens JWT e estado de autenticação
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly USUARIO_LOGADO_KEY = 'usuario_logado';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private usuarioLogadoSubject: BehaviorSubject<UsuarioLogado | null>;
  public usuarioLogado$: Observable<UsuarioLogado | null>;
  
  private jwtHelper: JwtHelperService;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.jwtHelper = new JwtHelperService();
    
    // Inicializa o BehaviorSubject com o usuário armazenado (se houver)
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Inicializa com novo sistema de permissões
    const usuarioLogado = this.carregarUsuarioStorage();
    this.usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(usuarioLogado);
    this.usuarioLogado$ = this.usuarioLogadoSubject.asObservable();
  }

  /**
   * Obtém o valor atual do usuário
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  public get isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * Realiza o login do usuário (novo sistema com permissões)
   * @param credentials Credenciais de login (email e senha)
   * @returns Observable com os dados do usuário autenticado
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.processarLogin(response)),
        catchError(error => {
          console.error('Erro no login:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Processa o login e armazena os dados do usuário com permissões
   */
  private processarLogin(response: LoginResponse): void {
    const permissoesMap = this.converterPermissoes(response.permissoes);

    const usuario: UsuarioLogado = {
      email: response.usuario,
      nome: response.nomeUsuario,
      token: response.token,
      expiracao: new Date(response.expiracao),
      permissoes: permissoesMap
    };

    this.setToken(response.token);
    this.salvarUsuarioStorage(usuario);
    this.usuarioLogadoSubject.next(usuario);

    // Mantém compatibilidade com sistema antigo
    const userCompat: User = {
      id: response.usuario,
      username: response.usuario,
      email: response.usuario,
      name: response.nomeUsuario,
      roles: [],
      permissions: []
    };
    this.setUser(userCompat);
    this.currentUserSubject.next(userCompat);
  }

  /**
   * Converte permissões do formato Record para Map<Set>
   */
  private converterPermissoes(
    permissoes: Record<Funcionalidade, Permissao[]>
  ): Map<Funcionalidade, Set<Permissao>> {
    const map = new Map<Funcionalidade, Set<Permissao>>();

    Object.entries(permissoes).forEach(([func, perms]) => {
      map.set(func as Funcionalidade, new Set(perms));
    });

    return map;
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    // Remove dados do localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USUARIO_LOGADO_KEY);
    
    // Limpa o BehaviorSubject
    this.currentUserSubject.next(null);
    this.usuarioLogadoSubject.next(null);
    
    // Redireciona para login
    this.router.navigate(['/login']);
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAutenticado(): boolean {
    const usuario = this.usuarioLogadoSubject.value;
    if (!usuario) return false;

    const agora = new Date();
    return usuario.expiracao > agora;
  }

  /**
   * Obtém o usuário logado (novo sistema)
   */
  getUsuarioLogado(): UsuarioLogado | null {
    return this.usuarioLogadoSubject.value;
  }

  /**
   * Obtém o token JWT armazenado
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Armazena o token JWT
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Obtém o refresh token armazenado
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Armazena o refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Armazena os dados do usuário
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtém os dados do usuário armazenado
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Erro ao parsear dados do usuário:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica se o token está expirado
   */
  isTokenExpired(token: string): boolean {
    try {
      return this.jwtHelper.isTokenExpired(token);
    } catch (e) {
      return true;
    }
  }

  /**
   * Decodifica o token JWT
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtHelper.decodeToken(token);
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      return null;
    }
  }

  /**
   * Obtém a data de expiração do token
   */
  getTokenExpirationDate(token: string): Date | null {
    return this.jwtHelper.getTokenExpirationDate(token);
  }

  /**
   * Renova o token usando o refresh token
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token não encontrado'));
    }

    return this.http.post<{ token: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setToken(response.token);
        }),
        map(response => response.token),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Salva usuário no localStorage (novo sistema)
   */
  private salvarUsuarioStorage(usuario: UsuarioLogado): void {
    const usuarioSerializado = {
      ...usuario,
      permissoes: Array.from(usuario.permissoes.entries()).map(([func, perms]) => ({
        funcionalidade: func,
        permissoes: Array.from(perms)
      }))
    };

    localStorage.setItem(this.USUARIO_LOGADO_KEY, JSON.stringify(usuarioSerializado));
  }

  /**
   * Carrega usuário do localStorage (novo sistema)
   */
  private carregarUsuarioStorage(): UsuarioLogado | null {
    const data = localStorage.getItem(this.USUARIO_LOGADO_KEY);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      const permissoesMap = new Map<Funcionalidade, Set<Permissao>>();

      parsed.permissoes.forEach((item: any) => {
        permissoesMap.set(item.funcionalidade, new Set(item.permissoes));
      });

      return {
        ...parsed,
        expiracao: new Date(parsed.expiracao),
        permissoes: permissoesMap
      };
    } catch {
      return null;
    }
  }
}
