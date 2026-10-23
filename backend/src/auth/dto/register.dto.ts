/**
 * ========================================================================
 * DTO DE REGISTRO - Validação de Dados de Entrada
 * ========================================================================
 * 
 * Este DTO (Data Transfer Object) define a estrutura e validação dos dados
 * recebidos no endpoint de registro de novos usuários.
 * 
 * O ValidationPipe global usa estas decoradores para:
 * - Validar automaticamente os dados antes de chegar ao controller
 * - Rejeitar requisições com dados inválidos
 * - Retornar erros claros e específicos
 * - Converter tipos de dados quando necessário
 * 
 * Campos validados:
 * - name: Nome completo (mínimo 2 caracteres)
 * - email: Email válido
   * - password: Senha com comprimento mínimo
   * - phone: Telefone (opcional)
   * - birthDate: Data de nascimento (opcional)
   * 
   * Exemplo de requisição:
   * POST /api/auth/register
   * {
   *   "name": "João Silva",
   *   "email": "joao@email.com",
   *   "password": "1234",
   *   "phone": "(11) 99999-9999",
   *   "birthDate": "1990-01-15"
   * }
 * ========================================================================
 */

import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

/**
 * DTO para registro de novo usuário.
 * 
 * Cada propriedade é validada pelos decoradores do class-validator.
 * Se a validação falhar, o ValidationPipe lança uma exceção 400 Bad Request
 * com detalhes sobre os erros de validação.
 */
export class RegisterDto {
  /**
   * Nome completo do usuário.
   * 
   * Validações:
   * - @IsString: Deve ser uma string
   * - @MinLength(2): Mínimo de 2 caracteres
   * 
   * Exemplo válido: "João Silva"
   * Exemplo inválido: "J" (muito curto)
   */
  @IsString()
  @MinLength(2)
  name: string;

  /**
   * Email do usuário.
   * 
   * Validações:
   * - @IsEmail: Deve ser um email válido (formato user@domain.com)
   * 
   * O email é normalizado no service (minúsculas, sem espaços)
   * para garantir unicidade.
   * 
   * Exemplo válido: "joao@email.com"
   * Exemplo inválido: "joao@email" (falta domínio)
   */
  @IsEmail()
  email: string;

  /**
   * Senha do usuário.
   * 
   * Validações:
   * - @IsString: Deve ser uma string
   * - @MinLength(8) + @Matches: mínimo de 8 caracteres, com letras e números
   * 
   * A senha é criptografada com bcrypt no service antes de salvar.
   * 
   * Exemplo válido: "1234"
   * Exemplo inválido: "abc" (muito curto)
   */
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'A senha deve ter letras e números' })
  password: string;

  /**
   * Telefone do usuário (OPCIONAL).
   * 
   * Validações:
   * - @IsOptional: Campo não obrigatório
   * - @IsString: Se fornecido, deve ser uma string
   * 
   * Não há validação de formato - aceita qualquer string.
   * O frontend pode formatar como "(11) 99999-9999" ou "11999999999".
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Data de nascimento do usuário (OPCIONAL).
   * 
   * Validações:
   * - @IsOptional: Campo não obrigatório
   * - @IsString: Se fornecido, deve ser uma string
   * 
   * Formato esperado: "YYYY-MM-DD" (padrão ISO 8601)
   * Exemplo: "1990-01-15"
   * 
   * No service, a string é convertida para Date:
   * new Date(dto.birthDate)
   */
  @IsOptional()
  @IsString()
  birthDate?: string;
}
