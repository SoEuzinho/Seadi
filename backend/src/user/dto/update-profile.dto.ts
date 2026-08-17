/**
 * ========================================================================
 * DTO DE ATUALIZAÇÃO DE PERFIL - Validação de Dados
 * ========================================================================
 * 
 * Este DTO define a estrutura para atualizar os dados cadastrais
 * do perfil do usuário.
 * 
 * Todos os campos são OPCIONAIS - isso permite atualizações parciais.
 * O usuário pode atualizar apenas o campo que deseja mudar.
 * 
 * Campos disponíveis:
 * - name: Nome completo
 * - phone: Telefone
 * - birthDate: Data de nascimento (formato ISO 8601)
 * 
 * O campo email NÃO pode ser alterado por este DTO.
 * Se necessário, uma funcionalidade separada deve ser criada.
 * 
 * Exemplo de requisição:
 * PUT /api/auth/profile
 * {
 *   "name": "João Silva Santos"
 * }
 * 
 * Ou para atualizar vários campos:
 * {
 *   "name": "João Silva Santos",
 *   "phone": "(11) 88888-8888",
 *   "birthDate": "1990-05-20"
 * }
 * ========================================================================
 */

import { IsOptional, IsString, IsDateString } from 'class-validator';

/**
 * DTO para atualização de perfil.
 * 
 * Todos os campos são opcionais para permitir atualizações parciais.
 * O Service verifica quais campos foram fornecidos e atualiza apenas eles.
 */
export class UpdateProfileDto {
  /**
   * Nome completo do usuário.
   * 
   * Validações:
   * - @IsOptional: Campo não obrigatório
   * - @IsString: Se fornecido, deve ser uma string
   * 
   * O nome é limpo (trim) no Service antes de salvar.
   * 
   * Exemplo: "João Silva Santos"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Telefone do usuário.
   * 
   * Validações:
   * - @IsOptional: Campo não obrigatório
   * - @IsString: Se fornecido, deve ser uma string
   * 
   * Não há validação de formato - aceita qualquer string.
   * O frontend pode formatar como "(11) 99999-9999" ou "11999999999".
   * 
   * O telefone é limpo (trim) no Service antes de salvar.
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Data de nascimento do usuário.
   * 
   * Validações:
   * - @IsOptional: Campo não obrigatório
   * - @IsDateString: Deve ser uma string no formato ISO 8601
   * 
   * Formato esperado: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss.sssZ"
   * Exemplo válido: "1990-01-15"
   * Exemplo inválido: "15/01/1990" (formato brasileiro não é ISO)
   * 
   * No Service, a string é convertida para objeto Date:
   * new Date(dto.birthDate)
   */
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
