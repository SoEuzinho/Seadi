/**
 * ========================================================================
 * MÓDULO DE CURSO - Módulos e Aulas
 * ========================================================================
 * 
 * Este módulo é responsável por gerenciar a estrutura do curso,
 * incluindo módulos e aulas.
 * 
 * Funcionalidades:
 * - Listar todos os módulos do curso
 * - Obter detalhes de um módulo específico com suas aulas
 * - Obter detalhes de uma aula específica
 * 
 * Este módulo NÃO requer autenticação para visualização,
 * pois as informações do curso são públicas.
 * 
 * Estrutura do curso:
 * - Módulo: Unidade principal do curso (ex: "Introdução à Inclusão Digital")
 *   - Contém várias aulas ordenadas
 *   - Cada módulo tem um ícone e descrição
 * 
 * - Aula: Unidade de aprendizado dentro de um módulo
 *   - Contém vídeo, conteúdo e duração
 *   - Cada aula pertence a um único módulo
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';

/**
 * Módulo de curso do sistema SEADI.
 * 
 * Controllers:
 * - ModuleController: Endpoints REST para consulta de módulos e aulas
 * 
 * Providers (Serviços):
 * - ModuleService: Lógica de negócio de consulta
 * 
 * Exports:
 * - ModuleService: Disponível para outros módulos (ex: ProgressModule)
 */
@Module({
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
