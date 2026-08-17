/**
 * ========================================================================
 * MÓDULO DE CONQUISTAS - Medalhas da área de Diversões
 * ========================================================================
 *
 * Expõe as conquistas/medalhas conquistadas pelo aluno a partir dos dados
 * reais da plataforma (aulas, módulos, logins, quiz, visitas e
 * simuladores interativos).
 *
 * Componentes:
 * - AchievementController: Endpoints REST (JWT)
 * - AchievementService: Cálculo e persistência das conquistas
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';

@Module({
  controllers: [AchievementController],
  providers: [AchievementService],
})
export class AchievementModule {}
