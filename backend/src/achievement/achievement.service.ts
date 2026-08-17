/**
 * ========================================================================
 * SERVIÇO DE CONQUISTAS - Medalhas da área de Diversões
 * ========================================================================
 *
 * Calcula (sob demanda) as conquistas do aluno a partir dos dados reais
 * da plataforma: progresso nas aulas/módulos, logins, partidas do Quiz,
 * visitas à área Minha Conta e conclusão dos simuladores interativos.
 *
 * Quando uma conquista é alcançada pela primeira vez, ela é persistida na
 * tabela Conquista (para guardar a data "obtida em") e sinalizada como
 * "nova" na resposta — o frontend usa isso para animar o desbloqueio.
 *
 * Tipos de atividade utilizados:
 * - pagina_visitada      : visita às páginas da área Minha Conta
 * - simulador_concluido  : conclusão de um simulador interativo
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AchData {
  aulas: number;
  totalAulas: number;
  modulosConcluidos: Set<number>;
  modulos: number;
  partidas: number;
  vitorias: number;
  perfeitas: number;
  dias: number;
  streak: number;
  visitas: number;
  areasVisitadas: number;
  maxAulasPorDia: number;
  simuladores: Set<string>;
}

interface AchDef {
  slug: string;
  icone: string;
  titulo: string;
  descricao: string;
  meta: number;
  progress: (d: AchData) => number;
}

@Injectable()
export class AchievementService {
  constructor(private prisma: PrismaService) {}

  /** Throttle simples em memória: chave `userId:area` -> timestamp da última visita.
   *  Evita que chamadas repetidas do frontend inflacionem a tabela de atividades. */
  private lastVisit = new Map<string, number>();
  private static readonly VISIT_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 min

  /** Slugs válidos dos simuladores (whitelist — impede conquistas via chamadas
   *  diretas à API com slugs arbitrários). */
  private static readonly SIMULADOR_SLUGS = [
    'ligar',
    'mouse',
    'teclado',
    'janelas',
    'redes',
    'pendrive',
    'navegador',
  ];

  /** Áreas conhecidas da área Minha Conta (whitelist — impede inflar o
   *  contador de áreas visitadas com strings arbitrárias). */
  private static readonly AREAS_CONHECIDAS = [
    'conta',
    'cadastro',
    'conquistas',
    'criadores',
    'interativo',
    'progresson1',
    'quiz',
    'ranking',
    'senha',
  ];

  /** Data local no formato YYYY-MM-DD (chave para agrupar dias). */
  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

  private defs(totalAulas: number): AchDef[] {
    const modulo = (id: number) => (d: AchData) => (d.modulosConcluidos.has(id) ? 1 : 0);
    const sim = (slug: string) => (d: AchData) => (d.simuladores.has(slug) ? 1 : 0);

    return [
      {
        slug: 'primeira-aula',
        icone: 'play',
        titulo: 'Primeira Aula',
        descricao: 'Concluiu a primeira aula do curso.',
        meta: 1,
        progress: (d) => Math.min(d.aulas, 1),
      },
      {
        slug: 'cinco-aulas',
        icone: 'book',
        titulo: 'Cinco Aulas',
        descricao: 'Concluiu 5 aulas da plataforma.',
        meta: 5,
        progress: (d) => d.aulas,
      },
      {
        slug: 'dez-aulas',
        icone: 'stairs',
        titulo: 'Dez Aulas',
        descricao: 'Concluiu 10 aulas da plataforma.',
        meta: 10,
        progress: (d) => d.aulas,
      },
      {
        slug: 'todas-aulas',
        icone: 'layers',
        titulo: 'Todas as Aulas',
        descricao: 'Concluiu todas as aulas do curso.',
        meta: totalAulas,
        progress: (d) => d.aulas,
      },
      {
        slug: 'modulo-iniciante',
        icone: 'flag',
        titulo: 'Módulo Iniciante',
        descricao: 'Concluiu o módulo Iniciante.',
        meta: 1,
        progress: modulo(1),
      },
      {
        slug: 'modulo-basico',
        icone: 'flag',
        titulo: 'Módulo Básico',
        descricao: 'Concluiu o módulo Básico.',
        meta: 1,
        progress: modulo(2),
      },
      {
        slug: 'modulo-avancado',
        icone: 'flag',
        titulo: 'Módulo Avançado',
        descricao: 'Concluiu o módulo Avançado.',
        meta: 1,
        progress: modulo(3),
      },
      {
        slug: 'curso-completo',
        icone: 'trophy',
        titulo: 'Curso Completo',
        descricao: 'Concluiu os três módulos do curso.',
        meta: 3,
        progress: (d) => d.modulos,
      },
      {
        slug: 'primeiro-login',
        icone: 'key',
        titulo: 'Bem-vindo(a)',
        descricao: 'Fez o primeiro acesso na plataforma.',
        meta: 1,
        progress: (d) => Math.min(d.dias, 1),
      },
      {
        slug: 'streak-3',
        icone: 'flame',
        titulo: 'Sequência de 3 Dias',
        descricao: 'Acessou a plataforma por 3 dias seguidos.',
        meta: 3,
        progress: (d) => d.streak,
      },
      {
        slug: 'ativo-7',
        icone: 'calendar',
        titulo: 'Semana Ativa',
        descricao: 'Acessou a plataforma em 7 dias diferentes.',
        meta: 7,
        progress: (d) => d.dias,
      },
      {
        slug: 'ativo-15',
        icone: 'calendar',
        titulo: 'Meio Mês Ativo',
        descricao: 'Acessou a plataforma em 15 dias diferentes.',
        meta: 15,
        progress: (d) => d.dias,
      },
      {
        slug: 'aulas-em-um-dia',
        icone: 'zap',
        titulo: 'Maratona de Estudos',
        descricao: 'Concluiu 3 aulas em um mesmo dia.',
        meta: 3,
        progress: (d) => d.maxAulasPorDia,
      },
      {
        slug: 'primeiro-quiz',
        icone: 'bolt',
        titulo: 'Primeira Partida',
        descricao: 'Jogou a primeira partida do Quiz Multiplayer.',
        meta: 1,
        progress: (d) => Math.min(d.partidas, 1),
      },
      {
        slug: 'vitoria-quiz',
        icone: 'crown',
        titulo: 'Vitória no Quiz',
        descricao: 'Venceu uma partida do Quiz Multiplayer.',
        meta: 1,
        progress: (d) => Math.min(d.vitorias, 1),
      },
      {
        slug: 'quiz-perfeito',
        icone: 'star',
        titulo: 'Quiz Perfeito',
        descricao: 'Acertou todas as perguntas de uma partida do Quiz.',
        meta: 1,
        progress: (d) => Math.min(d.perfeitas, 1),
      },
      {
        slug: 'quiz-dez-partidas',
        icone: 'layers',
        titulo: 'Veterano do Quiz',
        descricao: 'Jogou 10 partidas do Quiz Multiplayer.',
        meta: 10,
        progress: (d) => d.partidas,
      },
      {
        slug: 'visitou-conta',
        icone: 'user',
        titulo: 'Explorador da Conta',
        descricao: 'Visitou a área Minha Conta.',
        meta: 1,
        progress: (d) => Math.min(d.visitas, 1),
      },
      {
        slug: 'visitou-diversoes',
        icone: 'compass',
        titulo: 'Explorador do Sistema',
        descricao: 'Visitou 4 áreas diferentes da plataforma.',
        meta: 4,
        progress: (d) => d.areasVisitadas,
      },
      {
        slug: 'simulador-ligar',
        icone: 'power',
        titulo: 'Ligando a Máquina',
        descricao: 'Completou o simulador de ligar e desligar o computador.',
        meta: 1,
        progress: sim('ligar'),
      },
      {
        slug: 'simulador-mouse',
        icone: 'mouse',
        titulo: 'Domínio do Mouse',
        descricao: 'Completou o simulador do mouse.',
        meta: 1,
        progress: sim('mouse'),
      },
      {
        slug: 'simulador-teclado',
        icone: 'keyboard',
        titulo: 'Domínio do Teclado',
        descricao: 'Completou o simulador do teclado.',
        meta: 1,
        progress: sim('teclado'),
      },
      {
        slug: 'simulador-janelas',
        icone: 'window',
        titulo: 'Mestre das Janelas',
        descricao: 'Completou o simulador de janelas.',
        meta: 1,
        progress: sim('janelas'),
      },
      {
        slug: 'simulador-redes',
        icone: 'globe',
        titulo: 'Navegando na Internet',
        descricao: 'Completou o simulador de internet e redes.',
        meta: 1,
        progress: sim('redes'),
      },
      {
        slug: 'simulador-quatro',
        icone: 'layers',
        titulo: 'Quase Mestre',
        descricao: 'Completou 4 simuladores interativos.',
        meta: 4,
        progress: (d) => d.simuladores.size,
      },
      {
        slug: 'progresso-25',
        icone: 'gauge',
        titulo: 'Quarto do Caminho',
        descricao: 'Alcançou 25% de todas as aulas do curso.',
        meta: Math.ceil(totalAulas * 0.25),
        progress: (d) => d.aulas,
      },
      {
        slug: 'progresso-50',
        icone: 'gauge',
        titulo: 'Metade do Caminho',
        descricao: 'Alcançou 50% de todas as aulas do curso.',
        meta: Math.ceil(totalAulas * 0.5),
        progress: (d) => d.aulas,
      },
      {
        slug: 'ativo-5',
        icone: 'calendar',
        titulo: 'Cinco Dias Ativos',
        descricao: 'Acessou a plataforma em 5 dias diferentes.',
        meta: 5,
        progress: (d) => d.dias,
      },
      {
        slug: 'streak-7',
        icone: 'flame',
        titulo: 'Semana em Chamas',
        descricao: 'Acessou a plataforma por 7 dias seguidos.',
        meta: 7,
        progress: (d) => d.streak,
      },
      {
        slug: 'quiz-cinco-partidas',
        icone: 'bolt',
        titulo: 'Frequente no Quiz',
        descricao: 'Jogou 5 partidas do Quiz Multiplayer.',
        meta: 5,
        progress: (d) => d.partidas,
      },
      {
        slug: 'quiz-cinco-vitorias',
        icone: 'crown',
        titulo: 'Campeão do Quiz',
        descricao: 'Venceu 5 partidas do Quiz Multiplayer.',
        meta: 5,
        progress: (d) => d.vitorias,
      },
      {
        slug: 'quiz-tres-perfeitas',
        icone: 'star',
        titulo: 'Impecável',
        descricao: 'Fez 3 partidas perfeitas no Quiz Multiplayer.',
        meta: 3,
        progress: (d) => d.perfeitas,
      },
      {
        slug: 'quiz-100-partidas',
        icone: 'bolt',
        titulo: 'Lenda do Quiz',
        descricao: 'Jogou 100 partidas do Quiz Multiplayer.',
        meta: 100,
        progress: (d) => d.partidas,
      },
      {
        slug: 'quiz-50-vitorias',
        icone: 'crown',
        titulo: 'Imbatível no Quiz',
        descricao: 'Venceu 50 partidas do Quiz Multiplayer.',
        meta: 50,
        progress: (d) => d.vitorias,
      },
      {
        slug: 'quiz-dez-perfeitas',
        icone: 'star',
        titulo: 'Perfeição Absoluta',
        descricao: 'Fez 10 partidas perfeitas no Quiz Multiplayer.',
        meta: 10,
        progress: (d) => d.perfeitas,
      },
      {
        slug: 'streak-30',
        icone: 'flame',
        titulo: 'Mês em Chamas',
        descricao: 'Acessou a plataforma por 30 dias seguidos.',
        meta: 30,
        progress: (d) => d.streak,
      },
      {
        slug: 'mestre-simuladores',
        icone: 'gamepad',
        titulo: 'Mestre dos Simuladores',
        descricao: 'Completou todos os simuladores interativos.',
        meta: 7,
        progress: (d) => d.simuladores.size,
      },
    ];
  }

  async list(userId: number) {
    const totalAulas = await this.prisma.aula.count();

    const [aulas, modulos, partidasQuiz, vitorias, logins, visitas, sims, aulasDias] =
      await Promise.all([
        this.prisma.progressoAula.count({
          where: { usuarioId: userId, concluido: true },
        }),
        this.prisma.progressoModulo.findMany({
          where: { usuarioId: userId, concluido: true },
          select: { moduloId: true },
        }),
        this.prisma.partidaQuiz.findMany({
          where: { usuarioId: userId },
          select: { acertos: true, totalPerguntas: true },
        }),
        this.prisma.partidaQuiz.count({ where: { usuarioId: userId, posicao: 1 } }),
        this.prisma.tentativaLogin.findMany({
          where: { usuarioId: userId, sucesso: true },
          select: { momento: true },
        }),
        this.prisma.atividade.findMany({
          where: { usuarioId: userId, tipo: 'pagina_visitada' },
          select: { descricao: true },
        }),
        this.prisma.atividade.findMany({
          where: { usuarioId: userId, tipo: 'simulador_concluido' },
          select: { descricao: true },
        }),
        this.prisma.progressoAula.findMany({
          where: { usuarioId: userId, concluido: true, concluidoEm: { not: null } },
          select: { concluidoEm: true },
        }),
      ]);

    const partidas = partidasQuiz.length;
    const perfeitas = partidasQuiz.filter(
      (p) => p.totalPerguntas > 0 && p.acertos === p.totalPerguntas,
    ).length;

    const daySet = new Set(logins.map((l) => this.fmt(l.momento)));
    const simuladores = new Set(
      sims.map((s) => String(s.descricao).replace(/^simulador:/, '')),
    );
    const modulosConcluidos = new Set(modulos.map((m) => m.moduloId));
    const areasVisitadas = new Set(
      visitas.map((v) => String(v.descricao).replace(/^Visitou a área:\s*/, '')),
    );

    const aulasPorDia = new Map<string, number>();
    for (const a of aulasDias) {
      const chave = this.fmt(a.concluidoEm!);
      aulasPorDia.set(chave, (aulasPorDia.get(chave) || 0) + 1);
    }
    let maxAulasPorDia = 0;
    aulasPorDia.forEach((n) => {
      if (n > maxAulasPorDia) maxAulasPorDia = n;
    });

    const data: AchData = {
      aulas,
      totalAulas: Math.max(totalAulas, 1),
      modulosConcluidos,
      modulos: modulosConcluidos.size,
      partidas,
      vitorias,
      perfeitas,
      dias: daySet.size,
      streak: this.currentStreak([...daySet]),
      visitas: visitas.length,
      areasVisitadas: areasVisitadas.size,
      maxAulasPorDia,
      simuladores,
    };

    const defs = this.defs(data.totalAulas);

    const existentes = await this.prisma.conquista.findMany({
      where: { usuarioId: userId },
      select: { slug: true, obtidaEm: true },
    });
    const mapa = new Map(existentes.map((c) => [c.slug, c.obtidaEm]));

    const novas: string[] = [];
    const agora = new Date();
    const conquistas = defs.map((def) => {
      const atual = Math.min(def.progress(data), def.meta);
      const conquistada = atual >= def.meta;
      let obtidaEm = mapa.get(def.slug) || null;
      if (conquistada && !obtidaEm) {
        obtidaEm = agora;
        novas.push(def.slug);
      }
      return {
        slug: def.slug,
        icone: def.icone,
        titulo: def.titulo,
        descricao: def.descricao,
        conquistada,
        progresso: { atual, meta: def.meta },
        obtidaEm,
      };
    });

    if (novas.length) {
      await Promise.all(
        novas.map((slug) =>
          this.prisma.conquista.upsert({
            where: { usuarioId_slug: { usuarioId: userId, slug } },
            create: { usuarioId: userId, slug },
            update: {},
          }),
        ),
      );
    }

    const conquistadas = conquistas.filter((c) => c.conquistada).length;

    return {
      total: conquistas.length,
      conquistadas,
      novas,
      conquistas,
    };
  }

  /** Registra uma visita à área Minha Conta (tipo = pagina_visitada).
   *  Apenas áreas conhecidas são aceitas (whitelist). */
  async visit(userId: number, area: string) {
    if (!AchievementService.AREAS_CONHECIDAS.includes(area)) {
      return { ok: false };
    }
    const chave = `${userId}:${area}`;
    const agora = Date.now();
    const ultima = this.lastVisit.get(chave) || 0;
    if (agora - ultima < AchievementService.VISIT_MIN_INTERVAL_MS) {
      return { ok: true, throttled: true };
    }
    this.lastVisit.set(chave, agora);
    await this.prisma.atividade.create({
      data: {
        usuarioId: userId,
        tipo: 'pagina_visitada',
        descricao: `Visitou a área: ${area}`,
      },
    });
    return { ok: true };
  }

  /** Registra a conclusão de um simulador (tipo = simulador_concluido).
   *  Apenas slugs da whitelist são aceitos. */
  async simulator(userId: number, slug: string) {
    if (!AchievementService.SIMULADOR_SLUGS.includes(slug)) {
      return { ok: false };
    }
    const descricao = `simulador:${slug}`;
    const existe = await this.prisma.atividade.findFirst({
      where: { usuarioId: userId, tipo: 'simulador_concluido', descricao },
    });
    if (!existe) {
      await this.prisma.atividade.create({
        data: { usuarioId: userId, tipo: 'simulador_concluido', descricao },
      });
    }
    return { ok: true };
  }
}
