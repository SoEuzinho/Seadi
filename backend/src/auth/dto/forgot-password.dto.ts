/**
 * ========================================================================
 * DTO DE RECUPERAÇÃO DE SENHA - Solicitação de Código
 * ========================================================================
 * 
 * Este DTO define a estrutura para solicitar um código de recuperação
 * de senha por email.
 * 
 * É extremamente simples - apenas o email é necessário.
 * O service verifica se o email existe e envia o código.
 * 
 * Segurança:
 * - Retorna sempre a mesma mensagem (previne enumeração de usuários)
 * - Implementa cooldown de 5 minutos entre solicitações
 * - Código expira em 30 minutos
 * 
 * Exemplo de requisição:
 * POST /api/auth/forgot-password
 * {
 *   "email": "joao@email.com"
 * }
 * 
 * Resposta (sempre a mesma):
 * {
 *   "message": "Recovery code sent to email"
 * }
 * ========================================================================
 */

import { IsEmail } from 'class-validator';

/**
 * DTO para solicitação de recuperação de senha.
 * 
 * Este é o DTO mais enxuto do sistema, pois:
 * 1. Só precisa do email para identificar o usuário
 * 2. Não precisa validar mais nada (o service faz as verificações)
 * 3. Mantém a simplicidade e clareza
 */
export class ForgotPasswordDto {
  /**
   * Email do usuário que esqueceu a senha.
   * 
   * Validações:
   * - @IsEmail: Deve ser um email válido
   * 
   * O email é usado para:
   * 1. Verificar se o usuário existe
   * 2. Enviar o código de recuperação
   * 3. Identificar qual código pertence a qual usuário
   */
  @IsEmail()
  email: string;
}
