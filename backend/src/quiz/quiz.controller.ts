/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Controller REST
 * ========================================================================
 * 
 * Este controlador expõe os endpoints REST do Quiz Multiplayer.
 * Todos os endpoints exigem autenticação JWT (área do usuário).
 * 
 * Endpoints disponíveis:
 * - GET /api/quiz/categories - Lista categorias de perguntas
 * - GET /api/quiz/history     - Histórico de partidas do usuário
 * - GET /api/quiz/ranking     - Ranking geral dos jogadores
 * 
 * A lógica de partidas em tempo real (salas, perguntas, ranking)
 * é feita exclusivamente via Socket.IO pelo QuizGateway.
 * ========================================================================
 */

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizService } from './quiz.service';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private quizService: QuizService) {}

  /**
   * GET /api/quiz/categories
   * Retorna as categorias disponíveis para criar uma partida,
   * com a quantidade de perguntas ativas em cada uma.
   */
  @Get('categories')
  getCategories() {
    return this.quizService.listCategories();
  }

  /**
   * GET /api/quiz/history
   * Retorna as partidas concluídas do usuário (mais recentes primeiro).
   */
  @Get('history')
  getHistory(@Req() req: any) {
    return this.quizService.getHistory(req.user.id);
  }

  /**
   * GET /api/quiz/ranking
   * Retorna o ranking geral dos jogadores do Quiz Multiplayer.
   */
  @Get('ranking')
  getRanking() {
    return this.quizService.getRanking();
  }
}
