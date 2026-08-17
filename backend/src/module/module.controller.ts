/**
 * ========================================================================
 * CONTROLADOR DE MÓDULOS - Endpoints de Consulta
 * ========================================================================
 * 
 * Este controlador expõe os endpoints REST para consulta de módulos
 * e aulas do curso.
 * 
 * Endpoints disponíveis:
 * - GET /api/modules - Lista todos os módulos
 * - GET /api/modules/:id - Detalhes de um módulo com aulas
 * - GET /api/lessons/:id - Detalhes de uma aula específica
 * 
 * IMPORTANTE: Estes endpoints NÃO requerem autenticação!
 * As informações do curso são públicas e podem ser acessadas
 * por qualquer visitante (inclusive antes do login).
 * 
 * Isso permite que:
 * - Visitantes vejam a estrutura do curso
 * - Usuários não autenticados vejam informações básicas
 * - O frontend exiba a página de módulos antes do login
 * 
 * Parâmetros de rota:
 * - :id - ID numérico do módulo ou aula (ParseIntPipe)
 * ========================================================================
 */

import {
  Controller, Get, Param, ParseIntPipe,
} from '@nestjs/common';
import { ModuleService } from './module.service';

/**
 * Controlador de módulos do curso.
 * 
 * NOTA: Nenhum endpoint requer autenticação.
 * As rotas são públicas para permitir visualização do curso.
 */
@Controller()
export class ModuleController {
  /**
   * Injeção de dependência do ModuleService.
   */
  constructor(private moduleService: ModuleService) {}

  /**
   * Lista todos os módulos do curso.
   * 
   * GET /api/modules
   * 
   * Requer autenticação: NÃO
   * 
   * Retorna:
   * - Lista de módulos ordenados por ordem
   * - Cada módulo contém: id, ordem, título, descrição, ícone
   * - Contagem de aulas em cada módulo
   * 
   * Exemplo de resposta:
   * [
   *   {
   *     "id": 1,
   *     "ordem": 1,
   *     "titulo": "Introdução à Inclusão Digital",
   *     "descricao": "Conceitos básicos...",
   *     "icone": "computer",
   *     "_count": { "aulas": 5 }
   *   }
   * ]
   */
  @Get('modules')
  listModules() {
    return this.moduleService.listModules();
  }

  /**
   * Obtém detalhes de um módulo específico com suas aulas.
   * 
   * GET /api/modules/:id
   * 
   * Requer autenticação: NÃO
   * 
   * Parâmetros:
   * - id: ID numérico do módulo (obrigatório)
   * 
   * Retorna:
   * - Dados completos do módulo
   * - Lista de aulas ordenadas por ordem
   * - Cada aula contém: id, ordem, título, descrição, URL do vídeo, duração
   * 
   * Erros:
   * - 400 Bad Request: ID não é um número válido
   * - 404 Not Found: Módulo não encontrado
   */
  @Get('modules/:id')
  getModule(@Param('id', ParseIntPipe) id: number) {
    return this.moduleService.getModule(id);
  }

  /**
   * Obtém detalhes de uma aula específica.
   * 
   * GET /api/lessons/:id
   * 
   * Requer autenticação: NÃO
   * 
   * Parâmetros:
   * - id: ID numérico da aula (obrigatório)
   * 
   * Retorna:
   * - Dados completos da aula
   * - Informações do módulo pai (id, título, ordem)
   * - URL do vídeo, conteúdo, duração
   * 
   * Erros:
   * - 400 Bad Request: ID não é um número válido
   * - 404 Not Found: Aula não encontrada
   */
  @Get('lessons/:id')
  getLesson(@Param('id', ParseIntPipe) id: number) {
    return this.moduleService.getLesson(id);
  }
}
