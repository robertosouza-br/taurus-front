/**
 * Configurações de ambiente para produção
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.exemplo.com.br/taurus-api/api/v1', // URL da API de produção
  tokenWhitelistedDomains: ['api.exemplo.com.br'],
  tokenBlacklistedRoutes: ['/taurus-api/api/v1/auth/login', '/taurus-api/api/v1/auth/refresh']
};
