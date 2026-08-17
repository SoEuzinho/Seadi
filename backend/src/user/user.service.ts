/**
 * ========================================================================
 * SERVIÇO DE USUÁRIO - Lógica de Negócio
 * ========================================================================
 * 
 * Este serviço contém toda a lógica de negócio para gerenciamento
 * de perfil de usuários da plataforma SEADI.
 * 
 * Funcionalidades:
 * 
 * 1. VISUALIZAR PERFIL
 *    - Retorna dados completos do usuário
 *    - Inclui progresso em todos os módulos
 *    - Exclui dados sensíveis (senha)
 * 
 * 2. ATUALIZAR PERFIL
 *    - Atualiza nome, telefone e/ou data de nascimento
 *    - Valida existência do usuário
 *    - Registra atividade de alteração
 * 
 * 3. ALTERAR SENHA
 *    - Verifica senha atual antes de alterar
 *    - Criptografa nova senha com bcrypt
 *    - Registra atividade de alteração
 * 
 * 4. VISUALIZAR PROGRESSO
 *    - Retorna progresso em todos os módulos
 *    - Inclui status de cada aula (concluída, assistida)
 *    - Calcula porcentagem de conclusão
 * 
 * Segurança:
 * - Senhas nunca são retornadas nas respostas
 * - Validação de senha atual antes de alterar
 * - Logs de atividades para auditoria
 * ========================================================================
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../progress/activity.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Serviço de gerenciamento de perfil do usuário.
 * 
 * Este serviço é responsável por todas as operações CRUD
 * relacionadas ao perfil do usuário, excluindo autenticação
 * (que fica no AuthService).
 */
@Injectable()
export class UserService {
  /**
   * Injeção de dependências.
   * 
   * @param prisma - Serviço de acesso ao banco de dados
   * @param activity - Serviço de registro de atividades
   */
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  /**
   * Retorna o perfil completo do usuário.
   * 
   * Fluxo:
   * 1. Busca o usuário pelo ID
   * 2. Inclui progresso em todos os módulos
   * 3. Retorna dados (nunca senha)
   * 
   * @param userId - ID do usuário autenticado
   * @returns Objeto com dados do usuário e progresso
   * 
   * @throws NotFoundException - Se o usuário não for encontrado
   * 
   * Estrutura retornada:
   * {
   *   id: 1,
   *   nome: "João Silva",
   *   email: "joao@email.com",
   *   telefone: "(11) 99999-9999",
   *   dataNascimento: "1990-01-15T00:00:00.000Z",
   *   fotoUrl: "/uploads/avatars/foto.jpg",
   *   criadoEm: "2024-01-15T10:30:00.000Z",
   *   progressoModulos: [
   *     { moduloId: 1, progresso: 75, concluido: false, modulo: { titulo: "Módulo 1", ordem: 1 } }
   *   ]
   * }
   */
  async getProfile(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        dataNascimento: true,
        fotoUrl: true,
        criadoEm: true,
        progressoModulos: {
          select: {
            moduloId: true,
            progresso: true,
            concluido: true,
            modulo: { select: { titulo: true, ordem: true } },
          },
          orderBy: { moduloId: 'asc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Atualiza os dados cadastrais do usuário.
   * 
   * Fluxo:
   * 1. Verifica se o usuário existe
   * 2. Constrói objeto com apenas os campos fornecidos
   * 3. Atualiza no banco de dados
   * 4. Registra atividade de alteração
   * 5. Retorna dados atualizados
   * 
   * @param userId - ID do usuário autenticado
   * @param dto - Dados para atualização (todos opcionais)
   * @returns Objeto com dados atualizados do usuário
   * 
   * @throws NotFoundException - Se o usuário não for encontrado
   * 
   * Campos atualizáveis:
   * - name: Nome completo
   * - phone: Telefone
   * - birthDate: Data de nascimento
   * 
   * Nota: O email não pode ser alterado por este método.
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Constrói objeto com apenas os campos fornecidos
    // Isso permite atualizações parciais (PATCH-like behavior)
    const data: any = {};
    if (dto.name !== undefined) data.nome = dto.name.trim();
    if (dto.phone !== undefined) data.telefone = dto.phone.trim();
    if (dto.birthDate !== undefined) data.dataNascimento = new Date(dto.birthDate);

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data,
      select: { id: true, nome: true, email: true, telefone: true, dataNascimento: true, fotoUrl: true },
    });

    // Registra a atividade para auditoria
    await this.activity.log(userId, 'perfil_alterado', 'Alterou os dados cadastrais');

    return updated;
  }

  /**
   * Altera a senha do usuário.
   * 
   * Fluxo:
   * 1. Verifica se o usuário existe
   * 2. Compara senha atual com bcrypt
   * 3. Se incorreta, lança exceção
   * 4. Criptografa nova senha
   * 5. Atualiza no banco
   * 6. Registra atividade
   * 7. Retorna mensagem de sucesso
   * 
   * @param userId - ID do usuário autenticado
   * @param dto - Dados da alteração (currentPassword, newPassword)
   * @returns Mensagem de sucesso
   * 
   * @throws NotFoundException - Se o usuário não for encontrado
   * @throws BadRequestException - Se a senha atual estiver incorreta
   * 
   * Segurança:
   * - Senha atual é verificada com bcrypt.compare
   * - Nova senha é criptografada com bcrypt.hash
   * - Senhas nunca são armazenadas em texto plano
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Verifica se a senha atual está correta
    const valid = await bcrypt.compare(dto.currentPassword, user.senha);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    // Criptografa e salva a nova senha
    // A tokenVersion é incrementada para invalidar tokens de outras sessões
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { senha: hashedPassword, tokenVersion: { increment: 1 } },
    });

    // Registra a atividade para auditoria
    await this.activity.log(userId, 'senha_alterada', 'Alterou a senha');

    return { message: 'Password updated successfully' };
  }

  /**
   * Retorna o progresso geral do usuário em todos os módulos.
   * 
   * Este método busca:
   * 1. Todos os módulos do curso (ordenados)
   * 2. Aulas de cada módulo
   * 3. Progresso do usuário em cada módulo
   * 4. Progresso do usuário em cada aula
   * 
   * @param userId - ID do usuário autenticado
   * @returns Array com progresso por módulo
   * 
   * Estrutura retornada:
   * [
   *   {
   *     moduleId: 1,
   *     title: "Módulo 1: Introdução",
   *     order: 1,
   *     progress: 75,
   *     completed: false,
   *     lessons: [
   *       { id: 1, order: 1, title: "Aula 1", videoWatched: true, completed: true },
   *       { id: 2, order: 2, title: "Aula 2", videoWatched: false, completed: false }
   *     ]
   *   }
   * ]
   */
  async getProgress(userId: number) {
    // Busca todos os módulos com suas aulas
    const modules = await this.prisma.modulo.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        aulas: {
          orderBy: { ordem: 'asc' },
          select: { id: true, ordem: true, titulo: true },
        },
        progresso: {
          where: { usuarioId: userId },
          select: { progresso: true, concluido: true },
        },
      },
    });

    // Busca progresso individual em cada aula
    const lessonProgress = await this.prisma.progressoAula.findMany({
      where: { usuarioId: userId },
      select: { aulaId: true, videoAssistido: true, concluido: true },
    });

    // Cria um mapa para acesso rápido ao progresso de cada aula
    const lessonMap = new Map(lessonProgress.map((lp) => [lp.aulaId, lp]));

    // Monta a resposta com progresso por módulo e aula
    return modules.map((m) => {
      const modProg = m.progresso[0];
      return {
        moduleId: m.id,
        title: m.titulo,
        order: m.ordem,
        progress: modProg?.progresso ?? 0,
        completed: modProg?.concluido ?? false,
        lessons: m.aulas.map((l) => ({
          id: l.id,
          order: l.ordem,
          title: l.titulo,
          videoWatched: lessonMap.get(l.id)?.videoAssistido ?? false,
          completed: lessonMap.get(l.id)?.concluido ?? false,
        })),
      };
    });
  }
}
