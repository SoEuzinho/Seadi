/**
 * ========================================================================
 * MÓDULO DE RANKING - Área de Diversões
 * ========================================================================
 *
 * Expõe os endpoints comparativos entre os alunos usados pela página
 * de Ranking (quem está online, mais dias ativos, curso mais rápido,
 * melhores dias de acesso e progresso de todos os alunos).
 *
 * Componentes:
 * - RankingController: Endpoints REST (JWT)
 * - RankingService: Lógica de agregação e ordenação
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
