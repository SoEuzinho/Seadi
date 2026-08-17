/**
 * ========================================================================
 * SERVIÇO DO PRISMA - Gerenciamento de Conexão com o Banco
 * ========================================================================
 * 
 * Este serviço encapsula o PrismaClient e gerencia o ciclo de vida
 * da conexão com o banco de dados.
 * 
 * O PrismaClient é a classe principal do Prisma que fornece:
 * - Métodos para CRUD (Create, Read, Update, Delete)
 * - Tipagem automática das tabelas
 * - Consultas complexas com relacionamentos
 * - Transações e operações atômicas
 * 
 * Ciclo de Vida:
 * - onModuleInit(): Conecta ao banco quando a aplicação inicia
 * - onModuleDestroy(): Desconecta do banco quando a aplicação encerra
 * 
 * Isso garante que a conexão seja gerenciada adequadamente,
 * evitando vazamentos de conexões e erros de conexão.
 * ========================================================================
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço que gerencia a conexão com o banco de dados via Prisma.
 * 
 * Extends PrismaClient: Herda todos os métodos de consulta do Prisma
 * OnModuleInit: Interface que define o método de inicialização do módulo
 * OnModuleDestroy: Interface que define o método de limpeza do módulo
 * 
 * Uso:
 * Em qualquer service, injete o PrismaService:
 * 
 * constructor(private prisma: PrismaService) {}
 * 
 * Então use os métodos de consulta:
 * const users = await this.prisma.usuario.findMany();
 * const user = await this.prisma.usuario.create({ data: { ... } });
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Conecta ao banco de dados quando o módulo é inicializado.
   * 
   * Este método é chamado automaticamente pelo NestJS quando a aplicação
   * inicia. Ele estabelece a conexão com o banco de dados configurado
   * no arquivo prisma/schema.prisma.
   * 
   * A conexão é mantida ativa durante toda a vida útil da aplicação
   * para melhor performance (pool de conexões).
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Desconecta do banco de dados quando o módulo é destruído.
   * 
   * Este método é chamado quando a aplicação é encerrada (graceful shutdown).
   * Ele fecha todas as conexões abertas, liberando recursos do banco.
   * 
   * Isso é importante para:
   * - Evitar conexões fantasma no banco
   * - Liberar memória e recursos do sistema
   * - Permitir restarts limpos da aplicação
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
