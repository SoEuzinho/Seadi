/**
 * ========================================================================
 * CONTROLADOR DE RANKING - Endpoints da área de Diversões
 * ========================================================================
 *
 * Endpoints (todos exigem autenticação JWT):
 *
 * - GET /api/ranking/students : Todos os alunos com progresso e atividade
 * - GET /api/ranking/online   : Alunos online agora (últimos 10 min)
 * - GET /api/ranking/fastest  : Quem concluiu o curso em menos tempo
 * - GET /api/ranking/days     : Melhores dias de acesso (últimos 14 dias)
 * - GET /api/ranking/stats    : Estatísticas gerais da turma
 * - GET /api/ranking/quiz     : Ranking dos melhores no Quiz Multiplayer
 * - GET /api/ranking/pioneiros: Primeiros alunos cadastrados
 * - GET /api/ranking/streak   : Maiores sequências de acesso
 * - GET /api/ranking/conquistas : Conquistas por aluno
 * - POST /api/ranking/heartbeat : Marca o usuário como ativo agora
 * ========================================================================
 */

import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingService } from './ranking.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private ranking: RankingService) {}

  @Get('ranking/students')
  getStudents() {
    return this.ranking.getStudents();
  }

  @Get('ranking/online')
  getOnline() {
    return this.ranking.getOnline();
  }

  @Get('ranking/fastest')
  getFastest() {
    return this.ranking.getFastest();
  }

  @Get('ranking/days')
  getDays() {
    return this.ranking.getDays();
  }

  @Get('ranking/stats')
  getStats() {
    return this.ranking.getStats();
  }

  @Get('ranking/quiz')
  getQuiz() {
    return this.ranking.getQuiz();
  }

  @Get('ranking/quiz/categorias')
  getQuizByCategory() {
    return this.ranking.getQuizByCategory();
  }

  @Get('ranking/pioneiros')
  getPioneiros() {
    return this.ranking.getPioneiros();
  }

  @Get('ranking/streak')
  getStreak() {
    return this.ranking.getStreak();
  }

  @Get('ranking/conquistas')
  getConquistas() {
    return this.ranking.getConquistas();
  }

  /** Heartbeat: atualiza ultimoAcesso para "agora" (mantém o usuário online). */
  @Post('ranking/heartbeat')
  heartbeat(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.ranking.heartbeat(user.id);
  }
}
