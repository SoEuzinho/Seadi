/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Serviço de Partida
 * ========================================================================
 * 
 * Este serviço gerencia a PARTIDA em si, iniciada manualmente pelo Host.
 * Todo o controle é feito pelo servidor: sorteio de perguntas, avanço,
 * cronômetro, pontuação, ranking, pódio e persistência do histórico.
 * 
 * O fluxo da partida foi preservado do sistema original (pontuação,
 * perguntas, cronômetro, ranking e sincronização). A única mudança aqui
 * é a porta de entrada: a partida só começa quando o Host pede.
 * 
 * Anti-trapaça (mantido):
 * - Só é permitido responder uma vez por pergunta.
 * - Respostas fora do tempo da pergunta são ignoradas.
 * - O cliente não controla cronômetros nem o avanço de perguntas.
 * - A alternativa correta nunca trafega para o navegador.
 * - A pontuação é calculada exclusivamente aqui.
 * 
 * Sincronização:
 * - O payload da pergunta agora inclui o `deadline` (timestamp absoluto
 *   do servidor). Todos os navegadores calculam o mesmo tempo restante
 *   no mesmo instante, independentemente da latência de cada um.
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizScoreService } from './quiz-score.service';
import { QuizRoomStore } from './quiz-room.store';
import {
  PAUSE_BETWEEN_QUESTIONS,
  QUESTION_TIME,
  QUESTIONS_COUNT,
  ROOM_LIFETIME_MS,
  getQuizCategoryName,
  QuizRoom,
  RoomPlayer,
} from './quiz.types';

@Injectable()
export class QuizMatchService {
  constructor(
    private store: QuizRoomStore,
    private quizService: QuizService,
    private scoreService: QuizScoreService,
  ) {}

  /**
   * Inicia a partida. Somente o Host pode iniciar.
   * Todos os jogadores recebem quiz:start + quiz:question no mesmo instante.
   */
  startMatch(userId: number) {
    const room = this.store.findRoomForPlayer(userId);
    if (!room || room.status !== 'waiting') return;
    if (room.hostId !== userId) return;
    void this.startGame(room);
  }

  /**
   * Processa a resposta de um jogador (uma única vez por pergunta).
   *
   * Validações (todas no servidor):
   * - o jogador pertence a uma partida em andamento;
   * - o socket que enviou é o socket REGISTRADO do jogador (um socket
   *   antigo de outra aba, ou um socket desconectado, não pode responder);
   * - o jogador ainda não respondeu esta pergunta (anti-duplicado);
   * - a resposta está dentro da janela de tempo (anti-atraso);
   * - a alternativa é válida (0..2) e a pergunta é a ATUAL (o cliente
   *   não consegue responder uma pergunta anterior).
   *
   * O `questionIndex` enviado pelo cliente é apenas um "binding check":
   * ele NÃO é usado para pontuar — a pergunta pontuada é sempre a atual,
   * resolvida no servidor por room.currentQuestion. Isso impede que um
   * cliente manipule partidaId/questaoId para pontuar uma pergunta antiga.
   *
   * @returns Resultado da resposta para o ack individual, ou null se inválida.
   */
  answer(
    userId: number,
    socketId: string,
    answerIndex: number,
    questionIndex: number,
  ): {
    correct: boolean;
    points: number;
    answerIndex: number;
  } | null {
    const room = this.store.findRoomForPlayer(userId);
    if (!room || room.status !== 'playing') return null;

    const player = room.players.get(userId);
    if (!player) return null;

    // Anti-trapaça: apenas o socket registrado do jogador pode responder
    if (!player.connected || player.socketId !== socketId) return null;

    // Anti-trapaça: o índice da pergunta deve ser o da pergunta atual
    if (!Number.isInteger(questionIndex) || questionIndex !== room.currentQuestion) {
      return null;
    }

    // Anti-trapaça: não permite responder duas vezes
    if (player.respondeu) return null;

    // Anti-trapaça: resposta fora da janela da pergunta
    if (room.questionDeadline === null || Date.now() >= room.questionDeadline) return null;

    // Anti-trapaça: alternativa inválida
    if (answerIndex < 0 || answerIndex > 2) return null;

    player.respondeu = true;
    player.ultimaResposta = answerIndex;

    const elapsed = (Date.now() - (room.questionDeadline - QUESTION_TIME * 1000)) / 1000;
    const correct = answerIndex === room.correctIndexes[room.currentQuestion];
    const points = correct ? this.scoreService.calculatePoints(elapsed) : 0;

    player.respostaCorreta = correct;
    player.tempos.push(Number(elapsed.toFixed(2)));

    if (correct) {
      player.acertos++;
      player.pontos += points;
    } else {
      player.erros++;
    }

    const result = {
      correct,
      points,
      answerIndex,
    };

    // Se todos responderam, encerra a pergunta imediatamente (sincronização)
    if (this.allAnswered(room)) {
      this.closeQuestion(room);
    }

    return result;
  }

  private allAnswered(room: QuizRoom): boolean {
    for (const [, player] of room.players) {
      // Jogadores desconectados não podem responder nesta pergunta e não
      // devem travar a revelação até o tempo acabar.
      if (!player.connected) continue;
      if (!player.respondeu) return false;
    }
    return true;
  }

  /* ──────────────────────────── CICLO DA PARTIDA ──────────────────────────── */

  private async startGame(room: QuizRoom) {
    if (!this.store.hasRoom(room.id)) return;

    room.status = 'playing';
    room.currentQuestion = 0;
    room.startedAt = Date.now();

    // Sorteia as perguntas no servidor
    const { questions, correctIndexes } = await this.quizService.pickQuestions(
      room.categoria,
      QUESTIONS_COUNT,
    );

    // O jogador pode ter saído enquanto as perguntas eram sorteadas
    if (!this.store.hasRoom(room.id)) return;

    room.questions = questions;
    room.correctIndexes = correctIndexes;

    if (questions.length === 0) {
      this.store.emitToRoom(room.id, 'quiz:error', {
        message: 'Nenhuma pergunta disponível. Tente outra categoria.',
      });
      this.finishGame(room);
      return;
    }

    const players = [...room.players.values()].map((p) => ({
      userId: p.userId,
      nome: p.nome,
      fotoUrl: p.fotoUrl,
    }));

    this.store.emitToRoom(room.id, 'quiz:start', {
      players,
      categoria: getQuizCategoryName(room.categoria),
      totalQuestions: questions.length,
    });

    // Remove a sala da lista pública (não está mais aberta)
    this.store.emitCategoryUpdate(room.categoria);

    this.sendQuestion(room);
  }

  /**
   * Ressincroniza o estado atual da partida para um único socket.
   *
   * Usado quando o jogador RECONECTA (socket trocado) ou quando entra em
   * uma partida já em andamento:
   * - recebe o quiz:start (jogadores, categoria, total);
   * - recebe o quiz:rank atual (sua posição/0 pontos na entrada);
   * - se houver uma pergunta aberta, recebe o quiz:question com
   *   `canAnswer: false` caso não possa mais respondê-la (já respondeu
   *   antes da queda ou entrou no meio dela).
   */
  syncPlayer(roomId: string, socketId: string) {
    const room = this.store.getRoom(roomId);
    if (!room || room.status !== 'playing' || room.questions.length === 0) return;

    let player: RoomPlayer | null = null;
    for (const [, p] of room.players) {
      if (p.socketId === socketId) {
        player = p;
        break;
      }
    }
    if (!player) return;

    const players = [...room.players.values()].map((p) => ({
      userId: p.userId,
      nome: p.nome,
      fotoUrl: p.fotoUrl,
    }));

    this.store.emitToSocket(socketId, 'quiz:start', {
      players,
      categoria: getQuizCategoryName(room.categoria),
      totalQuestions: room.questions.length,
    });

    this.emitRanking(room, socketId);

    // Pergunta atualmente aberta (dentro da janela de resposta).
    // Envia o `deadline` absoluto do servidor para o cronômetro do cliente
    // mostrar o MESMO tempo restante que os demais jogadores (sincronização
    // de relógio, sem reiniciar a contagem para quem reconecta).
    if (room.questionDeadline !== null && Date.now() < room.questionDeadline) {
      this.store.emitToSocket(socketId, 'quiz:question', {
        ...this.buildQuestionPayload(room),
        deadline: room.questionDeadline,
        canAnswer: !player.respondeu,
      });
      return;
    }

    // Janela da pergunta JÁ expirou mas o fechamento ainda não disparou
    // (milissegundos): fecha imediatamente para que o reconnecting não fique
    // travado sem quiz:results / quiz:pause, sincronizado com o restante.
    if (room.questionDeadline !== null && !room.questionClosed) {
      this.closeQuestion(room);
    }

    // Pausa entre perguntas em andamento: o jogador que voltou ainda não viu
    // o gabarito da pergunta que acabou. Envia o quiz:results da pergunta
    // anterior antes da contagem regressiva, para ficar 100% sincronizado.
    if (room.pauseDeadline !== null && room.questionClosed) {
      const correctIndex = room.correctIndexes[room.currentQuestion];
      this.store.emitToSocket(socketId, 'quiz:results', {
        pergunta: room.currentQuestion + 1,
        total: room.questions.length,
        correctIndex,
        players: this.buildResultsPayload(room),
      });
    }

    // Pausa entre perguntas em andamento: envia a contagem regressiva restante
    if (room.pauseDeadline !== null && Date.now() < room.pauseDeadline) {
      const now = Date.now();
      this.store.emitToSocket(socketId, 'quiz:pause', {
        seconds: PAUSE_BETWEEN_QUESTIONS,
        resumeAt: room.pauseDeadline,
        serverTime: now,
      });
    }
  }

  private sendQuestion(room: QuizRoom) {
    const index = room.currentQuestion;
    const question = room.questions[index];
    if (!question) {
      this.finishGame(room);
      return;
    }

    // Prepara o estado dos jogadores para a nova pergunta
    for (const [, player] of room.players) {
      player.respondeu = false;
      player.respostaCorreta = false;
      player.ultimaResposta = null;
    }

    // Reabre a janela de resposta (fechamento por pergunta)
    room.questionClosed = false;
    room.pauseDeadline = null;

    const deadline = Date.now() + QUESTION_TIME * 1000;
    room.questionDeadline = deadline;

    this.store.emitToRoom(room.id, 'quiz:question', {
      ...this.buildQuestionPayload(room),
      deadline,
      canAnswer: true,
    });

    // Cronômetro 100% no servidor
    room.questionTimer = setTimeout(() => {
      if (this.store.hasRoom(room.id)) this.closeQuestion(room);
    }, QUESTION_TIME * 1000);
  }

  /**
   * Monta o payload público da pergunta ATUAL (sem a alternativa correta).
   * O campo `serverTime` é usado pelo cliente para corrigir a diferença
   * de relógio (clock skew) entre o dispositivo e o servidor.
   */
  private buildQuestionPayload(room: QuizRoom) {
    const question = room.questions[room.currentQuestion];
    return {
      index: room.currentQuestion + 1,
      total: room.questions.length,
      enunciado: question.enunciado,
      alternativas: question.alternativas,
      tempo: QUESTION_TIME,
      serverTime: Date.now(),
    };
  }

  /* ──────────────────────────── ENCERRAMENTO DA PERGUNTA ──────────────────────────── */

  private closeQuestion(room: QuizRoom) {
    // Idempotência: o fechamento só pode acontecer UMA vez por pergunta.
    // Isso evita duplicar quiz:results e o pauseTimer quando o cronômetro
    // do servidor e o esgotamento antecipado (allAnswered) coincidem.
    if (room.status !== 'playing') return;
    if (room.questionClosed) return;
    room.questionClosed = true;

    if (room.questionTimer) clearTimeout(room.questionTimer);
    room.questionTimer = null;
    // A janela de resposta terminou: limpa o deadline para que o syncPlayer
    // (reconexão) não reenvie a pergunta já fechada como se estivesse aberta.
    room.questionDeadline = null;

    const correctIndex = room.correctIndexes[room.currentQuestion];

    // Quem não respondeu a tempo conta como erro
    for (const [, player] of room.players) {
      if (!player.respondeu) {
        player.respondeu = true;
        player.erros++;
      }
    }

    const results = this.buildResultsPayload(room);

    this.store.emitToRoom(room.id, 'quiz:results', {
      pergunta: room.currentQuestion + 1,
      total: room.questions.length,
      correctIndex,
      players: results,
    });

    this.emitRanking(room);

    const isLast = room.currentQuestion >= room.questions.length - 1;
    const pauseMs = isLast ? 0 : PAUSE_BETWEEN_QUESTIONS * 1000;

    if (pauseMs > 0) {
      // Sincroniza a contagem regressiva entre perguntas para TODOS os jogadores
      // (resumeAt + serverTime permitem que cada cliente exiba o mesmo tempo,
      // mesmo com relógios diferentes em cada dispositivo).
      const now = Date.now();
      room.pauseDeadline = now + pauseMs;
      this.store.emitToRoom(room.id, 'quiz:pause', {
        seconds: PAUSE_BETWEEN_QUESTIONS,
        resumeAt: now + pauseMs,
        serverTime: now,
      });
    } else {
      room.pauseDeadline = null;
    }

    room.pauseTimer = setTimeout(() => {
      if (!this.store.hasRoom(room.id)) return;

      if (isLast) {
        this.finishGame(room);
      } else {
        room.currentQuestion++;
        this.sendQuestion(room);
      }
    }, pauseMs);
  }

  private lastGain(player: RoomPlayer): number {
    const elapsed = player.tempos[player.tempos.length - 1] ?? 0;
    return this.scoreService.calculatePoints(elapsed);
  }

  /**
   * Monta o payload de resultados da pergunta ATUAL (para quiz:results).
   * Reutilizado pelo closeQuestion e pelo syncPlayer (reconexão durante
   * a pausa, para o jogador que voltou ver o gabarito da pergunta anterior).
   */
  private buildResultsPayload(room: QuizRoom) {
    return [...room.players.values()].map((p) => ({
      userId: p.userId,
      nome: p.nome,
      fotoUrl: p.fotoUrl,
      respondeu: p.ultimaResposta !== null,
      resposta: p.ultimaResposta,
      acertou: p.respostaCorreta,
      pontosGanhos: p.respostaCorreta && p.ultimaResposta !== null ? this.lastGain(p) : 0,
      totalPontos: p.pontos,
    }));
  }

  private emitRanking(room: QuizRoom, socketId?: string) {
    const ranking = [...room.players.values()]
      .sort((a, b) => b.pontos - a.pontos)
      .map((p) => ({
        userId: p.userId,
        nome: p.nome,
        fotoUrl: p.fotoUrl,
        pontos: p.pontos,
        acertos: p.acertos,
        erros: p.erros,
      }));

    if (socketId) {
      this.store.emitToSocket(socketId, 'quiz:rank', ranking);
    } else {
      this.store.emitToRoom(room.id, 'quiz:rank', ranking);
    }
  }

  /* ──────────────────────────── FINAL DA PARTIDA ──────────────────────────── */

  private finishGame(room: QuizRoom) {
    if (room.status === 'finished') return;
    room.status = 'finished';
    this.store.clearTimers(room);

    const total = room.questions.length || 1;

    const avgTime = (p: RoomPlayer) =>
      p.tempos.length ? p.tempos.reduce((s, t) => s + t, 0) / p.tempos.length : Infinity;

    const results = [...room.players.values()]
      .sort((a, b) => b.pontos - a.pontos || avgTime(a) - avgTime(b))
      .map((p, i) => ({
        posicao: i + 1,
        userId: p.userId,
        nome: p.nome,
        fotoUrl: p.fotoUrl,
        pontos: p.pontos,
        acertos: p.acertos,
        erros: p.erros,
        tempoMedioResposta: p.tempos.length
          ? Number((avgTime(p)).toFixed(2))
          : 0,
        percentualAcertos: Number(((p.acertos / total) * 100).toFixed(1)),
        respostas: p.tempos.length,
      }));

    this.store.emitToRoom(room.id, 'quiz:end', {
      categoria: getQuizCategoryName(room.categoria),
      results,
    });

    // Persiste o histórico de cada jogador (não bloqueia o evento).
    // Jogadores que não responderam NENHUMA pergunta (ex.: saíram no início,
    // desconectaram ou entraram no meio da última pergunta) não geram registro.
    // Sem isso, uma partida solo iniciada e abandonada viraria "vitória"
    // (posicao 1) no ranking do Quiz mesmo sem o aluno ter jogado.
    const categoria = room.categoria;
    for (const r of results) {
      if (r.respostas === 0) continue;
      this.quizService
        .saveResult({
          usuarioId: r.userId,
          categoria,
          posicao: r.posicao,
          pontos: r.pontos,
          acertos: r.acertos,
          erros: r.erros,
          tempoMedioResposta: r.tempoMedioResposta,
          percentualAcertos: r.percentualAcertos,
          totalPerguntas: total,
        })
        .catch(() => undefined);
    }

    // Mantém a sala por um tempo para exibição do pódio
    setTimeout(() => {
      if (this.store.hasRoom(room.id)) {
        this.store.destroyRoom(room);
        this.store.emitCategoryUpdate(room.categoria);
      }
    }, ROOM_LIFETIME_MS);
  }
}
