/**
 * ========================================================================
 * GUARD DE AUTENTICAÇÃO JWT - Proteção de Rotas
 * ========================================================================
 * 
 * Este guard é responsável por proteger rotas que requerem autenticação.
 * Ele verifica se a requisição contém um token JWT válido no header
 * Authorization: Bearer <token>
 * 
 * Como funciona:
 * 1. Extrai o token do header Authorization
 * 2. Valida o token usando a JwtStrategy
 * 3. Se válido, anexa os dados do usuário à requisição (req.user)
 * 4. Se inválido, lança UnauthorizedException (401)
 * 
 * Uso:
 * Adicione o decorador @UseGuards(JwtAuthGuard) em qualquer rota ou controller
 * que queira proteger.
 * 
 * Exemplo:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) {
 *   return req.user; // Dados do usuário autenticado
 * }
 * 
 * O token JWT deve ter:
 * - Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * - Payload: { sub: userId, email: user@email.com, iat: ..., exp: ... }
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticação JWT.
 * 
 * Extends AuthGuard('jwt') do @nestjs/passport.
 * O Passport automaticamente:
 * 1. Extrai o token do header Authorization
 * 2. Chama a JwtStrategy.validate() para verificar o token
 * 3. Retorna os dados do usuário ou lança exceção
 * 
 * Este guard éstateless - não mantém sessões no servidor.
 * Cada requisição deve conter o token completo.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
