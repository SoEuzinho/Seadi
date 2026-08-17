/**
 * ========================================================================
 * SERVIÇO DE ATIVIDADES - Log de Auditoria
 * ========================================================================
 * 
 * Este serviço é responsável por registrar todas as atividades
 * significativas dos usuários na plataforma SEADI.
 * 
 * Funcionalidades:
 * - Registrar atividades com tipo e descrição
 * - Listar atividades recentes do usuário
 * 
 * Tipos de atividades registradas:
 * - login: Usuário fez login na plataforma
 * - perfil_alterado: Usuário alterou dados cadastrais
 * - senha_alterada: Usuário alterou a senha
 * - aula_concluida: Usuário concluiu uma aula
 * - modulo_concluido: Usuário completou um módulo
 * - progresso_resetado: Usuário resetou seu progresso
 * 
 * Este serviço é COMPARTILHADO por vários módulos:
 * - AuthModule: Registra logins
 * - UserModule: Registra alterações de perfil/senha
 * - ProgressModule: Registra conclusões de aulas/módulos
 * 
 * O ActivityService é exportado pelo ProgressModule para que
 * outros módodos possam injetá-lo e registrar atividades.
 * 
 * Uso:
 * Em qualquer service, injete o ActivityService e chame log():
 * 
 * await this.activity.log(userId, 'tipo_atividade', 'Descrição da atividade');
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Serviço de registro de atividades.
 * 
 * Este serviço fornece uma interface simples para:
 * - Criar registros de atividade
 * - Listar atividades recentes
 * 
 * As atividades são armazenadas na tabela 'atividade' do banco
 * e podem ser consultadas para:
 * - Timeline de atividades do usuário
 * - Log de auditoria
 * - Análise de engajamento
 */
@Injectable()
export class ActivityService {
  /**
   * Injeção de dependência do PrismaService.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Registra uma nova atividade.
   * 
   * @param usuarioId - ID do usuário que realizou a atividade
   * @param tipo - Tipo da atividade (ex: 'login', 'aula_concluida')
   * @param descricao - Descrição legível da atividade
   * @returns Registro criado no banco de dados
   * 
   * Exemplos de uso:
   * await this.activity.log(1, 'login', 'Fez login na plataforma');
   * await this.activity.log(1, 'aula_concluida', 'Concluiu a aula "Introdução"');
   * 
   * O campo 'tipo' é usado para filtrar e categorizar atividades.
   * O campo 'descricao' é exibido na timeline do usuário.
   */
  async log(usuarioId: number, tipo: string, descricao: string) {
    return this.prisma.atividade.create({
      data: { usuarioId, tipo, descricao },
    });
  }

  /**
   * Lista as atividades recentes do usuário.
   * 
   * @param usuarioId - ID do usuário
   * @param limit - Número máximo de atividades (padrão: 20)
   * @returns Array de atividades ordenadas por data (mais recente primeiro)
   * 
   * Estrutura retornada:
   * [
   *   {
   *     id: 1,
   *     tipo: 'aula_concluida',
   *     descricao: 'Concluiu a aula "Introdução"',
   *     criadoEm: '2024-01-15T10:30:00.000Z'
   *   }
   * ]
   */
  async list(usuarioId: number, limit = 20) {
    return this.prisma.atividade.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      take: limit,
    });
  }
}
