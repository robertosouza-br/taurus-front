/**
 * Configurações de ambiente para PRODUÇÃO
 * 
 * SEM PROXY (não existe em produção):
 * - apiUrl usa URL ABSOLUTA (https://api.exemplo.com.br/...)
 * - O backend DEVE ter CORS configurado corretamente
 * - Build: npm run build:prod
 * - Deploy: Arquivos da pasta dist/ em servidor web (Nginx, Apache, IIS)
 * 
 * IMPORTANTE - Configuração CORS obrigatória no backend Spring Boot:
 * @Configuration
 * public class CorsConfig implements WebMvcConfigurer {
 *     @Override
 *     public void addCorsMappings(CorsRegistry registry) {
 *         registry.addMapping("/api/**")
 *                 .allowedOrigins("https://seu-dominio.com.br")
 *                 .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
 *                 .allowedHeaders("*")
 *                 .allowCredentials(true);
 *     }
 * }
 * 
 * ANTES DE FAZER DEPLOY:
 * 1. Altere apiUrl para o domínio real da API de produção
 * 2. Altere tokenWhitelistedDomains para o domínio da API
 * 3. Configure CORS no backend com o domínio do frontend
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.exemplo.com.br/taurus-api/api/v1', // ALTERE para URL real da API de produção
  tokenWhitelistedDomains: ['api.exemplo.com.br'], // ALTERE para domínio real
  tokenBlacklistedRoutes: ['/taurus-api/api/v1/auth/login', '/taurus-api/api/v1/auth/refresh']
};
