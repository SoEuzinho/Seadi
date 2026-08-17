/**
 * ========================================================================
 * CONTROLADOR RAIZ - Health Check
 * ========================================================================
 * 
 * Este controlador fornece endpoints básicos de verificação de saúde da API.
 * O endpoint de health check é fundamental para:
 * 
 * - Monitoramento: Verificar se o servidor está respondendo
 * - Load Balancers: Confirmar que o serviço está operacional
 * - Docker/Kubernetes: Health checks para orquestração
 * - Debugging: Testar se a API está funcionando
 * 
 * Endpoint disponível:
 * - GET /api/health → Retorna status e timestamp
 * ========================================================================
 */

import { Controller, Get } from '@nestjs/common';

/**
 * Controlador raiz da aplicação.
 * 
 * Este controlador não requer autenticação e fornece
 * informações básicas sobre o estado do servidor.
 */
@Controller()
export class AppController {
  /**
   * Endpoint de verificação de saúde (Health Check).
   * 
   * Retorna um objeto com:
   * - status: 'ok' indicando que o servidor está funcionando
   * - timestamp: Data e hora atuais em formato ISO 8601
   * 
   * Uso típico:
   * GET /api/health
   * 
   * Resposta esperada:
   * {
   *   "status": "ok",
   *   "timestamp": "2024-01-15T10:30:00.000Z"
   * }
   * 
   * Este endpoint é frequentemente usado por:
   * - Serviços de monitoramento (Prometheus, Grafana)
   * - Load balancers (AWS ALB, Nginx)
   * - Orchestradores (Docker, Kubernetes)
   */
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
