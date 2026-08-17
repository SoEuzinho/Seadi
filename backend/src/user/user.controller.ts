/**
 * ========================================================================
 * CONTROLADOR DE USUÁRIO - Endpoints de Perfil
 * ========================================================================
 * 
 * Este controlador expõe os endpoints REST para gerenciamento de perfil.
 * TODOS os endpoints requerem autenticação JWT.
 * 
 * Endpoints disponíveis:
 * - GET /api/auth/profile - Visualizar perfil completo
 * - PUT /api/auth/profile - Atualizar dados cadastrais
 * - PUT /api/auth/password - Alterar senha
 * - GET /api/progress - Visualizar progresso geral
 * 
 * Nota: Alguns endpoints estão sob '/auth' por compatibilidade
 * com o frontend existente.
 * 
 * Segurança:
 * - Autenticação JWT obrigatória (@UseGuards(JwtAuthGuard))
 * - Cada usuário só pode acessar/modificar seus próprios dados
 * - O ID do usuário é extraído do token JWT (req.user.id)
 * ========================================================================
 */

import {
  Controller, Get, Put, Body, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Controlador de usuário.
 * 
 * Todos os endpoints deste controlador requerem autenticação.
 * O @UseGuards(JwtAuthGuard) garante que apenas usuários
 * autenticados possam acessar as rotas.
 */
@Controller()
export class UserController {
  /**
   * Injeção de dependência do UserService.
   */
  constructor(private userService: UserService) {}

  /**
   * Endpoint para visualizar o perfil do usuário.
   * 
   * GET /api/auth/profile
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - Dados básicos do usuário (id, nome, email, telefone, etc.)
   * - Progresso em todos os módulos
   * - Foto de perfil (URL)
   * 
   * Este endpoint é usado pelo frontend para exibir
   * as informações do perfil na página de perfil.
   */
  @UseGuards(JwtAuthGuard)
  @Get('auth/profile')
  getProfile(@Req() req: any) {
    // req.user é populado pelo JwtStrategy com os dados do usuário
    return this.userService.getProfile(req.user.id);
  }

  /**
   * Endpoint para atualizar os dados cadastrais.
   * 
   * PUT /api/auth/profile
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Campos permitidos para atualização:
   * - name: Nome completo
   * - phone: Telefone
   * - birthDate: Data de nascimento
   * 
   * Retorna:
   * - Dados atualizados do usuário
   * 
   * Nota: O email NÃO pode ser alterado por este endpoint.
   * Alterações são registradas no log de atividades.
   */
  @UseGuards(JwtAuthGuard)
  @Put('auth/profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  /**
   * Endpoint para alterar a senha.
   * 
   * PUT /api/auth/password
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Dados necessários:
   * - currentPassword: Senha atual (para verificação)
   * - newPassword: Nova senha (com complexidade mínima)
   * 
   * Retorna:
   * - message: "Password updated successfully"
   * 
   * Segurança:
   * - Verifica se a senha atual está correta
   * - Nova senha é criptografada com bcrypt
   * - Alteração é registrada no log de atividades
   */
  @UseGuards(JwtAuthGuard)
  @Put('auth/password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.id, dto);
  }

  /**
   * Endpoint para visualizar o progresso geral.
   * 
   * GET /api/progress
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Retorna:
   * - Lista de todos os módulos do curso
   * - Progresso em cada módulo (porcentagem, concluído)
   * - Status de cada aula (assistida, concluída)
   * 
   * Este endpoint é usado pelo frontend para exibir
   * a página de progresso/estatísticas.
   */
  @UseGuards(JwtAuthGuard)
  @Get('progress')
  getProgress(@Req() req: any) {
    return this.userService.getProgress(req.user.id);
  }
}
