/**
 * ========================================================================
 * DTO DE ALTERAÇÃO DE SENHA - Validação de Dados
 * ========================================================================
 * 
 * Este DTO define a estrutura para alterar a senha do usuário.
 * Diferente do ResetPasswordDto, este requer a senha ATUAL.
 * 
 * Campos validados:
 * - currentPassword: Senha atual (para verificação)
 * - newPassword: Nova senha (com complexidade mínima)
 * 
 * Fluxo de validação:
 * 1. Valida formato dos dados (este DTO)
 * 2. Verifica se senha atual está correta (Service)
 * 3. Criptografa nova senha com bcrypt (Service)
 * 4. Atualiza no banco de dados (Service)
 * 
 * Segurança:
 * - Senha atual é verificada com bcrypt.compare
 * - Nova senha é criptografada com bcrypt.hash
 * - Senhas nunca são armazenadas em texto plano
 * 
 * Exemplo de requisição:
 * PUT /api/auth/password
 * {
 *   "currentPassword": "Senha@123",
 *   "newPassword": "NovaSenha@456"
 * }
 * 
 * Resposta bem-sucedida:
 * {
 *   "message": "Password updated successfully"
 * }
 * ========================================================================
 */

import { IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO para alteração de senha.
 * 
 * Este DTO é mais restritivo que o ResetPasswordDto,
 * pois requer a senha atual para verificar identidade.
 */
export class ChangePasswordDto {
  /**
   * Senha atual do usuário.
   * 
   * Validações:
   * - @IsString: Deve ser uma string
   * 
   * Não há validação de complexidade - a senha atual pode ter
   * qualquer formato (foi validada quando foi criada).
   * 
   * Esta senha é comparada com o hash armazenado usando bcrypt.
   * Se estiver incorreta, o Service lança BadRequestException.
   * 
   * Exemplo: "Senha@123"
   */
  @IsString()
  currentPassword: string;

  /**
   * Nova senha do usuário.
   * 
   * Validações:
   * - @IsString: Deve ser uma string
   * - @MinLength(8) + @Matches: mínimo de 8 caracteres, com letras e números
   * 
   * A nova senha deve ser DIFERENTE da atual.
   * Esta validação não está neste DTO, mas pode ser adicionada no Service.
   * 
   * Exemplo válido: "1234"
   * Exemplo inválido: "abc" (muito curto)
   */
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'A senha deve ter letras e números' })
  newPassword: string;
}
