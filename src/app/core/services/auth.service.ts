import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User, LoginCredentials, AuthResponse, JwtPayload } from '../models';
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
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  
  private jwtHelper: JwtHelperService;

  constructor(private http: HttpClient) {
    this.jwtHelper = new JwtHelperService();
    
    // Inicializa o BehaviorSubject com o usuário armazenado (se houver)
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
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
   * Realiza o login do usuário
   * @param credentials Credenciais de login (username e password)
   * @returns Observable com os dados do usuário autenticado
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          // Armazena o token e dados do usuário
          this.setToken(response.token);
          if (response.refreshToken) {
            this.setRefreshToken(response.refreshToken);
          }
          this.setUser(response.user);
          this.currentUserSubject.next(response.user);
        }),
        map(response => response.user),
        catchError(error => {
          console.error('Erro no login:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    // Remove dados do localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Limpa o BehaviorSubject
    this.currentUserSubject.next(null);
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
}
