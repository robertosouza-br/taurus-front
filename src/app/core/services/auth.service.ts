import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User, LoginCredentials, AuthResponse, JwtPayload, LoginResponse, UsuarioLogado, RefreshTokenRequest } from '../models';
import { Funcionalidade } from '../enums/funcionalidade.enum';
import { Permissao } from '../enums/permissao.enum';
import { environment } from '../../../environments/environment';
import { FotoUsuarioService } from './foto-usuario.service';

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
  private tokenCheckInterval: any = null;
  private isRenewing: boolean = false; // Flag para evitar renovações duplicadas
  private lastActivityTime: Date = new Date(); // Rastreia última atividade do usuário
  private readonly MAX_INACTIVITY_MS = 10 * 60 * 1000; // 10 minutos sem atividade = não renova
  private inactivityWarningShown: boolean = false; // Flag para mostrar aviso apenas uma vez

  constructor(
    private http: HttpClient,
    private router: Router,
    private fotoUsuarioService: FotoUsuarioService
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

    // Inicia verificação automática de token
    this.iniciarVerificacaoAutomatica();

    // Log inicial do estado do token
    if (usuarioLogado && usuarioLogado.expiracao) {
      const agora = new Date();
      const expiracao = new Date(usuarioLogado.expiracao);
      const tempoRestante = Math.round((expiracao.getTime() - agora.getTime()) / 1000);
      console.log(`[AUTH] 🔐 Sessão iniciada - Token expira em ${tempoRestante}s (${Math.floor(tempoRestante / 60)}min)`);
    }
  }

  /**
   * Obtém o valor atual do usuário
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtém o valor atual do usuário logado (novo sistema)
   */
  public get usuarioLogadoValue(): UsuarioLogado | null {
    return this.usuarioLogadoSubject.value;
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
      id: response.id,
      email: response.usuario,
      nome: response.nomeUsuario,
      token: response.token,
      expiracao: new Date(response.expiracao),
      refreshToken: response.refreshToken,
      refreshExpiracao: new Date(response.refreshExpiracao),
      permissoes: permissoesMap,
      perfis: response.perfis || []
    };

    this.setToken(response.token);
    this.setRefreshToken(response.refreshToken);
    this.salvarUsuarioStorage(usuario);
    this.usuarioLogadoSubject.next(usuario);

    // Reinicia verificação automática de token
    this.iniciarVerificacaoAutomatica();

    // Registra atividade (login conta como atividade)
    this.registrarAtividade();

    // Log de sucesso
    const agora = new Date();
    const expiracao = new Date(usuario.expiracao);
    const tempoRestante = Math.round((expiracao.getTime() - agora.getTime()) / 1000);
    console.log(`[AUTH] 🎉 Login processado - Token válido por ${Math.floor(tempoRestante / 60)} minutos`);

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

    // Garante que a foto seja do usuário recém autenticado
    this.fotoUsuarioService.recarregarFotoUsuarioAtual();
  }

  /**
   * Renova o token de acesso usando o refresh token
   */
  renovarToken(): Observable<LoginResponse> {
    const usuarioLogado = this.usuarioLogadoValue;
    
    console.log('[AUTH] Tentando renovar token...');
    
    if (!usuarioLogado?.refreshToken) {
      console.error('[AUTH] Refresh token não encontrado');
      return throwError(() => new Error('Refresh token não encontrado'));
    }

    // Verifica se o refresh token expirou
    const agora = new Date();
    if (usuarioLogado.refreshExpiracao && usuarioLogado.refreshExpiracao <= agora) {
      console.error('[AUTH] Refresh token expirado');
      this.logout('Sua sessão expirou. Por favor, faça login novamente.');
      return throwError(() => new Error('Refresh token expirado'));
    }

    const request: RefreshTokenRequest = {
      refreshToken: usuarioLogado.refreshToken
    };

    console.log('[AUTH] Enviando requisição de refresh...');

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, request)
      .pipe(
        tap(response => {
          console.log('[AUTH] Token renovado com sucesso');
          this.processarLogin(response);
        }),
        catchError(error => {
          console.error('[AUTH] Erro ao renovar token:', error);
          this.logout('Sua sessão expirou. Por favor, faça login novamente.');
          return throwError(() => error);
        })
      );
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
   * Registra atividade do usuário (chamado por UserActivityService)
   */
  public registrarAtividade(): void {
    this.lastActivityTime = new Date();
    this.inactivityWarningShown = false; // Reset do aviso quando há atividade
  }

  /**
   * Verifica se houve atividade recente (últimos 10 minutos)
   */
  private temAtividadeRecente(): boolean {
    const agora = new Date();
    const tempoInativo = agora.getTime() - this.lastActivityTime.getTime();
    return tempoInativo < this.MAX_INACTIVITY_MS;
  }

  /**
   * Inicia verificação automática de expiração do token
   * Verifica a cada 30 segundos se o token está próximo de expirar
   */
  private iniciarVerificacaoAutomatica(): void {
    // Para qualquer verificação anterior
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }

    // Verifica a cada 30 segundos
    this.tokenCheckInterval = setInterval(() => {
      const usuarioLogado = this.getUsuarioLogado();
      
      if (!usuarioLogado || !usuarioLogado.expiracao) {
        return;
      }

      // Se já está renovando, aguarda
      if (this.isRenewing) {
        console.log('[AUTH] ⏳ Renovação já em andamento, aguardando...');
        return;
      }

      const agora = new Date();
      const expiracao = new Date(usuarioLogado.expiracao);
      const tempoRestante = (expiracao.getTime() - agora.getTime()) / 1000; // em segundos

      // Aviso 2 minutos antes de expirar se estiver inativo
      if (tempoRestante > 60 && tempoRestante < 120 && !this.temAtividadeRecente()) {
        if (!this.inactivityWarningShown) {
          const tempoInativo = Math.round((agora.getTime() - this.lastActivityTime.getTime()) / 1000 / 60);
          console.warn(`[AUTH] ⚠️ Usuário inativo há ${tempoInativo} minutos`);
          console.warn(`[AUTH] ⏱️ Sessão expirará em ${Math.round(tempoRestante / 60)} minuto(s) sem atividade`);
          this.inactivityWarningShown = true;
        }
      }

      // Se faltar menos de 60 segundos (1 minuto) para expirar, verifica atividade
      if (tempoRestante > 0 && tempoRestante < 60) {
        // Só renova se houver atividade recente
        if (!this.temAtividadeRecente()) {
          const tempoInativo = Math.round((agora.getTime() - this.lastActivityTime.getTime()) / 1000 / 60);
          console.log(`[AUTH] 💤 Usuário inativo há ${tempoInativo} minutos - Token vai expirar`);
          console.log('[AUTH] ⏱️ Sistema fará logout por inatividade ao expirar o token');
          return;
        }

        console.log(`[AUTH] ⏰ Token expira em ${Math.round(tempoRestante)}s - Renovando (usuário ativo)...`);
        this.isRenewing = true;
        this.inactivityWarningShown = false; // Reset para próximo ciclo
        
        this.renovarToken().subscribe({
          next: () => {
            console.log('[AUTH] ✅ Token renovado automaticamente com sucesso');
            this.isRenewing = false;
          },
          error: (error) => {
            console.error('[AUTH] ❌ Erro na renovação automática:', error);
            this.isRenewing = false;
          }
        });
      } else if (tempoRestante <= 0) {
        // Token já expirou
        console.log('[AUTH] ⌛ Token expirado - Fazendo logout...');
        this.inactivityWarningShown = false;
        this.logout('Sua sessão expirou por inatividade');
      }
    }, 30000); // 30 segundos
  }

  /**
   * Para a verificação automática de token
   */
  private pararVerificacaoAutomatica(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
    this.isRenewing = false;
    this.inactivityWarningShown = false;
  }

  /**
   * Realiza o logout do usuário
   */
  logout(motivo?: string): void {
    // Para verificação automática
    this.pararVerificacaoAutomatica();

    // Remove dados do localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USUARIO_LOGADO_KEY);
    
    // Limpa preferências de sessão do dashboard
    sessionStorage.clear();
    
    // Limpa o BehaviorSubject
    this.currentUserSubject.next(null);
    this.usuarioLogadoSubject.next(null);

    // Limpa cache da foto para evitar exibir foto do usuário anterior
    this.fotoUsuarioService.limparFoto();
    
    // Redireciona para login com mensagem se houver
    if (motivo) {
      this.router.navigate(['/auth/login'], { queryParams: { mensagem: motivo } });
    } else {
      this.router.navigate(['/auth/login']);
    }
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
   * Obtém o ID do usuário logado
   * Busca diretamente do objeto UsuarioLogado armazenado
   * @returns ID do usuário ou null se não estiver logado
   */
  getUsuarioLogadoId(): number | null {
    const usuarioLogado = this.getUsuarioLogado();
    return usuarioLogado?.id || null;
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
   * Método antigo - mantido para compatibilidade com interceptor
   * Redireciona para renovarToken()
   */
  refreshToken(): Observable<string> {
    return this.renovarToken().pipe(
      map(response => response.token)
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
        refreshExpiracao: parsed.refreshExpiracao ? new Date(parsed.refreshExpiracao) : undefined,
        permissoes: permissoesMap,
        perfis: parsed.perfis || []
      };
    } catch {
      return null;
    }
  }

  /**
   * Método de teste: Forçar renovação do token
   * Execute no console: window['authService'].testarRefreshToken()
   */
  testarRefreshToken(): void {
    const usuario = this.usuarioLogadoValue;
    
    console.log('=== TESTE DE REFRESH TOKEN ===');
    console.log('Usuário:', usuario?.email || 'Não logado');
    console.log('Token presente:', !!this.getToken());
    console.log('Refresh token presente:', !!usuario?.refreshToken);
    console.log('Expiração do token:', usuario?.expiracao);
    console.log('Expiração do refresh:', usuario?.refreshExpiracao);
    console.log('Tempo até expirar (segundos):', usuario?.expiracao ? Math.floor((usuario.expiracao.getTime() - Date.now()) / 1000) : 'N/A');
    
    if (!usuario?.refreshToken) {
      console.error('❌ Refresh token não encontrado!');
      return;
    }

    const agora = new Date();
    if (usuario.refreshExpiracao && usuario.refreshExpiracao <= agora) {
      console.error('❌ Refresh token já expirou!');
      return;
    }

    console.log('🔄 Tentando renovar token...');
    
    this.renovarToken().subscribe({
      next: () => {
        const novoUsuario = this.usuarioLogadoValue;
        console.log('✅ Token renovado com sucesso!');
        console.log('Nova expiração:', novoUsuario?.expiracao);
      },
      error: (error) => {
        console.error('❌ Erro ao renovar token:', error.message || 'Erro desconhecido');
      }
    });
  }
}
