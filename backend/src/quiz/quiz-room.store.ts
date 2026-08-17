/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Armazenamento das Salas (em memória)
 * ========================================================================
 * 
 * Este serviço centraliza a persistência VOLÁTIL das salas públicas.
 * As salas são entidades transitórias em tempo real: nascem, recebem
 * jogadores, acontecem e são destruídas em minutos. Por isso são mantidas
 * em memória (como o sistema original), com a interface isolada em um
 * único lugar para que, no futuro, possa ser trocada por persistência em
 * banco (salas privadas, senhas, torneios) sem afetar os serviços.
 * 
 * Responsabilidades:
 * - Manter o Map de salas e o Map jogador → sala
 * - Criar e destruir salas
 * - Montar os payloads (lista pública e estado interno)
 * - Emitir eventos via Socket.IO (referência do servidor)
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  MAX_PLAYERS,
  RoomListItem,
  RoomPayload,
  RoomPlayer,
  QuizRoom,
} from './quiz.types';

export interface PlayerEntry {
  userId: number;
  socketId: string;
  nome: string;
  fotoUrl: string | null;
}

@Injectable()
export class QuizRoomStore {
  private server: Server | null = null;
  private rooms = new Map<string, QuizRoom>();
  private playerRoom = new Map<number, string>();

  /** Recebe a referência do servidor Socket.IO (chamado pelo gateway). */
  setServer(server: Server) {
    this.server = server;
  }

  get isReady(): boolean {
    return !!this.server;
  }

  /* ──────────────────────────── ACESSO ──────────────────────────── */

  allRooms(): QuizRoom[] {
    return [...this.rooms.values()];
  }

  getRoom(roomId: string): QuizRoom | null {
    return this.rooms.get(roomId) || null;
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  findRoomForPlayer(userId: number): QuizRoom | null {
    const roomId = this.playerRoom.get(userId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * Localiza a sala e o jogador associados a um socket.
   * Retorna null se o socket não pertence a nenhuma sala.
   */
  findRoomPlayerBySocket(socketId: string): { room: QuizRoom; player: RoomPlayer } | null {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { room, player };
        }
      }
    }
    return null;
  }

  setPlayerRoom(userId: number, roomId: string) {
    this.playerRoom.set(userId, roomId);
  }

  unsetPlayerRoom(userId: number) {
    this.playerRoom.delete(userId);
  }

  /* ──────────────────────────── CICLO DE VIDA ──────────────────────────── */

  createRoom(categoria: string, hostId: number, hostNome: string): QuizRoom {
    const id = Math.random().toString(36).slice(2, 10);
    const room: QuizRoom = {
      id,
      nome: `Sala do ${hostNome}`,
      categoria,
      maxPlayers: MAX_PLAYERS,
      status: 'waiting',
      hostId,
      players: new Map(),
      questions: [],
      correctIndexes: [],
      currentQuestion: 0,
      questionDeadline: null,
      questionTimer: null,
      pauseTimer: null,
      pauseDeadline: null,
      questionClosed: false,
      createdAt: Date.now(),
      startedAt: null,
    };
    this.rooms.set(id, room);
    return room;
  }

  destroyRoom(room: QuizRoom) {
    this.clearTimers(room);
    this.rooms.delete(room.id);
  }

  addPlayer(room: QuizRoom, entry: PlayerEntry): RoomPlayer {
    const player: RoomPlayer = {
      userId: entry.userId,
      socketId: entry.socketId,
      nome: entry.nome,
      fotoUrl: entry.fotoUrl,
      connected: true,
      joinedAt: Date.now(),
      pontos: 0,
      acertos: 0,
      erros: 0,
      tempos: [],
      respondeu: false,
      respostaCorreta: false,
      ultimaResposta: null,
    };
    room.players.set(player.userId, player);
    return player;
  }

  /**
   * Transfere o Host para outro jogador e renomeia a sala
   * (o nome público acompanha o Host: "Sala do João").
   */
  setHost(room: QuizRoom, userId: number, nome: string) {
    room.hostId = userId;
    room.nome = `Sala do ${nome}`;
  }

  /** Retorna o jogador conectado há mais tempo (candidato a novo Host). */
  oldestPlayer(room: QuizRoom): RoomPlayer | null {
    let oldest: RoomPlayer | null = null;
    for (const player of room.players.values()) {
      if (!oldest || player.joinedAt < oldest.joinedAt) oldest = player;
    }
    return oldest;
  }

  clearTimers(room: QuizRoom) {
    if (room.questionTimer) clearTimeout(room.questionTimer);
    if (room.pauseTimer) clearTimeout(room.pauseTimer);
    room.questionTimer = null;
    room.pauseTimer = null;
  }

  /* ──────────────────────────── PAYLOADS ──────────────────────────── */

  roomListItem(room: QuizRoom): RoomListItem {
    const host = room.players.get(room.hostId);
    // Jogadores desconectados (queda durante a partida) permanecem na sala
    // para reconexão, mas não devem inflar a contagem exibida na lista pública.
    const playersCount = [...room.players.values()].filter((p) => p.connected).length;
    return {
      roomId: room.id,
      nome: room.nome,
      categoria: room.categoria,
      hostId: room.hostId,
      hostName: host?.nome || '',
      playersCount,
      maxPlayers: room.maxPlayers,
      status: room.status,
    };
  }

  roomPayload(room: QuizRoom): RoomPayload {
    // Conta e lista apenas os jogadores conectados: quem caiu da partida
    // fica na sala (reconexão), mas não deve aparecer como presente.
    const players = [...room.players.values()]
      .filter((p) => p.connected)
      .map((p) => ({
        userId: p.userId,
        nome: p.nome,
        fotoUrl: p.fotoUrl,
        isHost: p.userId === room.hostId,
      }));

    return {
      roomId: room.id,
      nome: room.nome,
      status: room.status,
      categoria: room.categoria,
      hostId: room.hostId,
      playersCount: players.length,
      maxPlayers: room.maxPlayers,
      players,
    };
  }

  /**
   * Lista pública da categoria: salas AGUARDANDO (podem ser criadas/entradas
   * normalmente) e salas EM ANDAMENTO (entrada de "observador/retardatário":
   * entra com 0 pontos a partir da próxima pergunta). Salas encerradas não
   * aparecem.
   */
  listRooms(category: string): RoomListItem[] {
    return this.allRooms()
      .filter(
        (r) =>
          r.categoria === category &&
          (r.status === 'waiting' || r.status === 'playing'),
      )
      .map((r) => this.roomListItem(r));
  }

  /* ──────────────────────────── EMISSÃO ──────────────────────────── */

  emitToRoom(roomId: string, event: string, data: unknown) {
    this.server?.to(roomId).emit(event, data);
  }

  /** Emite um evento para um único socket (reconexão/entrada no meio da partida). */
  emitToSocket(socketId: string, event: string, data: unknown) {
    this.server?.to(socketId).emit(event, data);
  }

  emitRoomUpdate(room: QuizRoom) {
    this.emitToRoom(room.id, 'quiz:room_update', this.roomPayload(room));
  }

  /**
   * Notifica todos os assinantes da lista pública de uma categoria
   * que algo mudou (criação, saída, início, exclusão).
   */
  emitCategoryUpdate(category: string) {
    this.server
      ?.to(`quiz-rooms:${category}`)
      .emit('quiz:rooms:list', {
        category,
        rooms: this.listRooms(category),
      });
  }
}
