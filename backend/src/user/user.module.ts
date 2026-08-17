/**
 * ========================================================================
 * MÓDULO DE USUÁRIO - Gerenciamento de Perfil
 * ========================================================================
 * 
 * Este módulo é responsável por toda a lógica relacionada ao perfil
 * dos usuários da plataforma SEADI.
 * 
 * Funcionalidades:
 * - Visualizar perfil do usuário
 * - Atualizar dados cadastrais (nome, telefone, data de nascimento)
 * - Alterar senha
 * - Visualizar progresso geral do usuário
 * 
 * Este módulo depende do ProgressModule para:
 * - Registrar atividades de alteração de perfil
 * - Registrar atividades de alteração de senha
 * 
 * Os endpoints deste módulo requerem autenticação JWT,
 * pois só o próprio usuário pode acessar e modificar seu perfil.
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProgressModule } from '../progress/progress.module';

/**
 * Módulo de usuário do sistema SEADI.
 * 
 * Controllers:
 * - UserController: Endpoints REST para gerenciamento de perfil
 * 
 * Providers (Serviços):
 * - UserService: Lógica de negócio de perfil
 * 
 * Imports:
 * - ProgressModule: Para registrar atividades (ActivityService)
 */
@Module({
  imports: [ProgressModule], // Necessário para ActivityService
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
