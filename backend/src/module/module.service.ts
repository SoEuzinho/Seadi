/**
 * ========================================================================
 * SERVIÇO DE MÓDULOS - Lógica de Consulta
 * ========================================================================
 * 
 * Este serviço contém a lógica de negócio para consulta de módulos
 * e aulas do curso SEADI.
 * 
 * Funcionalidades:
 * 
 * 1. LISTAR MÓDULOS
 *    - Retorna todos os módulos ordenados
 *    - Inclui contagem de aulas
 *    - Não retorna aulas (apenas metadados)
 * 
 * 2. OBTER MÓDULO
 *    - Retorna dados completos de um módulo
 *    - Inclui lista de aulas ordenadas
 *    - Lança 404 se não encontrar
 * 
 * 3. OBTER AULA
 *    - Retorna dados completos de uma aula
 *    - Inclui informações do módulo pai
 *    - Lança 404 se não encontrar
 * 
 * Este serviço é puro de consulta (read-only).
 * Não há criação, atualização ou exclusão de dados.
 * Os dados do curso são populados via seed (prisma/seed.ts).
 * ========================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Serviço de consulta de módulos e aulas.
 * 
 * Este serviço é responsável por:
 * - Buscar informações do curso no banco de dados
 * - Formatar as respostas para o frontend
 * - Tratar erros de consulta (404 Not Found)
 */
@Injectable()
export class ModuleService {
  /**
   * Injeção de dependência do PrismaService.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os módulos do curso.
   * 
   * Este método retorna uma visão geral dos módulos,
   * sem detalhar as aulas (apenas a contagem).
   * 
   * @returns Array de módulos ordenados por ordem
   * 
   * Consulta SQL equivalente:
   * SELECT id, ordem, titulo, descricao, icone,
   *        (SELECT COUNT(*) FROM Aula WHERE moduloId = Modulo.id) as totalAulas
   * FROM Modulo
   * ORDER BY ordem ASC
   */
  async listModules() {
    return this.prisma.modulo.findMany({
      orderBy: { ordem: 'asc' },
      select: {
        id: true,
        ordem: true,
        titulo: true,
        descricao: true,
        icone: true,
        _count: { select: { aulas: true } },
      },
    });
  }

  /**
   * Obtém detalhes completos de um módulo com suas aulas.
   * 
   * @param moduleId - ID do módulo desejado
   * @returns Objeto com dados do módulo e lista de aulas
   * 
   * @throws NotFoundException - Se o módulo não for encontrado
   * 
   * Consulta SQL equivalente:
   * SELECT * FROM Modulo
   * LEFT JOIN Aula ON Aula.moduloId = Modulo.id
   * WHERE Modulo.id = ?
   * ORDER BY Aula.ordem ASC
   */
  async getModule(moduleId: number) {
    const mod = await this.prisma.modulo.findUnique({
      where: { id: moduleId },
      include: {
        aulas: {
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            ordem: true,
            titulo: true,
            descricao: true,
            videoUrl: true,
            duracao: true,
          },
        },
      },
    });

    if (!mod) throw new NotFoundException('Module not found');
    return mod;
  }

  /**
   * Obtém detalhes completos de uma aula específica.
   * 
   * @param lessonId - ID da aula desejada
   * @returns Objeto com dados da aula e informações do módulo pai
   * 
   * @throws NotFoundException - Se a aula não for encontrada
   * 
   * Consulta SQL equivalente:
   * SELECT Aula.*, Modulo.id as moduloId, Modulo.titulo as moduloTitulo
   * FROM Aula
   * INNER JOIN Modulo ON Modulo.id = Aula.moduloId
   * WHERE Aula.id = ?
   */
  async getLesson(lessonId: number) {
    const lesson = await this.prisma.aula.findUnique({
      where: { id: lessonId },
      include: {
        modulo: { select: { id: true, titulo: true, ordem: true } },
      },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}
