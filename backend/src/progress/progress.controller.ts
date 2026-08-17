/**
 * ========================================================================
 * CONTROLADOR DE PROGRESSO - Endpoints de Acompanhamento
 * ========================================================================
 * 
 * Este controlador expõe os endpoints REST para gerenciamento
 * de progresso dos usuários nas aulas e módulos.
 * 
 * TODOS os endpoints requerem autenticação JWT.
 * 
 * Endpoints disponíveis:
 * 
 * CONSULTA:
 * - GET /api/progress/statistics - Estatísticas gerais (streak, tempo, etc.)
 * - GET /api/progress/status - Status de aulas (concluídas, em andamento)
 * - GET /api/progress/activities - Atividades recentes
 * - GET /api/modules/available - Módulos com status de desbloqueio
 * 
 * ATUALIZAÇÃO:
 * - POST /api/lessons/:id/video-progress - Atualizar progresso do vídeo
 * - POST /api/lessons/:id/complete - Marcar aula como concluída
 * 
 * EXCLUSÃO:
 * - POST /api/progress/reset - Resetar todo o progresso
 * 
 * Segurança:
 * - Usuário só pode acessar/modificar seu próprio progresso
 * - ID do usuário é extraído do token JWT (req.user.id)
 * - Parâmetros de rota são validados (ParseIntPipe)
 * ========================================================================
 */

import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProgressService } from './progress.service';

/**
 * Controlador de progresso.
 * 
 * Todos os endpoints requerem autenticação JWT.
 * O @UseGuards(JwtAuthGuard) é aplicado na classe inteira.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  /**
   * Injeção de dependência do ProgressService.
   */
  constructor(private progress: ProgressService) {}

  /**
   * Retorna estatísticas gerais de progresso do usuário.
   * 
   * GET /api/progress/statistics
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - progressoGeral: Porcentagem de aulas concluídas (0-100)
   * - aulasConcluidas: Número de aulas concluídas
   * - totalAulas: Total de aulas disponíveis
   * - diasSeguidos: Streak atual (dias consecutivos)
   * - melhorSequencia: Maior streak já alcançado
   * - tempoTotalAssistido: Tempo total em segundos
   * - ultimoAcesso: Data/hora do último acesso
   * 
   * Uso: Dashboard do usuário, gamificação
   */
  @Get('progress/statistics')
  getStatistics(@Req() req: any) {
    return this.progress.getStatistics(req.user.id);
  }

  /**
   * Retorna o status de progresso do usuário.
   * 
   * GET /api/progress/status
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - concluidas: Array com IDs das aulas concluídas
   * - emAndamento: Objeto com IDs das aulas em andamento
   *                 (chave: aulaId, valor: progressoVideo)
   * 
   * Uso: Marcar aulas na interface (ícones de conclusão)
   */
  @Get('progress/status')
  getProgressStatus(@Req() req: any) {
    return this.progress.getProgressStatus(req.user.id);
  }

  /**
   * Retorna as atividades recentes do usuário.
   * 
   * GET /api/progress/activities
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - Array de atividades ordenadas por data (mais recente primeiro)
   * - Máximo de 20 atividades
   * - Cada atividade contém: tipo, descrição, data
   * 
   * Uso: Timeline de atividades, log de auditoria
   */
  @Get('progress/activities')
  getActivities(@Req() req: any) {
    return this.progress.getActivities(req.user.id);
  }

  /**
   * Retorna módulos disponíveis com status de desbloqueio.
   * 
   * GET /api/modules/available
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - Lista de todos os módulos com informações detalhadas
   * - Status de desbloqueio (bloqueado/desbloqueado)
   * - Progresso de cada aula
   * - Regra de desbloqueio: Módulo só desbloqueia quando o anterior é concluído
   * 
   * Uso: Página de módulos do curso
   */
  @Get('modules/available')
  getAvailableModules(@Req() req: any) {
    return this.progress.getAvailableModules(req.user.id);
  }

  /**
   * Atualiza o progresso de visualização de um vídeo.
   * 
   * POST /api/lessons/:id/video-progress
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Parâmetros:
   * - id: ID da aula (obrigatório)
   * 
   * Body:
   * - progress: Porcentagem assistida (0-100)
   * - currentTime: Tempo atual em segundos (opcional)
   * 
   * Comportamento:
   * - Atualiza progressoVideo e tempoAssistido
   * - Se progresso >= 100, marca aula como concluída automaticamente
   * - Usa upsert: cria ou atualiza registro
   * 
   * Uso: Chamado a cada 10-30 segundos durante a reprodução do vídeo
   */
  @Post('lessons/:id/video-progress')
  updateVideoProgress(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('progress') progress: number,
    @Body('currentTime') currentTime?: number,
  ) {
    return this.progress.updateVideoProgress(req.user.id, id, progress, currentTime);
  }

  /**
   * Marca uma aula como concluída.
   * 
   * POST /api/lessons/:id/complete
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Parâmetros:
   * - id: ID da aula (obrigatório)
   * 
   * Comportamento:
   * - Marca videoAssistido = true
   * - Marca concluido = true
   * - Registra data/hora de conclusão
   * - Recalcula progresso do módulo pai
   * - Se módulo atingir 100%, marca como concluído
   * - Registra atividade de conclusão
   * 
   * Uso: Chamado quando usuário clica "Marcar como concluída"
   */
  @Post('lessons/:id/complete')
  completeLesson(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.progress.completeLesson(req.user.id, id);
  }

  /**
   * Reseta todo o progresso do usuário.
   * 
   * POST /api/progress/reset
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Comportamento:
   * - Exclui todos os registros de progresso de aulas
   * - Exclui todos os registros de progresso de módulos
   * - Exclui todas as atividades registradas
   * - Registra atividade de reset
   * 
   * ATENÇÃO: Esta operação é IRREVERSÍVEL!
   * 
   * Uso: Opção "Resetar progresso" no perfil do usuário
   */
  @Post('progress/reset')
  resetProgress(@Req() req: any) {
    return this.progress.resetProgress(req.user.id);
  }
}
