/**
 * ========================================================================
 * MÓDULO DE AUTENTICAÇÃO - SEADI Backend
 * ========================================================================
 * 
 * Este módulo é responsável por toda a lógica de autenticação e autorização
 * da plataforma SEADI. Ele gerencia:
 * 
 * - Registro de novos usuários
 * - Login e geração de tokens JWT
 * - Recuperação de senha via email
 * - Validação de tokens em rotas protegidas
 * 
 * Componentes:
 * - AuthController: Endpoints REST para autenticação
 * - AuthService: Lógica de negócio de autenticação
 * - JwtStrategy: Estratégia de validação do Passport
 * - MailService: Envio de emails (recuperação de senha)
 * 
 * Configuração JWT:
 * - Secret: Variável de ambiente JWT_SECRET
 * - Expiração: Variável de ambiente JWT_EXPIRES_IN (padrão: 12h)
 * 
 * O JWT (JSON Web Token) é um padrão seguro para autenticação stateless,
 * onde o token contém as informações do usuário e é validado em cada requisição.
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from '../mail/mail.service';
import { ProgressModule } from '../progress/progress.module';

/**
 * Módulo de autenticação do sistema SEADI.
 * 
 * Imports:
 * - PassportModule: Configura o Passport com estratégia JWT padrão
 * - JwtModule: Configura a geração e validação de tokens JWT
 * - ProgressModule: Necessário para registrar atividades de login
 * 
 * Controllers:
 * - AuthController: Expõe os endpoints de autenticação
 * 
 * Providers (Serviços):
 * - AuthService: Lógica de negócio de autenticação
 * - JwtStrategy: Implementa a validação do token JWT
 * - MailService: Serviço de envio de emails
 * 
 * Exports:
 * - AuthService: Disponível para outros módulos que precisem de auth
 * - JwtModule: Disponível para outros módulos que precisem de JWT
 * - MailService: Disponível para outros módulos que precisem de email
 */
@Module({
  imports: [
    // Configura o Passport para usar JWT como estratégia padrão
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Configura o módulo JWT com secret e expiração
    // O secret é usado para assinar e validar os tokens
    // A expiração define por quanto tempo o token é válido
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '12h' },
    }),
    
    // ProgressModule é importado para registrar atividades de login
    ProgressModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService, JwtModule, MailService],
})
export class AuthModule {}
