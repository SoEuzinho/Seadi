/**
 * ========================================================================
 * CONTROLADOR DE CONQUISTAS - Endpoints da área de Diversões
 * ========================================================================
 *
 * Endpoints (todos exigem autenticação JWT):
 *
 * - GET  /api/achievements           : Lista todas as conquistas do aluno
 * - POST /api/achievements/visit     : Registra visita à área Minha Conta
 * - POST /api/achievements/simulator : Registra conclusão de um simulador
 * ========================================================================
 */

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementService } from './achievement.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(private achievement: AchievementService) {}

  @Get('achievements')
  list(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.achievement.list(user.id);
  }

  @Post('achievements/visit')
  visit(@Req() req: Request, @Body() body: { area?: string }) {
    const user = req.user as { id: number };
    const area = String(body?.area || 'Minha Conta');
    return this.achievement.visit(user.id, area);
  }

  @Post('achievements/simulator')
  simulator(@Req() req: Request, @Body() body: { slug?: string }) {
    const user = req.user as { id: number };
    const slug = String(body?.slug || '');
    return this.achievement.simulator(user.id, slug);
  }
}
