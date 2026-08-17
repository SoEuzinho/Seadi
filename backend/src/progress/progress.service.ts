/**
 * ========================================================================
 * SERVIÇO DE PROGRESSO - Lógica de Acompanhamento de Aprendizado
 * ========================================================================
 * 
 * Este é o ARQUIVO MAIS COMPLEXO do sistema de progresso.
 * Ele contém toda a lógica de negócio para acompanhar o progresso
 * dos usuários nas aulas e módulos do curso SEADI.
 * 
 * FUNCIONALIDADES PRINCIPAIS:
 * 
 * 1. ESTATÍSTICAS (getStatistics)
 *    - Calcula progresso geral (porcentagem de aulas concluídas)
 *    - Calcula streak (dias consecutivos de estudo)
 *    - Calcula tempo total assistido
 *    - Retorna último acesso
 * 
 * 2. DESBLOQUEIO SEQUENCIAL (getUnlockedUntil)
 *    - Módulos são desbloqueados em ordem
 *    - Módulo só desbloqueia quando o anterior é 100% concluído
 *    - Retorna a ordem máxima desbloqueada
 * 
 * 3. PROGRESSO DE VÍDEO (updateVideoProgress)
 *    - Registra porcentagem assistida do vídeo
 *    - Registra tempo assistido (em segundos)
 *    - Auto-completa aula quando vídeo chega a 100%
 * 
 * 4. CONCLUSÃO DE AULA (completeLesson)
 *    - Marca aula como concluída
 *    - Registra data/hora de conclusão
 *    - Recalcula progresso do módulo pai
 *    - Se módulo atingir 100%, marca como concluído
 * 
 * 5. MÓDULOS DISPONÍVEIS (getAvailableModules)
 *    - Retorna todos os módulos com status de desbloqueio
 *    - Retorna aulas com status de bloqueio
 *    - Aplica regra de desbloqueio sequencial
 * 
 * 6. RESET DE PROGRESSO (resetProgress)
 *    - Remove todo o progresso do usuário
 *    - Operação irreversível
 * 
 * ALGORITMO DE STREAK:
 * O streak conta dias consecutivos em que o usuário concluiu
 * pelo menos uma aula. O algoritmo:
 * 1. Busca todas as datas de conclusão de aulas
 * 2. Converte para timestamps (ignorando hora)
 * 3. Conta consecutivos a partir de hoje para trás
 * 4. Para no primeiro dia sem conclusão
 * 
 * ALGORITMO DE DESBLOQUEIO:
 * 1. Módulo 1 sempre está desbloqueado
 * 2. Módulo N só desbloqueia quando módulo N-1 está 100% concluído
 * 3. Dentro de um módulo, aula N só desbloqueia quando aula N-1 está concluída
 * 4. A primeira aula de cada módulo desbloqueia quando o módulo está desbloqueado
 * ========================================================================
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';

/**
 * Serviço de progresso do sistema SEADI.
 * 
 * Este serviço é o coração do sistema de gamificação e acompanhamento.
 * Ele gerencia:
 * - Progresso individual em cada aula
 * - Progresso geral em cada módulo
 * - Estatísticas de aprendizado
 * - Regras de desbloqueio de conteúdo
 * - Registro de atividades
 */
@Injectable()
export class ProgressService {
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
   * Calcula estatísticas gerais de progresso do usuário.
   * 
   * Este método agrega dados de múltiplas tabelas para criar
   * um panorama completo do progresso do usuário.
   * 
   * @param userId - ID do usuário autenticado
   * @returns Objeto com estatísticas detalhadas
   * 
   * Estrutura retornada:
   * {
   *   progressoGeral: 45,           // Porcentagem de aulas concluídas
   *   aulasConcluidas: 9,           // Número de aulas concluídas
   *   totalAulas: 20,               // Total de aulas disponíveis
   *   diasSeguidos: 5,              // Streak atual
   *   melhorSequencia: 7,           // Maior streak já alcançado
   *   tempoTotalAssistido: 3600,    // Tempo total em segundos
   *   ultimoAcesso: "2024-01-15..."  // Data/hora do último acesso
   * }
   */
  async getStatistics(userId: number) {
    // Conta total de aulas disponíveis no curso
    const totalAulas = await this.prisma.aula.count();
    
    // Conta aulas concluídas pelo usuário
    const concluidas = await this.prisma.progressoAula.count({
      where: { usuarioId: userId, concluido: true },
    });

    // Calcula progresso geral (porcentagem)
    const progressoGeral = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

    // Agrega tempo total assistido (soma de todos os progressos)
    const tempoAgg = await this.prisma.progressoAula.aggregate({
      where: { usuarioId: userId },
      _sum: { tempoAssistido: true },
    });
    const tempoTotalAssistido = tempoAgg._sum.tempoAssistido ?? 0;

    // Busca último acesso do usuário
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { ultimoAcesso: true },
    });

    // Calcula streak (dias consecutivos de estudo)
    // O streak é calculado verificando se o usuário concluiu
    // pelo menos uma aula em cada dia, contando de hoje para trás
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas datas

    // Busca todas as datas de conclusão de aulas
    const completions = await this.prisma.progressoAula.findMany({
      where: { usuarioId: userId, concluido: true, concluidoEm: { not: null } },
      select: { concluidoEm: true },
    });

    // Converte datas para timestamps (sem hora) e coloca em um Set
    // Isso permite verificação O(1) de se uma data existe
    const completedDates = new Set(
      completions
        .filter((c) => c.concluidoEm)
        .map((c) => {
          const d = new Date(c.concluidoEm!);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
    );

    // Calcula streak contando dias consecutivos a partir de hoje
    let streak = 0;
    const check = new Date(hoje);

    // Verifica até 365 dias para trás (1 ano)
    for (let i = 0; i < 365; i++) {
      if (completedDates.has(check.getTime())) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break; // Para no primeiro dia sem conclusão
      }
    }

    // Calcula a MELHOR sequência histórica (maior sequência de dias consecutivos
    // com pelo menos uma aula concluída), percorrendo as datas ordenadas.
    const sortedDates = [...completedDates]
      .map((ts) => new Date(ts))
      .sort((a, b) => a.getTime() - b.getTime());

    let melhorSequencia = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const d of sortedDates) {
      if (prev) {
        const esperado = new Date(prev);
        esperado.setDate(esperado.getDate() + 1);
        run = d.getTime() === esperado.getTime() ? run + 1 : 1;
      } else {
        run = 1;
      }
      prev = d;
      if (run > melhorSequencia) melhorSequencia = run;
    }

    return {
      progressoGeral,
      aulasConcluidas: concluidas,
      totalAulas,
      diasSeguidos: streak,
      melhorSequencia,
      tempoTotalAssistido,
      ultimoAcesso: user?.ultimoAcesso ?? null,
    };
  }

  /**
   * Calcula qual módulo está desbloqueado para o usuário.
   * 
   * ALGORITMO DE DESBLOQUEIO SEQUENCIAL:
   * - Módulo 1 sempre está desbloqueado
   * - Módulo N só desbloqueia quando módulo N-1 está 100% concluído
   * - Retorna a ORDEM do último módulo desbloqueado
   * 
   * Exemplo:
   * - 3 módulos: ordem 1, 2, 3
   * - Usuário concluiu módulo 1 → desbloqueado até ordem 2
   * - Usuário concluiu módulo 2 → desbloqueado até ordem 3
   * - Nenhum concluído → desbloqueado até ordem 1
   * 
   * @param userId - ID do usuário
   * @returns Ordem do último módulo desbloqueado
   */
  async getUnlockedUntil(userId: number): Promise<number> {
    // Busca todos os módulos ordenados por ordem
    const allModules = await this.prisma.modulo.findMany({
      orderBy: { ordem: 'asc' },
      select: { id: true, ordem: true },
    });

    // Se não houver módulos, retorna 0
    if (allModules.length === 0) return 0;

    // Busca TODO o progresso de módulos do usuário em uma única consulta
    // (evita N consultas dentro do loop abaixo).
    const userProgress = await this.prisma.progressoModulo.findMany({
      where: { usuarioId: userId },
      select: { moduloId: true, concluido: true },
    });
    const progressMap = new Map(userProgress.map((p) => [p.moduloId, p.concluido]));

    // Começa assumindo que o primeiro módulo está desbloqueado
    let unlockedOrdem = allModules[0].ordem;

    // Percorre os módulos em ordem
    for (let i = 0; i < allModules.length; i++) {
      // Se não é o primeiro módulo, verifica se o anterior está concluído
      if (i > 0) {
        const prevConcluido = progressMap.get(allModules[i - 1].id) ?? false;
        if (!prevConcluido) break;
      }

      // Módulo atual está desbloqueado
      unlockedOrdem = allModules[i].ordem;
    }

    return unlockedOrdem;
  }

  /**
   * Aplica a regra de desbloqueio SEQUENCIAL no servidor:
   * - o módulo da aula deve estar desbloqueado (ordem <= desbloqueada);
   * - a aula anterior do mesmo módulo deve estar concluída.
   *
   * Sem essa checagem, chamadas diretas à API permitiriam pular o curso
   * inteiro marcando qualquer aula como concluída.
   *
   * @throws ForbiddenException - Se o módulo estiver bloqueado ou a aula
   *                              anterior ainda não foi concluída.
   */
  private async ensureLessonUnlocked(
    userId: number,
    aula: { id: number; modulo: { id: number; ordem: number } },
  ) {
    const unlockedOrdem = await this.getUnlockedUntil(userId);

    if (aula.modulo.ordem > unlockedOrdem) {
      throw new ForbiddenException('Módulo ainda bloqueado');
    }

    // Busca as aulas do módulo em ordem para achar a anterior
    const aulas = await this.prisma.aula.findMany({
      where: { moduloId: aula.modulo.id },
      orderBy: { ordem: 'asc' },
      select: { id: true },
    });
    const idx = aulas.findIndex((a) => a.id === aula.id);

    if (idx > 0) {
      const prevProgress = await this.prisma.progressoAula.findUnique({
        where: {
          usuarioId_aulaId: { usuarioId: userId, aulaId: aulas[idx - 1].id },
        },
        select: { concluido: true },
      });
      if (!prevProgress?.concluido) {
        throw new ForbiddenException('Conclua a aula anterior primeiro');
      }
    }
  }

  /**
   * Atualiza o progresso de visualização de um vídeo.
   * 
   * Este método é chamado periodicamente durante a reprodução
   * do vídeo para registrar o progresso do usuário.
   * 
   * FLUXO:
   * 1. Valida se a aula existe
   * 2. Normaliza progresso (0-100)
   * 3. Busca progresso existente
   * 4. Atualiza tempo assistido (apenas se for maior que o anterior)
   * 5. Cria ou atualiza registro (upsert)
   * 6. Se progresso >= 100, completa aula automaticamente
   * 
   * @param userId - ID do usuário
   * @param aulaId - ID da aula
   * @param progresso - Porcentagem assistida (0-100)
   * @param currentTime - Tempo atual em segundos (opcional)
   * @returns Registro de progresso atualizado
   * 
   * @throws NotFoundException - Se a aula não for encontrada
   */
  async updateVideoProgress(userId: number, aulaId: number, progresso: number, currentTime?: number) {
    // Verifica se a aula existe (com o módulo pai para a regra de desbloqueio)
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: { modulo: true },
    });
    if (!aula) throw new NotFoundException('Aula not found');

    // Rejeita progresso em aulas que o usuário ainda não desbloqueou
    await this.ensureLessonUnlocked(userId, aula);

    // Normaliza progresso para ficar entre 0 e 100
    progresso = Math.min(100, Math.max(0, progresso));

    // Prepara dados para atualização
    const data: any = { progressoVideo: progresso };

    // Atualiza tempo assistido apenas se o novo tempo for maior
    // Isso evita que tempo retroceda se o usuário voltar o vídeo
    if (currentTime !== undefined) {
      const existing = await this.prisma.progressoAula.findUnique({
        where: { usuarioId_aulaId: { usuarioId: userId, aulaId } },
      });
      const currentMax = existing?.tempoAssistido ?? 0;
      if (currentTime > currentMax) {
        data.tempoAssistido = Math.round(currentTime);
      }
    }

    // Upsert: cria ou atualiza registro de progresso.
    // assistidoEm (primeiro acesso) é definido apenas na criação — não deve ser
    // sobrescrito a cada heartbeat do vídeo.
    const updated = await this.prisma.progressoAula.upsert({
      where: { usuarioId_aulaId: { usuarioId: userId, aulaId } },
      update: data,
      create: { usuarioId: userId, aulaId, ...data, assistidoEm: new Date() },
    });

    // Auto-completa aula se progresso chegar a 100%
    if (progresso >= 100 && !updated.concluido) {
      await this.completeLesson(userId, aulaId);
    }

    return updated;
  }

  /**
   * Marca uma aula como concluída.
   * 
   * Este método é chamado quando:
   * - O progresso do vídeo chega a 100%
   * - O usuário clica "Marcar como concluída"
   * 
   * FLUXO:
   * 1. Valida se a aula existe
   * 2. Marca todos os flags de conclusão
   * 3. Registra data/hora de conclusão
   * 4. Registra atividade
   * 5. Recalcula progresso do módulo pai
   * 
   * @param userId - ID do usuário
   * @param aulaId - ID da aula
   * 
   * @throws NotFoundException - Se a aula não for encontrada
   */
  async completeLesson(userId: number, aulaId: number) {
    // Busca a aula com informações do módulo pai
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: { modulo: true },
    });
    if (!aula) throw new NotFoundException('Aula not found');

    // Rejeita conclusão de aulas que o usuário ainda não desbloqueou
    await this.ensureLessonUnlocked(userId, aula);

    // Marca aula como concluída (upsert)
    await this.prisma.progressoAula.upsert({
      where: { usuarioId_aulaId: { usuarioId: userId, aulaId } },
      update: {
        videoAssistido: true,
        concluido: true,
        assistidoEm: new Date(),
        concluidoEm: new Date(),
        progressoVideo: 100,
      },
      create: {
        usuarioId: userId,
        aulaId,
        videoAssistido: true,
        concluido: true,
        assistidoEm: new Date(),
        concluidoEm: new Date(),
        progressoVideo: 100,
      },
    });

    // Registra atividade de conclusão
    await this.activity.log(userId, 'aula_concluida', `Concluiu a aula "${aula.titulo}"`);
    
    // Recalcula progresso do módulo pai
    await this.recalculateModule(userId, aula.moduloId);
  }

  /**
   * Recalcula o progresso de um módulo.
   * 
   * Este método é chamado sempre que uma aula é concluída
   * para atualizar a porcentagem de progresso do módulo.
   * 
   * FLUXO:
   * 1. Conta total de aulas no módulo
   * 2. Conta aulas concluídas pelo usuário
   * 3. Calcula porcentagem (concluidas / total * 100)
   * 4. Se 100%, marca módulo como concluído
   * 5. Registra atividade se módulo foi concluído
   * 
   * @param userId - ID do usuário
   * @param moduloId - ID do módulo
   */
  private async recalculateModule(userId: number, moduloId: number) {
    // Conta total de aulas no módulo
    const totalAulas = await this.prisma.aula.count({ where: { moduloId } });
    if (totalAulas === 0) return;

    // Conta aulas concluídas pelo usuário neste módulo
    const concluidas = await this.prisma.progressoAula.count({
      where: { usuarioId: userId, aula: { moduloId }, concluido: true },
    });

    // Calcula porcentagem de progresso
    const percentage = Math.round((concluidas / totalAulas) * 100);
    const completed = percentage >= 100;

    // Verifica se o módulo já estava concluído
    const existing = await this.prisma.progressoModulo.findUnique({
      where: { usuarioId_moduloId: { usuarioId: userId, moduloId } },
    });

    const wasNotCompleted = !existing?.concluido;

    // Atualiza ou cria registro de progresso do módulo.
    // concluidoEm só é definido na transição para concluído — não é
    // sobrescrito a cada aula concluída depois de 100%.
    await this.prisma.progressoModulo.upsert({
      where: { usuarioId_moduloId: { usuarioId: userId, moduloId } },
      update: {
        progresso: percentage,
        concluido: completed,
        concluidoEm: completed && wasNotCompleted ? new Date() : undefined,
      },
      create: {
        usuarioId: userId,
        moduloId,
        progresso: percentage,
        concluido: completed,
        concluidoEm: completed ? new Date() : undefined,
      },
    });

    // Se módulo foi concluído agora (e não estava antes), registra atividade
    if (completed && wasNotCompleted) {
      const modulo = await this.prisma.modulo.findUnique({ where: { id: moduloId } });
      await this.activity.log(
        userId,
        'modulo_concluido',
        `Completou o módulo "${modulo?.titulo}"`,
      );
    }
  }

  /**
   * Retorna as atividades recentes do usuário.
   * 
   * @param userId - ID do usuário
   * @param limit - Número máximo de atividades (padrão: 20)
   * @returns Array de atividades ordenadas por data
   */
  async getActivities(userId: number) {
    return this.activity.list(userId, 20);
  }

  /**
   * Retorna o status de progresso do usuário.
   * 
   * Este método retorna informações sobre quais aulas
   * foram concluídas e quais estão em andamento.
   * 
   * @param userId - ID do usuário
   * @returns Objeto com arrays de IDs
   * 
   * Estrutura retornada:
   * {
   *   concluidas: [1, 3, 5],        // IDs das aulas concluídas
   *   emAndamento: { 2: 45, 4: 80 } // IDs e porcentagem das aulas em andamento
   * }
   */
  async getProgressStatus(userId: number) {
    // Busca todos os registros de progresso do usuário
    const all = await this.prisma.progressoAula.findMany({
      where: { usuarioId: userId },
      select: { aulaId: true, concluido: true, progressoVideo: true },
    });

    // Separa aulas concluídas das em andamento
    var concluidas: number[] = [];
    var emAndamento: Record<number, number> = {};

    for (const p of all) {
      if (p.concluido) {
        concluidas.push(p.aulaId);
      } else if (p.progressoVideo > 0) {
        // Aula tem progresso mas não está concluída
        emAndamento[p.aulaId] = p.progressoVideo;
      }
    }

    return { concluidas, emAndamento };
  }

  /**
   * Reseta todo o progresso do usuário.
   * 
   * ATENÇÃO: Esta operação é IRREVERSÍVEL!
   * 
   * Remove:
   * - Todos os registros de progresso de aulas
   * - Todos os registros de progresso de módulos
   * - Todas as atividades registradas
   * 
   * Registra:
   * - Atividade de reset (para auditoria)
   * 
   * @param userId - ID do usuário
   * @returns Mensagem de sucesso
   */
  async resetProgress(userId: number) {
    // Remove progresso de todas as aulas
    await this.prisma.progressoAula.deleteMany({ where: { usuarioId: userId } });
    
    // Remove progresso de todos os módulos
    await this.prisma.progressoModulo.deleteMany({ where: { usuarioId: userId } });
    
    // Remove todas as atividades registradas
    await this.prisma.atividade.deleteMany({ where: { usuarioId: userId } });
    
    // Registra atividade de reset (para auditoria)
    await this.activity.log(userId, 'progresso_resetado', 'Resetou todo o progresso');
    
    return { message: 'Progress reset successfully' };
  }

  /**
   * Retorna módulos disponíveis com status de desbloqueio.
   * 
   * Este método retorna todos os módulos do curso com informações
   * detalhadas sobre progresso e desbloqueio.
   * 
   * REGRAS DE DESBLOQUEIO:
   * - Módulos: Seguem regra sequencial (módulo N requer módulo N-1 concluído)
   * - Aulas: Seguem regra sequencial (aula N requer aula N-1 concluída)
   * - Primeira aula de cada módulo: Desbloqueia quando o módulo está desbloqueado
   * 
   * @param userId - ID do usuário
   * @returns Array de módulos com detalhes de progresso e desbloqueio
   */
  async getAvailableModules(userId: number) {
    // Obtém a ordem máxima desbloqueada para o usuário
    const unlockedOrdem = await this.getUnlockedUntil(userId);

    // Busca todos os módulos com aulas e progresso
    const modules = await this.prisma.modulo.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        aulas: {
          orderBy: { ordem: 'asc' },
          select: { id: true, ordem: true, titulo: true, videoUrl: true, duracao: true },
        },
        progresso: { where: { usuarioId: userId } },
      },
    });

    // Busca progresso individual de todas as aulas do usuário
    const userLessonProgress = await this.prisma.progressoAula.findMany({
      where: { usuarioId: userId },
    });
    const lessonMap = new Map(userLessonProgress.map((p) => [p.aulaId, p]));

    // Monta resposta com status de desbloqueio
    return modules.map((m) => {
      const prog = m.progresso[0];
      const totalAulas = m.aulas.length;

      // Processa cada aula do módulo
      const aulas = m.aulas.map((a, idx) => {
        const lp = lessonMap.get(a.id);
        const concluido = lp?.concluido ?? false;
        
        // Verifica se a aula anterior está concluída
        const isPrevConcluido = idx === 0 || (lessonMap.get(m.aulas[idx - 1].id)?.concluido ?? false);
        
        // Aula está bloqueada se:
        // - Módulo está bloqueado (ordem > desbloqueada)
        // - Não é a primeira aula e a anterior não está concluída
        const lessonBloqueada = m.ordem > unlockedOrdem || (idx > 0 && !isPrevConcluido);

        return {
          id: a.id,
          ordem: a.ordem,
          titulo: a.titulo,
          videoUrl: a.videoUrl,
          duracao: a.duracao,
          concluido,
          progressoVideo: lp?.progressoVideo ?? 0,
          bloqueada: lessonBloqueada,
        };
      });

      // Conta aulas concluídas no módulo
      const aulasConcluidas = aulas.filter((a) => a.concluido).length;

      return {
        id: m.id,
        ordem: m.ordem,
        titulo: m.titulo,
        descricao: m.descricao,
        icone: m.icone,
        totalAulas,
        aulasConcluidas,
        progresso: prog?.progresso ?? 0,
        concluido: prog?.concluido ?? false,
        bloqueado: m.ordem > unlockedOrdem,
        aulas,
      };
    });
  }
}
