/**
 * ========================================================================
 * MÓDULO DO PRISMA - Acesso Global ao Banco de Dados
 * ========================================================================
 * 
 * Este módulo encapsula o PrismaService e o torna disponível globalmente.
 * 
 * O Prisma é um ORM (Object-Relational Mapper) moderno para TypeScript
 * que facilita a interação com bancos de dados relacionais.
 * 
 * Funcionalidades:
 * - Conexão automática com o banco na inicialização
 * - Desconexão adequada no encerramento
 * - Tipagem automática das tabelas
 * - Migrações de banco de dados
 * 
 * Configuração Global:
 * O decorador @Global() permite que qualquer módulo da aplicação
 * injete o PrismaService sem precisar importar o PrismaModule.
 * Isso é útil porque quase todos os services precisam acessar o banco.
 * ========================================================================
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo do Prisma configurado como global.
 * 
 * @Global() - Torna o PrismaService disponível em toda a aplicação
 * sem necessidade de importação explícita em cada módulo.
 * 
 * Providers: Lista de serviços que este módulo fornece
 * Exports: Lista de serviços que este módulo exporta para uso externo
 * (neste caso, é redundante com @Global, mas mantém a clareza)
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
