/**
 * ========================================================================
 * MÓDULO RAIZ DA APLICAÇÃO - SEADI Backend
 * ========================================================================
 * 
 * Este é o módulo principal que orquestra todos os outros módulos do sistema.
 * O NestJS utiliza uma arquitetura baseada em módulos para organizar o código.
 * 
 * Módulos importados:
 * - PrismaModule: Acesso ao banco de dados (global)
 * - AuthModule: Autenticação e autorização
 * - UserModule: Gerenciamento de perfil de usuário
 * - ProgressModule: Acompanhamento de progresso nas aulas
 * - ModuleModule: Módulos e aulas do curso
 * - UploadModule: Upload de arquivos (fotos de perfil)

 * 
 * O AppModule serve como o "ponto de encontro" de todos os módulos,
 * permitindo que eles se comuniquem através de injeção de dependência.
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ModuleModule } from './module/module.module';
import { ProgressModule } from './progress/progress.module';
import { UploadModule } from './upload/upload.module';
import { QuizModule } from './quiz/quiz.module';
import { RankingModule } from './ranking/ranking.module';
import { AchievementModule } from './achievement/achievement.module';


/**
 * Módulo raiz da aplicação SEADI.
 * 
 * Este módulo é responsável por:
 * 1. Importar e integrar todos os módulos funcionais
 * 2. Registrar o controlador raiz (AppController)
 * 3. Servir como ponto de entrada para o sistema de módulos do NestJS
 * 
 * A ordem dos imports não afeta a funcionalidade, mas segue uma lógica:
 * - Prisma primeiro (é global e dependência de quase tudo)
 * - Módulos de negócio organizados por funcionalidade
 */
@Module({
  imports: [
    // Rate limit global: protege a API contra abuso/scraping/flood.
    // Por IP real (trust proxy). Valor configurável via RATE_LIMIT_PER_IP
    // (padrão 900/min) — folgado para uma turma inteira atrás do mesmo NAT,
    // mas ainda bloqueia flood de requests em rajada.
    ThrottlerModule.forRoot([{
      ttl: 60 * 1000,
      limit: parseInt(process.env.RATE_LIMIT_PER_IP || '900', 10),
    }]),
    PrismaModule,    // Acesso ao banco de dados - DEVE ser global
    AuthModule,      // Autenticação (login, registro, recuperação de senha)
    UserModule,      // Gerenciamento de perfil do usuário
    ProgressModule,  // Progresso e estatísticas de aprendizado
    ModuleModule,    // Módulos e aulas do curso
    UploadModule,    // Upload de fotos de perfil
    QuizModule,      // Quiz Multiplayer (BETA) - partidas em tempo real
    RankingModule,   // Ranking da área de Diversões
    AchievementModule, // Conquistas e medalhas da área de Diversões

  ],
  controllers: [AppController], // Controller raiz (apenas health check)
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
