/**
 * ========================================================================
 * MÓDULO DE PROGRESSO - Acompanhamento de Aprendizado
 * ========================================================================
 * 
 * Este módulo é responsável por toda a lógica de acompanhamento
 * do progresso dos usuários nas aulas e módulos do curso.
 * 
 * Funcionalidades:
 * - Registrar progresso em vídeos (tempo assistido, porcentagem)
 * - Marcar aulas como concluídas
 * - Calcular estatísticas (streak, tempo total, progresso geral)
 * - Gerenciar desbloqueio sequencial de módulos
 * - Registrar atividades do usuário
 * - Permitir reset de progresso
 * 
 * Componentes:
 * - ProgressController: Endpoints REST para progresso
 * - ProgressService: Lógica de negócio de progresso
 * - ActivityService: Serviço de log de atividades (compartilhado)
 * 
 * O ActivityService é exportado para uso outros módulos,
 * pois vários services precisam registrar atividades:
 * - AuthModule (login)
 * - UserModule (alteração de perfil/senha)
 * - ProgressModule (conclusão de aulas/módulos)
 * 
 * TODOS os endpoints deste módulo requerem autenticação JWT.
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ActivityService } from './activity.service';

/**
 * Módulo de progresso do sistema SEADI.
 * 
 * Controllers:
 * - ProgressController: Endpoints REST para progresso
 * 
 * Providers (Serviços):
 * - ProgressService: Lógica de negócio de progresso
 * - ActivityService: Serviço de log de atividades
 * 
 * Exports:
 * - ActivityService: Disponível para outros módulos
 */
@Module({
  controllers: [ProgressController],
  providers: [ProgressService, ActivityService],
  exports: [ActivityService], // Exporta para uso em AuthModule e UserModule
})
export class ProgressModule {}
