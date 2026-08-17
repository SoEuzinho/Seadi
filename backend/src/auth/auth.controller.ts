/**
 * ========================================================================
 * CONTROLADOR DE AUTENTICAÇÃO - Endpoints de Auth
 * ========================================================================
 * 
 * Este controlador expõe os endpoints REST para autenticação de usuários.
 * Todos os endpoints são públicos (não requerem autenticação).
 * 
 * Endpoints disponíveis:
 * - POST /api/auth/register - Registro de novo usuário
 * - POST /api/auth/login - Login e obtenção de token JWT
 * - POST /api/auth/forgot-password - Solicitação de código de recuperação
 * - POST /api/auth/reset-password - Redefinição de senha com código
 * 
 * Todas as rotas estão sob o prefixo '/auth' (combinado com '/api' global)
 * Resultando em URLs como: /api/auth/login, /api/auth/register, etc.
 * 
 * Segurança:
 * - Validação automática de DTOs via ValidationPipe global
 * - Rate limiting implementado no service (máx 5 tentativas/15min)
 * - Senhas com complexidade mínima (8+ caracteres, maiúscula, número, especial)
 * ========================================================================
 */

import { Request, Response } from 'express';
import { Controller, Post, Body, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from './cookie';

/**
 * Controlador de autenticação.
 * 
 * Rotas base: '/api/auth/*'
 * 
 * Este controlador não requer autenticação JWT,
 * pois é responsável por criar autenticar usuários.
 */
@Controller('auth')
export class AuthController {
  /**
   * Injeção de dependência do AuthService.
   * O NestJS automaticamente cria uma instância do AuthService
   * e a injeta neste controller.
   */
  constructor(private authService: AuthService) {}

  /**
   * Endpoint de registro de novo usuário.
   * 
   * POST /api/auth/register
   * 
   * Recebe os dados do usuário via body da requisição:
   * - name (obrigatório): Nome completo
   * - email (obrigatório): Email válido
   * - password (obrigatório): Senha com complexidade mínima
   * - phone (opcional): Telefone
   * - birthDate (opcional): Data de nascimento
   * 
   * Retorna:
   * - user: Dados do usuário criado (id, nome, email, criadoEm)
   * - token: Token JWT para autenticação
   * 
   * Erros:
   * - 409 Conflict: Email já cadastrado
   * - 400 Bad Request: Dados inválidos
   */
  @Post('register')
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterDto,
  ) {
    const result = await this.authService.register(dto);
    // Token JWT vai para cookie httpOnly (invisível para JS/XSS).
    res.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  /**
   * Endpoint de login.
   * 
   * POST /api/auth/login
   * 
   * Recebe:
   * - email: Email do usuário
   * - password: Senha do usuário
   * 
   * Retorna:
   * - user: Dados básicos do usuário (id, nome, email)
   * - token: Token JWT para autenticação
   * 
   * Segurança:
   * - Rate limiting: Máximo 5 tentativas por 15 minutos
   * - Senhas comparadas com bcrypt (hash seguro)
   * - Último acesso atualizado
   * 
   * Erros:
   * - 401 Unauthorized: Credenciais inválidas ou muitas tentativas
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Retorna 200 ao invés do padrão 201 para POST
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    const result = await this.authService.login(dto, req.ip);
    // Token JWT vai para cookie httpOnly (invisível para JS/XSS).
    res.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  /**
   * Endpoint de solicitação de recuperação de senha.
   * 
   * POST /api/auth/forgot-password
   * 
   * Recebe:
   * - email: Email do usuário
   * 
   * Comportamento:
   * 1. Verifica se o email existe no sistema
   * 2. Gera um código de 6 dígitos
   * 3. Envia o código por email
   * 4. Código expira em 30 minutos
   * 5. Cooldown de 5 minutos entre solicitações
   * 
   * Retorna sempre a mesma mensagem por segurança:
   * - message: "Recovery code sent to email"
   * 
   * Isso previne enumeração de usuários (descobrir emails cadastrados)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    // O IP é usado para rate limiting (evitar spam de e-mails/CPU).
    return this.authService.forgotPassword(dto, req.ip);
  }

  /**
   * Endpoint de redefinição de senha.
   * 
   * POST /api/auth/reset-password
   * 
   * Recebe:
   * - email: Email do usuário
   * - code: Código de 6 dígitos recebido por email
   * - newPassword: Nova senha com complexidade mínima
   * 
   * Validações:
   * - Código deve ser válido e não expirado
   * - Código deve estar associado ao email
   * - Código não pode ter sido usado anteriormente
   * 
   * Retorna:
   * - message: "Password reset successfully"
   * 
   * Erros:
   * - 400 Bad Request: Código inválido ou expirado
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * Endpoint de logout.
   *
   * POST /api/auth/logout
   *
   * Requer autenticação: SIM (JWT)
   *
   * Invalida o token atual (e todos os anteriores) incrementando a
   * tokenVersion do usuário. O frontend também limpa o armazenamento local.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(req.user.id);
    // Apaga o cookie de sessão no navegador.
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return result;
  }
}
