/**
 * ========================================================================
 * SERVIÇO DE RANKING - Dados da área de Diversões
 * ========================================================================
 *
 * Reúne informações comparativas entre os alunos para a página de Ranking:
 *
 * - getStudents : Todos os alunos com progresso geral, módulos concluídos,
 *                 dias ativos, streak e último acesso.
 * - getOnline   : Alunos "online" (último acesso recente).
 * - getFastest  : Quem concluiu o curso completo em menos tempo.
 * - getDays     : Melhores dias de acesso (últimos 14 dias).
 *
 * Os cálculos de "dias ativos" e "streak" usam as tentativas de login
 * bem-sucedidas (TentativaLogin.sucesso = true).
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QUIZ_CATEGORIES } from '../quiz/quiz.types';

/**
 * Fuso da aplicação: os alunos estão no Brasil (UTC-3).
 * O container roda em UTC, então usar o fuso local do servidor faria as
 * chaves de dia ("hoje", streak, gráfico) caírem no dia seguinte à noite.
 */
const APP_TIMEZONE = 'America/Sao_Paulo';

/** Formata uma data no fuso da aplicação como YYYY-MM-DD. */
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

@Injectable()
export class RankingService {
  private static readonly TOTAL_MODULES = 3;

  constructor(private prisma: PrismaService) {}

  /** Data (fuso America/Sao_Paulo) no formato YYYY-MM-DD (chave para agrupar dias). */
  private fmt(d: Date): string {
    const parts = dayFormatter.formatToParts(d);
    const get = (t: 'year' | 'month' | 'day') =>
      parts.find((p) => p.type === t)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  /** Quantos dias consecutivos (até hoje/ontem) o aluno entrou. */
  private currentStreak(days: string[]): number {
    const set = new Set(days);
    const cursor = new Date();
    if (!set.has(this.fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (set.has(this.fmt(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  /** Se `b` é o dia imediatamente seguinte a `a` (chaves YYYY-MM-DD). */
  private isNextDay(a: string, b: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return false;
    const da = new Date(a + 'T12:00:00');
    const db = new Date(b + 'T12:00:00');
    const next = new Date(da.getFullYear(), da.getMonth(), da.getDate() + 1);
    return (
      next.getFullYear() === db.getFullYear() &&
      next.getMonth() === db.getMonth() &&
      next.getDate() === db.getDate()
    );
  }

  /** Maior sequência consecutiva de dias já alcançada (recorde histórico). */
  private bestStreak(days: string[]): number {
    const keys = [...new Set(days)].sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const k of keys) {
      run = prev !== null && this.isNextDay(prev, k) ? run + 1 : 1;
      if (run > best) best = run;
      prev = k;
    }
    return best;
  }

  /**
   * Todos os alunos, ordenados por progresso geral (depois dias ativos).
   */
  async getStudents() {
    const [totalAulas, users, progressAulas, progressModulos, logins, quizTempos] = await Promise.all([
      this.prisma.aula.count(),
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true, ultimoAcesso: true, criadoEm: true },
      }),
      this.prisma.progressoAula.groupBy({
        by: ['usuarioId'],
        where: { concluido: true },
        _count: { _all: true },
      }),
      this.prisma.progressoModulo.groupBy({
        by: ['usuarioId'],
        where: { concluido: true },
        _count: { _all: true },
      }),
      this.prisma.tentativaLogin.findMany({
        where: { sucesso: true, usuarioId: { not: null } },
        select: { usuarioId: true, momento: true },
      }),
      this.prisma.partidaQuiz.findMany({
        where: { tempoMedioResposta: { gt: 0 } },
        select: { usuarioId: true, tempoMedioResposta: true },
      }),
    ]);

    const aulaMap = new Map<number, number>();
    for (const p of progressAulas) aulaMap.set(p.usuarioId, p._count._all);

    const modMap = new Map<number, number>();
    for (const p of progressModulos) modMap.set(p.usuarioId, p._count._all);

    const quizTempoMap = new Map<number, { soma: number; n: number }>();
    for (const q of quizTempos) {
      let e = quizTempoMap.get(q.usuarioId);
      if (!e) {
        e = { soma: 0, n: 0 };
        quizTempoMap.set(q.usuarioId, e);
      }
      e.soma += q.tempoMedioResposta;
      e.n++;
    }

    const dayMap = new Map<number, Set<string>>();
    for (const l of logins) {
      if (l.usuarioId == null) continue;
      let set = dayMap.get(l.usuarioId);
      if (!set) {
        set = new Set();
        dayMap.set(l.usuarioId, set);
      }
      set.add(this.fmt(l.momento));
    }

    return users
      .map((u) => {
        const aulas = aulaMap.get(u.id) || 0;
        const modulos = modMap.get(u.id) || 0;
        const days = dayMap.get(u.id);
        const diasAtivos = days ? days.size : 0;
        const streak = days ? this.currentStreak([...days]) : 0;
        const qt = quizTempoMap.get(u.id);
        return {
          id: u.id,
          nome: u.nome,
          fotoUrl: u.fotoUrl,
          progressoGeral: totalAulas ? Math.round((aulas / totalAulas) * 100) : 0,
          aulasConcluidas: aulas,
          totalAulas,
          modulosConcluidos: modulos,
          totalModulos: RankingService.TOTAL_MODULES,
          concluiuTudo: modulos >= RankingService.TOTAL_MODULES,
          diasAtivos,
          streak,
          tempoMedioQuiz: qt && qt.n ? Number((qt.soma / qt.n).toFixed(2)) : 0,
          ultimoAcesso: u.ultimoAcesso,
          criadoEm: u.criadoEm,
        };
      })
      .sort(
        (a, b) =>
          b.progressoGeral - a.progressoGeral ||
          b.streak - a.streak ||
          b.diasAtivos - a.diasAtivos ||
          a.nome.localeCompare(b.nome),
      );
  }

  /** Alunos online: último acesso dentro de N minutos (padrão 10). */
  async getOnline(withinMinutes = 10) {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return this.prisma.usuario.findMany({
      where: { ultimoAcesso: { gte: cutoff } },
      select: { id: true, nome: true, fotoUrl: true, ultimoAcesso: true },
      orderBy: { ultimoAcesso: 'desc' },
    });
  }

  /** Quem concluiu o curso completo em menos tempo (início → última conclusão). */
  async getFastest() {
    const progress = await this.prisma.progressoModulo.findMany({
      where: { concluido: true },
      select: { usuarioId: true, iniciadoEm: true, concluidoEm: true },
    });

    const byUser = new Map<number, { inicio: Date; fim: Date; count: number }>();
    for (const p of progress) {
      if (!p.concluidoEm) continue;
      let e = byUser.get(p.usuarioId);
      if (!e) {
        e = { inicio: p.iniciadoEm, fim: p.concluidoEm, count: 0 };
        byUser.set(p.usuarioId, e);
      }
      if (p.iniciadoEm < e.inicio) e.inicio = p.iniciadoEm;
      if (p.concluidoEm > e.fim) e.fim = p.concluidoEm;
      e.count++;
    }

    const userIds = [...byUser.keys()];
    if (userIds.length === 0) return [];

    const users = await this.prisma.usuario.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nome: true, fotoUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result: {
      id: number;
      nome: string;
      fotoUrl: string | null;
      tempoSegundos: number;
      concluidoEm: Date;
    }[] = [];

    for (const [userId, e] of byUser) {
      if (e.count < RankingService.TOTAL_MODULES) continue;
      const u = userMap.get(userId);
      if (!u) continue;
      const ms = e.fim.getTime() - e.inicio.getTime();
      result.push({
        id: u.id,
        nome: u.nome,
        fotoUrl: u.fotoUrl,
        tempoSegundos: Math.max(0, Math.floor(ms / 1000)),
        concluidoEm: e.fim,
      });
    }

    result.sort((a, b) => a.tempoSegundos - b.tempoSegundos);
    return result;
  }

  /** Melhores dias de acesso: últimos 14 dias com nº de acessos e alunos. */  async getDays(daysBack = 14) {
    const now = new Date();

    // Janela por instantes (não depende do fuso do servidor): os últimos
    // `daysBack` dias até AGORA, convertidos para o fuso da aplicação.
    const start = new Date(now.getTime() - (daysBack - 1) * 86_400_000);

    const logins = await this.prisma.tentativaLogin.findMany({
      where: { sucesso: true, usuarioId: { not: null }, momento: { gte: start } },
      select: { usuarioId: true, momento: true },
    });

    const map = new Map<string, { jogadores: Set<number>; acessos: number }>();
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      map.set(this.fmt(d), { jogadores: new Set(), acessos: 0 });
    }

    for (const l of logins) {
      if (l.usuarioId == null) continue;
      const entry = map.get(this.fmt(l.momento));
      if (!entry) continue;
      entry.acessos++;
      entry.jogadores.add(l.usuarioId);
    }

    return [...map.entries()].map(([dia, v]) => ({
      dia,
      acessos: v.acessos,
      jogadores: v.jogadores.size,
    }));
  }

  /**
   * Estatísticas gerais da turma para o topo da página de Ranking.
   */
  async getStats() {
    const [alunos, totalAulas, aulasConcluidas, partidasQuiz, vitoriasQuiz, podiosQuiz, perfQuiz, conquistas, concluintes, logins, partidasDetalhe, users] =
      await Promise.all([
        this.prisma.usuario.count(),
        this.prisma.aula.count(),
        this.prisma.progressoAula.count({ where: { concluido: true } }),
        this.prisma.partidaQuiz.count(),
        this.prisma.partidaQuiz.count({ where: { posicao: 1 } }),
        this.prisma.partidaQuiz.count({ where: { posicao: { lte: 3 } } }),
        this.prisma.partidaQuiz.findMany({
          select: { acertos: true, totalPerguntas: true },
        }),
        this.prisma.conquista.count(),
        this.prisma.progressoModulo.groupBy({
          by: ['usuarioId'],
          where: { concluido: true },
          _count: { _all: true },
        }),
        this.prisma.tentativaLogin.findMany({
          where: { sucesso: true, usuarioId: { not: null } },
          select: { usuarioId: true, momento: true },
        }),
        this.prisma.partidaQuiz.findMany({
          select: { usuarioId: true, percentualAcertos: true },
        }),
        this.prisma.usuario.findMany({
          select: { id: true, nome: true },
        }),
      ]);

    let perfeitasQuiz = 0;
    for (const p of perfQuiz) {
      if (p.totalPerguntas > 0 && p.acertos === p.totalPerguntas) perfeitasQuiz++;
    }

    const dayMap = new Map<number, Set<string>>();
    for (const l of logins) {
      if (l.usuarioId == null) continue;
      let set = dayMap.get(l.usuarioId);
      if (!set) {
        set = new Set();
        dayMap.set(l.usuarioId, set);
      }
      set.add(this.fmt(l.momento));
    }
    let melhorStreak = 0;
    for (const set of dayMap.values()) {
      melhorStreak = Math.max(melhorStreak, this.bestStreak([...set]));
    }

    let melhorNota = 0;
    let melhorNotaJogador: string | null = null;
    for (const p of partidasDetalhe) {
      if (p.percentualAcertos > melhorNota) {
        melhorNota = p.percentualAcertos;
        const u = users.find((x) => x.id === p.usuarioId);
        melhorNotaJogador = u ? u.nome : melhorNotaJogador;
      }
    }

    return {
      totalAlunos: alunos,
      totalAulas,
      aulasConcluidas,
      partidasQuiz,
      vitoriasQuiz,
      podiosQuiz,
      perfeitasQuiz,
      concluintes: concluintes.filter((c) => c._count._all >= RankingService.TOTAL_MODULES).length,
      conquistasObtidas: conquistas,
      melhorStreak,
      melhorNota: Math.round(melhorNota),
      melhorNotaJogador,
    };
  }

  /**
   * Maiores sequências de acesso entre os alunos (top 5).
   * Usa o RECORDE histórico (maior sequência consecutiva já alcançada),
   * em vez da sequência atual — que zera todo dia e deixaria o ranking
   * vazio sempre que ninguém entrasse hoje ou ontem.
   */
  async getStreak() {
    const [users, logins] = await Promise.all([
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true },
      }),
      this.prisma.tentativaLogin.findMany({
        where: { sucesso: true, usuarioId: { not: null } },
        select: { usuarioId: true, momento: true },
      }),
    ]);

    const dayMap = new Map<number, Set<string>>();
    for (const l of logins) {
      if (l.usuarioId == null) continue;
      let set = dayMap.get(l.usuarioId);
      if (!set) {
        set = new Set();
        dayMap.set(l.usuarioId, set);
      }
      set.add(this.fmt(l.momento));
    }

    const nomeMap = new Map(users.map((u) => [u.id, u]));
    return users
      .map((u) => {
        const days = dayMap.get(u.id);
        return {
          id: u.id,
          nome: u.nome,
          fotoUrl: u.fotoUrl,
          streak: days ? this.bestStreak([...days]) : 0,
          diasAtivos: days ? days.size : 0,
        };
      })
      .filter((u) => u.streak > 0)
      .sort(
        (a, b) =>
          b.streak - a.streak || b.diasAtivos - a.diasAtivos || a.nome.localeCompare(b.nome),
      )
      .slice(0, 5);
  }

  /** Conquistas por aluno: quem tem mais conquistas na plataforma (top 5). */
  async getConquistas() {
    const [users, grouped] = await Promise.all([
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true },
      }),
      this.prisma.conquista.groupBy({
        by: ['usuarioId'],
        _count: { _all: true },
      }),
    ]);

    const nomeMap = new Map(users.map((u) => [u.id, u]));
    return grouped
      .map((g) => {
        const u = nomeMap.get(g.usuarioId);
        if (!u) return null;
        return {
          id: u.id,
          nome: u.nome,
          fotoUrl: u.fotoUrl,
          total: g._count._all,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
      .slice(0, 5);
  }

  /**
   * Ranking de Quiz: alunos com partidas, vitórias, pódios e partidas perfeitas.
   * Ordenado por vitórias; em empate, pela taxa de vitória e tempo médio.
   */
  async getQuiz() {
    const [users, partidas] = await Promise.all([
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true },
      }),
      this.prisma.partidaQuiz.findMany({
        select: {
          usuarioId: true,
          posicao: true,
          acertos: true,
          totalPerguntas: true,
          percentualAcertos: true,
          pontos: true,
          tempoMedioResposta: true,
          concluidaEm: true,
        },
      }),
    ]);

    const nomeMap = new Map(users.map((u) => [u.id, u]));

    const mapa = new Map<
      number,
      {
        partidas: number;
        vitorias: number;
        podios: number;
        perfeitas: number;
        melhorNota: number;
        pontosTotal: number;
        somaTempo: number;
        respostasTempo: number;
        winStreak: number;
      }
    >();

    // Partidas por usuário em ordem cronológica (da mais antiga para a mais
    // recente) para calcular a sequência atual de vitórias (win streak).
    const porUsuario = new Map<number, typeof partidas>();
    for (const p of partidas) {
      const arr = porUsuario.get(p.usuarioId);
      if (!arr) {
        porUsuario.set(p.usuarioId, [p]);
      } else {
        arr.push(p);
      }
    }
    for (const arr of porUsuario.values()) {
      arr.sort((a, b) => a.concluidaEm.getTime() - b.concluidaEm.getTime());
    }

    for (const p of partidas) {
      let e = mapa.get(p.usuarioId);
      if (!e) {
        e = { partidas: 0, vitorias: 0, podios: 0, perfeitas: 0, melhorNota: 0, pontosTotal: 0, somaTempo: 0, respostasTempo: 0, winStreak: 0 };
        mapa.set(p.usuarioId, e);
      }
      e.partidas++;
      if (p.posicao === 1) e.vitorias++;
      if (p.posicao >= 1 && p.posicao <= 3) e.podios++;
      if (p.totalPerguntas > 0 && p.acertos === p.totalPerguntas) e.perfeitas++;
      if (p.percentualAcertos > e.melhorNota) e.melhorNota = p.percentualAcertos;
      e.pontosTotal += p.pontos;
      if (p.tempoMedioResposta > 0) {
        e.somaTempo += p.tempoMedioResposta;
        e.respostasTempo++;
      }
    }

    // Win streak: conta vitórias consecutivas a partir da partida mais recente.
    for (const [userId, arr] of porUsuario) {
      const e = mapa.get(userId);
      if (!e) continue;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].posicao === 1) e.winStreak++;
        else break;
      }
    }

    return [...mapa.entries()]
      .map(([id, e]) => {
        const u = nomeMap.get(id);
        if (!u) return null;
        return {
          id,
          nome: u.nome,
          fotoUrl: u.fotoUrl,
          partidas: e.partidas,
          vitorias: e.vitorias,
          taxaVitoria: e.partidas ? Math.round((e.vitorias / e.partidas) * 100) : 0,
          podios: e.podios,
          perfeitas: e.perfeitas,
          melhorNota: Math.round(e.melhorNota),
          pontosTotal: e.pontosTotal,
          winStreak: e.winStreak,
          tempoMedioResposta: e.respostasTempo
            ? Number((e.somaTempo / e.respostasTempo).toFixed(2))
            : 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort(
        (a, b) =>
          b.vitorias - a.vitorias ||
          b.taxaVitoria - a.taxaVitoria ||
          b.melhorNota - a.melhorNota ||
          a.tempoMedioResposta - b.tempoMedioResposta ||
          a.nome.localeCompare(b.nome),
      );
  }

  /**
   * Ranking do Quiz por categoria: melhores jogadores em cada tema.
   * Ordenado por vitórias; em empate, pela taxa de vitória e melhor nota.
   */
  async getQuizByCategory() {
    const [users, partidas] = await Promise.all([
      this.prisma.usuario.findMany({
        select: { id: true, nome: true, fotoUrl: true },
      }),
      this.prisma.partidaQuiz.findMany({
        select: {
          usuarioId: true,
          categoria: true,
          posicao: true,
          acertos: true,
          totalPerguntas: true,
          percentualAcertos: true,
          pontos: true,
        },
      }),
    ]);

    const nomeMap = new Map(users.map((u) => [u.id, u]));

    const porCategoria = new Map<string, Map<number, { partidas: number; vitorias: number; podios: number; melhorNota: number; pontosTotal: number }>>();

    for (const p of partidas) {
      let cat = porCategoria.get(p.categoria);
      if (!cat) {
        cat = new Map();
        porCategoria.set(p.categoria, cat);
      }
      let e = cat.get(p.usuarioId);
      if (!e) {
        e = { partidas: 0, vitorias: 0, podios: 0, melhorNota: 0, pontosTotal: 0 };
        cat.set(p.usuarioId, e);
      }
      e.partidas++;
      if (p.posicao === 1) e.vitorias++;
      if (p.posicao >= 1 && p.posicao <= 3) e.podios++;
      if (p.percentualAcertos > e.melhorNota) e.melhorNota = p.percentualAcertos;
      e.pontosTotal += p.pontos;
    }

    return QUIZ_CATEGORIES.map((cat) => {
      const stats = porCategoria.get(cat.id);
      if (!stats || stats.size === 0) {
        return { categoria: cat.id, nome: cat.nome, icone: cat.icone, top: [] };
      }
      const top = [...stats.entries()]
        .map(([id, e]) => {
          const u = nomeMap.get(id);
          if (!u) return null;
          return {
            id,
            nome: u.nome,
            fotoUrl: u.fotoUrl,
            partidas: e.partidas,
            vitorias: e.vitorias,
            taxaVitoria: e.partidas ? Math.round((e.vitorias / e.partidas) * 100) : 0,
            podios: e.podios,
            melhorNota: Math.round(e.melhorNota),
            pontosTotal: e.pontosTotal,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort(
          (a, b) =>
            b.vitorias - a.vitorias ||
            b.taxaVitoria - a.taxaVitoria ||
            b.melhorNota - a.melhorNota ||
            a.nome.localeCompare(b.nome),
        )
        .slice(0, 5);
      return { categoria: cat.id, nome: cat.nome, icone: cat.icone, top };
    });
  }

  /** Pioneiros: os primeiros alunos a se cadastrarem na plataforma. */
  async getPioneiros(limit = 6) {
    return this.prisma.usuario.findMany({
      select: { id: true, nome: true, fotoUrl: true, criadoEm: true },
      orderBy: { criadoEm: 'asc' },
      take: limit,
    });
  }

  /**
   * Heartbeat: marca o usuário como ativo agora (online).
   * Atualiza ultimoAcesso com throttle em memória (máx. 1 escrita/30s)
   * para não sobrecarregar o banco com várias abas/páginas abertas.
   */
  private readonly lastBeat = new Map<number, number>();

  async heartbeat(userId: number) {
    const now = Date.now();
    const last = this.lastBeat.get(userId) || 0;
    if (now - last < 30_000) return { ok: true, throttled: true };
    this.lastBeat.set(userId, now);
    // Poda leve: remove registros antigos para a memória não crescer sem limite.
    if (this.lastBeat.size > 500) {
      for (const [id, t] of this.lastBeat) {
        if (now - t > 60_000) this.lastBeat.delete(id);
      }
    }
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { ultimoAcesso: new Date() },
    });
    return { ok: true };
  }
}
