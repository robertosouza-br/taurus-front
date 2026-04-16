/**
 * Configurações de ambiente para PRODUÇÃO
 * 
 * ACESSO DIRETO À API:
 * - apiUrl usa URL ABSOLUTA apontando para a API publicada
 * - O frontend chama diretamente http://8.242.38.36:8080/taurus-api/...
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
 * 1. Garanta acesso público à API em http://8.242.38.36:8080
 * 2. Ajuste tokenWhitelistedDomains se trocar o host público da API
 * 3. Configure CORS no backend liberando http://8.242.38.36
 */
export const environment = {
  production: true,
  apiUrl: 'http://8.242.38.36:8080/taurus-api/api/v1',
  tokenWhitelistedDomains: ['8.242.38.36:8080'],
  tokenBlacklistedRoutes: ['/taurus-api/api/v1/auth/login', '/taurus-api/api/v1/auth/refresh']
};
