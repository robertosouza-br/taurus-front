/**
 * Configurações de ambiente para desenvolvimento
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/taurus-api/api/v1', // URL da API Spring Boot
  tokenWhitelistedDomains: ['localhost:8080'],
  tokenBlacklistedRoutes: ['/taurus-api/api/v1/auth/login', '/taurus-api/api/v1/auth/refresh']
};
