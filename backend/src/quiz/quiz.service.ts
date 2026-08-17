/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Serviço Principal
 * ========================================================================
 * 
 * Este serviço é responsável pelo acesso ao banco de perguntas e pelo
 * registro do histórico de partidas do usuário.
 * 
 * Funcionalidades:
 * - Listar categorias disponíveis (com quantidade de perguntas)
 * - Sortear perguntas para uma partida (sem repetição)
 * - Buscar o nome de exibição de um usuário
 * - Persistir o resultado de uma partida concluída
 * - Listar o histórico de partidas do usuário autenticado
 * 
 * Seleção das perguntas:
 * - Se a categoria for "misto", as perguntas são sorteadas de todas
 *   as categorias juntas.
 * - Caso contrário, apenas da categoria escolhida.
 * - As perguntas são embaralhadas e selecionadas sem repetição.
 * - Nunca retorna a alternativa correta (o servidor guarda separado).
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QUIZ_CATEGORIES,
  getQuizCategoryName,
  QuizQuestion,
} from './quiz.types';

export interface SavedMatchResult {
  usuarioId: number;
  categoria: string;
  posicao: number;
  pontos: number;
  acertos: number;
  erros: number;
  tempoMedioResposta: number;
  percentualAcertos: number;
  totalPerguntas: number;
}

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista as categorias disponíveis com a quantidade de perguntas ativas.
   * A categoria "misto" mostra o total somado de todas as outras.
   */
  async listCategories() {
    const grouped = await this.prisma.questao.groupBy({
      by: ['categoria'],
      where: { ativa: true },
      _count: { _all: true },
    });

    const countMap = new Map<string, number>();
    let total = 0;
    for (const g of grouped) {
      countMap.set(g.categoria, g._count._all);
      total += g._count._all;
    }

    return QUIZ_CATEGORIES.map((c) => ({
      id: c.id,
      nome: c.nome,
      icone: c.icone,
      descricao: c.descricao,
      count: c.id === 'misto' ? total : countMap.get(c.id) ?? 0,
    }));
  }

  /**
   * Busca o nome de exibição e a foto de perfil de um usuário.
   */
  async getUserInfo(userId: number): Promise<{ nome: string; fotoUrl: string | null }> {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { nome: true, fotoUrl: true },
    });
    return { nome: user?.nome || 'Usuário', fotoUrl: user?.fotoUrl || null };
  }

  /**
   * Sorteia as perguntas de uma partida.
   *
   * - Seleção e sorteio 100% no servidor;
   * - Nunca repete a mesma pergunta dentro da partida;
   * - Na categoria "misto", distribui as perguntas entre TODAS as
   *   categorias de forma equilibrada (rodízio entre os pools);
   * - As ALTERNATIVAS são embaralhadas a cada partida (posição da
   *   correta muda), impedindo que a resposta "A" seja sempre certa;
   * - A alternativa correta NUNCA é enviada ao cliente.
   *
   * @param category - Categoria escolhida ("misto" para todas)
   * @param count - Quantidade máxima de perguntas
   * @returns Perguntas embaralhadas, SEM a alternativa correta
   */
  async pickQuestions(
    category: string,
    count: number,
  ): Promise<{ questions: QuizQuestion[]; correctIndexes: number[] }> {
    const all = await this.prisma.questao.findMany({
      where: { ativa: true },
      select: {
        id: true,
        categoria: true,
        enunciado: true,
        alternativaA: true,
        alternativaB: true,
        alternativaC: true,
        correta: true,
      },
    });

    let selected: typeof all = [];

    if (category === 'misto') {
      // Agrupa por categoria e embaralha cada pool individualmente
      const pools = new Map<string, typeof all>();
      for (const q of all) {
        const list = pools.get(q.categoria) || [];
        list.push(q);
        pools.set(q.categoria, list);
      }
      for (const pool of pools.values()) this.shuffleInPlace(pool);

      // Rodízio: pega uma pergunta de cada categoria até preencher o total.
      // Garante mixagem real dos conteúdos, não um sorteio que pode cair
      // todo em uma categoria só.
      const maxLen = Math.max(0, ...[...pools.values()].map((p) => p.length));
      for (let i = 0; i < maxLen && selected.length < count; i++) {
        for (const pool of pools.values()) {
          if (selected.length >= count) break;
          if (i < pool.length) selected.push(pool[i]);
        }
      }

      // Se ainda faltar (nunca deveria com o banco atual), completa com o resto
      if (selected.length < count) {
        for (const pool of pools.values()) {
          for (const q of pool) {
            if (selected.length >= count) break;
            if (!selected.includes(q)) selected.push(q);
          }
        }
      }
    } else {
      const pool = all.filter((q) => q.categoria === category);
      this.shuffleInPlace(pool);
      selected = pool.slice(0, count);
    }

    // Embaralha as alternativas e recalcula o índice correto
    const questions: QuizQuestion[] = [];
    const correctIndexes: number[] = [];

    for (const q of selected) {
      const opts = [q.alternativaA, q.alternativaB, q.alternativaC];
      const order = [0, 1, 2];
      this.shuffleInPlace(order);

      questions.push({
        id: q.id,
        enunciado: q.enunciado,
        alternativas: order.map((i) => opts[i]),
      });
      correctIndexes.push(order.indexOf(q.correta));
    }

    return { questions, correctIndexes };
  }

  /** Embaralha um array in-place (Fisher-Yates). */
  private shuffleInPlace<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Persiste o resultado de um jogador em uma partida concluída.
   */
  async saveResult(data: SavedMatchResult) {
    return this.prisma.partidaQuiz.create({ data });
  }

  /**
   * Lista o histórico de partidas do usuário (mais recentes primeiro).
   */
  async getHistory(userId: number) {
    const matches = await this.prisma.partidaQuiz.findMany({
      where: { usuarioId: userId },
      orderBy: { concluidaEm: 'desc' },
      take: 20,
    });

    return matches.map((m) => ({
      id: m.id,
      categoria: getQuizCategoryName(m.categoria),
      posicao: m.posicao,
      pontos: m.pontos,
      acertos: m.acertos,
      erros: m.erros,
      tempoMedioResposta: m.tempoMedioResposta,
      percentualAcertos: m.percentualAcertos,
      totalPerguntas: m.totalPerguntas,
      concluidaEm: m.concluidaEm,
    }));
  }

  /**
   * Ranking geral do Quiz Multiplayer.
   *
   * Agrega as partidas de todos os jogadores em um leaderboard:
   * vitórias, partidas jogadas, pontos acumulados, melhor posição,
   * melhor aproveitamento e última partida.
   *
   * Ordenação: mais vitórias → mais pontos → melhor posição.
   */
  async getRanking() {
    const [matches, users] = await Promise.all([
      this.prisma.partidaQuiz.findMany({
        select: {
          usuarioId: true,
          posicao: true,
          pontos: true,
          percentualAcertos: true,
          acertos: true,
          totalPerguntas: true,
          concluidaEm: true,
        },
      }),
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const agg = new Map<number, {
      partidas: number;
      vitorias: number;
      pontos: number;
      melhorPosicao: number;
      melhorPercentual: number;
      ultimaPartida: Date;
    }>();

    for (const m of matches) {
      let e = agg.get(m.usuarioId);
      if (!e) {
        e = {
          partidas: 0,
          vitorias: 0,
          pontos: 0,
          melhorPosicao: Number.MAX_SAFE_INTEGER,
          melhorPercentual: 0,
          ultimaPartida: m.concluidaEm,
        };
        agg.set(m.usuarioId, e);
      }
      e.partidas++;
      if (m.posicao === 1) e.vitorias++;
      e.pontos += m.pontos;
      if (m.posicao < e.melhorPosicao) e.melhorPosicao = m.posicao;
      if (m.percentualAcertos > e.melhorPercentual) e.melhorPercentual = m.percentualAcertos;
      if (m.concluidaEm > e.ultimaPartida) e.ultimaPartida = m.concluidaEm;
    }

    const list = [...agg.entries()]
      .map(([usuarioId, a]) => {
        const u = userMap.get(usuarioId);
        return {
          id: usuarioId,
          nome: u?.nome || 'Usuário',
          fotoUrl: u?.fotoUrl || null,
          partidas: a.partidas,
          vitorias: a.vitorias,
          pontos: a.pontos,
          melhorPosicao: a.melhorPosicao,
          melhorPercentual: Math.round(a.melhorPercentual),
          ultimaPartida: a.ultimaPartida,
        };
      })
      .sort(
        (a, b) =>
          b.vitorias - a.vitorias ||
          b.pontos - a.pontos ||
          a.melhorPosicao - b.melhorPosicao ||
          a.nome.localeCompare(b.nome),
      )
      // Limita a resposta ao top 100 para manter a resposta leve mesmo com
      // muitos jogadores cadastrados.
      .slice(0, 100);

    return list;
  }
}
