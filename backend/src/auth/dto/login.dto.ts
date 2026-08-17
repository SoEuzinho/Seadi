/**
 * ========================================================================
 * DTO DE LOGIN - Validação de Dados de Entrada
 * ========================================================================
 * 
 * Este DTO define a estrutura e validação dos dados recebidos
 * no endpoint de login.
 * 
 * É o DTO mais simples do sistema, pois login requer apenas
 * email e senha para autenticação.
 * 
 * Exemplo de requisição:
 * POST /api/auth/login
 * {
 *   "email": "joao@email.com",
 *   "password": "Senha@123"
 * }
 * 
 * Resposta bem-sucedida:
 * {
 *   "user": { "id": 1, "nome": "João Silva", "email": "joao@email.com" },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 * ========================================================================
 */

import { IsEmail, IsString } from 'class-validator';

/**
 * DTO para login de usuário.
 * 
 * Campos validados:
 * - email: Email válido do usuário
 * - password: Senha (string, sem validação de complexidade)
 * 
 * Nota: A validação de complexidade da senha NÃO é feita aqui,
 * pois o usuário pode estar digitando uma senha antiga.
 * A complexidade só é exigida no registro e redefinição.
 */
export class LoginDto {
  /**
   * Email do usuário.
   * 
   * Validações:
   * - @IsEmail: Deve ser um email válido
   * 
   * O email é normalizado no service (minúsculas, sem espaços)
   * antes de buscar no banco de dados.
   */
  @IsEmail()
  email: string;

  /**
   * Senha do usuário.
   * 
   * Validações:
   * - @IsString: Deve ser uma string
   * 
   * Não há validação de formato ou complexidade.
   * A senha é comparada com o hash armazenado usando bcrypt.
   * 
   * Se a senha estiver incorreta, o service lança UnauthorizedException.
   */
  @IsString()
  password: string;
}
