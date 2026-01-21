/**
 * Configurações de ambiente para DESENVOLVIMENTO
 * 
 * PROXY ATIVO:
 * - apiUrl usa caminho RELATIVO (/taurus-api/...)
 * - proxy.conf.json redireciona para http://localhost:8080
 * - Execute: npm start (já inclui --proxy-config)
 * - Evita erros de CORS no Chrome durante desenvolvimento
 * 
 * Como funciona:
 * Angular (localhost:4200) → Proxy → Backend (localhost:8080)
 * O navegador pensa que tudo é localhost:4200 (mesma origem, sem CORS)
 */
export const environment = {
  production: false,
  apiUrl: '/taurus-api/api/v1', // Caminho relativo - usa proxy configurado em proxy.conf.json
  tokenWhitelistedDomains: ['localhost:4200'], // Domínio do proxy, não do backend
  tokenBlacklistedRoutes: ['/taurus-api/api/v1/auth/login', '/taurus-api/api/v1/auth/refresh']
};
