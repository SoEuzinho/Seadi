/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Módulo
 * ========================================================================
 * 
 * Este módulo agrupa todos os componentes do Quiz Multiplayer:
 * 
 * - QuizController     → Endpoints REST (categorias, histórico)
 * - QuizService        → Banco de perguntas e histórico
 * - QuizScoreService   → Cálculo de pontuação (somente no servidor)
 * - QuizRoomStore      → Armazenamento em memória das salas
 * - QuizRoomService    → Ciclo de vida das salas públicas (lobby/Host)
 * - QuizMatchService   → Partida (perguntas, cronômetro, ranking)
 * - QuizGateway        → Comunicação Socket.IO
 * 
 * Dependências:
 * - AuthModule: exporta o JwtModule (usado para autenticar os sockets)
 * - PrismaModule: global, fornece acesso ao banco de dados
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizScoreService } from './quiz-score.service';
import { QuizRoomStore } from './quiz-room.store';
import { QuizRoomService } from './quiz-room.service';
import { QuizMatchService } from './quiz-match.service';
import { QuizGateway } from './quiz.gateway';

@Module({
  imports: [AuthModule],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizScoreService,
    QuizRoomStore,
    QuizRoomService,
    QuizMatchService,
    QuizGateway,
  ],
  exports: [QuizService],
})
export class QuizModule {}
