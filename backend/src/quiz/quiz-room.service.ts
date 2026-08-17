/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Serviço de Salas Públicas (Lobby)
 * ========================================================================
 * 
 * Este serviço gerencia o ciclo de vida das SALAS públicas (a espera
 * antes da partida). Substitui o pareamento automático antigo por um
 * sistema de salas com Host, nos moldes de jogos multiplayer (CS,
 * Minecraft, L4D, Among Us).
 * 
 * Responsabilidades:
 * - Criar sala (o criador vira Host)
 * - Entrar / sair de uma sala
 * - Transferir o Host quando ele sai (jogador mais antigo)
 * - Cancelar sala (somente Host) e expulsar jogador (somente Host)
 * - Publicar a lista de salas em tempo real via Socket.IO
 * 
 * A partida em si é gerenciada pelo QuizMatchService. Quando o Host
 * pede para iniciar, este serviço delega ao match service.
 * 
 * Segurança:
 * - Ações de Host (iniciar, cancelar, expulsar) exigem ser o hostId.
 * - O cliente nunca decide nada: apenas envia a intenção.
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizRoomStore } from './quiz-room.store';
import {
  isQuizCategory,
  JoinResult,
  QuizRoom,
  RoomListItem,
} from './quiz.types';

@Injectable()
export class QuizRoomService {
  constructor(
    private store: QuizRoomStore,
    private quizService: QuizService,
  ) {}

  /**
   * Cria uma nova sala pública. O usuário que criou passa a ser o Host
   * e já entra na sala automaticamente.
   */
  async createRoom(
    userId: number,
    category: string | undefined,
    socketId: string,
  ): Promise<JoinResult> {
    if (!this.store.isReady) return { error: 'Serviço indisponível' };
    if (!category || !isQuizCategory(category)) {
      return { error: 'Categoria inválida' };
    }

    // Sai de qualquer sala anterior antes de criar (evita duplicidade)
    this.leave(userId);

    const { nome, fotoUrl } = await this.quizService.getUserInfo(userId);
    const room = this.store.createRoom(category, userId, nome);
    this.store.addPlayer(room, { userId, socketId, nome, fotoUrl });
    this.store.setPlayerRoom(userId, room.id);

    this.store.emitRoomUpdate(room);
    this.store.emitCategoryUpdate(category);

    return { roomId: room.id };
  }

  /**
   * Entra em uma sala pública existente. O usuário NÃO vira Host ao
   * entrar.
   *
   * A entrada é permitida em dois momentos:
   * - waiting: aguarda o Host iniciar a partida (fluxo normal);
   * - playing: entra na partida JÁ em andamento. O jogador começa com
   *   0 pontos, não responde a pergunta já aberta e passa a valer a
   *   partir da próxima pergunta. Tudo controlado pelo servidor.
   *
   * A reentrada (mesmo usuário reconectando ou em outra aba) atualiza
   * o socket associado, restaurando uma possível reconexão de partida.
   */
  async joinRoom(
    userId: number,
    roomId: string | undefined,
    socketId: string,
  ): Promise<JoinResult> {
    if (!this.store.isReady) return { error: 'Serviço indisponível' };
    if (!roomId) return { error: 'Sala não informada.' };

    const room = this.store.getRoom(roomId);
    if (!room) return { error: 'Sala não encontrada ou já encerrada.' };
    if (room.status !== 'waiting' && room.status !== 'playing') {
      return { error: 'Esta sala já não aceita novos jogadores.' };
    }

    if (room.players.size >= room.maxPlayers) {
      return { error: 'A sala está cheia.' };
    }

    // Reentrada (ex.: reconexão ou mesma conta em outra aba): atualiza o socket
    const existing = room.players.get(userId);
    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      this.store.setPlayerRoom(userId, room.id);
      this.store.emitRoomUpdate(room);
      this.store.emitCategoryUpdate(room.categoria);
      return { roomId: room.id, midMatch: room.status === 'playing' };
    }

    this.leave(userId);

    const { nome, fotoUrl } = await this.quizService.getUserInfo(userId);
    const player = this.store.addPlayer(room, { userId, socketId, nome, fotoUrl });
    this.store.setPlayerRoom(userId, room.id);

    // Entrou em uma partida em andamento: começa com 0 pontos e NÃO
    // pode responder a pergunta que já está aberta. O reset de respondeu
    // na próxima pergunta o libera naturalmente para jogar dali em diante.
    const midMatch = room.status === 'playing';
    if (midMatch && room.questions.length > 0) {
      player.respondeu = true;
      player.ultimaResposta = null;
    }

    this.store.emitRoomUpdate(room);
    this.store.emitCategoryUpdate(room.categoria);

    return { roomId: room.id, midMatch };
  }

  /**
   * Lista as salas abertas de uma categoria (para a tela de lista).
   */
  listRooms(category: string): { category: string; rooms: RoomListItem[] } {
    return { category, rooms: this.store.listRooms(category) };
  }

  /**
   * Retorna o estado atual de uma sala (envio direto para quem acabou
   * de entrar e ainda não pertence ao socket room da sala).
   */
  getRoomState(roomId: string) {
    const room = this.store.getRoom(roomId);
    return room ? this.store.roomPayload(room) : null;
  }

  /**
   * Sai da sala atual do jogador (voluntariamente).
   */
  leave(userId: number) {
    const room = this.store.findRoomForPlayer(userId);
    if (!room) return;
    this.removePlayer(room, userId);
  }

  /**
   * Remove o jogador quando a conexão do socket é encerrada.
   *
   * - waiting:  remove o jogador da sala (sala de espera não guarda fantasmas);
   * - playing:  mantém o jogador na partida (pontos preservados) e o marca
   *   como desconectado, permitindo que ele RECONECTE e retome de onde parou.
   *   O socket antigo deixa de ser válido para responder.
   * - finished: remove (o resultado já foi emitido e persistido).
   */
  disconnect(socketId: string) {
    const found = this.store.findRoomPlayerBySocket(socketId);
    if (!found) return;
    const { room, player } = found;

    if (room.status === 'playing') {
      player.connected = false;
      player.socketId = '';
      this.store.unsetPlayerRoom(player.userId);
      this.store.emitRoomUpdate(room);
      return;
    }

    this.removePlayer(room, player.userId);
  }

  /**
   * Cancela (fecha) uma sala. Somente o Host pode cancelar.
   * Todos os membros são avisados e a sala é destruída.
   */
  cancelRoom(userId: number) {
    const room = this.store.findRoomForPlayer(userId);
    if (!room || room.status !== 'waiting') return;
    if (room.hostId !== userId) return;

    this.store.emitToRoom(room.id, 'quiz:room_cancelled', {
      message: 'A sala foi cancelada pelo Host.',
    });

    for (const [, player] of room.players) {
      this.store.unsetPlayerRoom(player.userId);
    }
    this.store.destroyRoom(room);
    this.store.emitCategoryUpdate(room.categoria);
  }

  /**
   * Expulsa um jogador da sala. Somente o Host pode expulsar.
   * (Funcionalidade preparada para o futuro — ainda sem botão na UI.)
   */
  kickPlayer(hostUserId: number, targetUserId: number) {
    const room = this.store.findRoomForPlayer(hostUserId);
    if (!room || room.status !== 'waiting') return;
    if (room.hostId !== hostUserId) return;

    const target = room.players.get(targetUserId);
    if (!target || targetUserId === hostUserId) return;

    this.store.unsetPlayerRoom(targetUserId);
    room.players.delete(targetUserId);

    this.store.emitToRoom(room.id, 'quiz:room_kicked', {
      userId: targetUserId,
      message: `${target.nome} foi removido da sala.`,
    });
    this.store.emitRoomUpdate(room);
    this.store.emitCategoryUpdate(room.categoria);
  }

  /* ──────────────────────────── INTERNO ──────────────────────────── */

  private removePlayer(room: QuizRoom, userId: number) {
    const wasHost = room.hostId === userId;

    room.players.delete(userId);
    this.store.unsetPlayerRoom(userId);

    // Último jogador saiu: a sala deixa de existir
    if (room.players.size === 0) {
      this.store.destroyRoom(room);
      this.store.emitCategoryUpdate(room.categoria);
      return;
    }

    // O Host saiu antes de iniciar: transfere para o jogador mais antigo
    if (room.status === 'waiting' && wasHost) {
      const newHost = this.store.oldestPlayer(room);
      if (newHost) {
        this.store.setHost(room, newHost.userId, newHost.nome);
        this.store.emitRoomUpdate(room);
        this.store.emitToRoom(room.id, 'quiz:host_changed', {
          message: `O Host saiu. ${newHost.nome} agora é a nova Host.`,
          newHostId: newHost.userId,
          newHostName: newHost.nome,
        });
      }
    } else {
      this.store.emitRoomUpdate(room);
    }

    this.store.emitCategoryUpdate(room.categoria);
  }
}
