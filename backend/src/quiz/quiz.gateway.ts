/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Gateway Socket.IO
 * ========================================================================
 * 
 * Este arquivo é responsável por toda a comunicação em tempo real do
 * Quiz Multiplayer. Ele autentica a conexão via JWT e traduz os eventos
 * do cliente para os serviços de salas (QuizRoomService) e partidas
 * (QuizMatchService). Mantém apenas a camada de transporte: nenhuma
 * regra de negócio vive aqui.
 * 
 * Eventos recebidos do cliente:
 * - quiz:rooms:subscribe { category }  → assina a lista pública da categoria
 * - quiz:rooms:unsubscribe            → sai da lista pública
 * - quiz:room:create   { category }   → cria sala (usuário vira Host)
 * - quiz:room:join     { roomId }     → entra em uma sala existente
 * - quiz:room:leave                   → sai da sala atual
 * - quiz:room:cancel                  → Host cancela a sala
 * - quiz:room:start                   → Host inicia a partida
 * - quiz:room:kick     { userId }     → Host expulsa um jogador (preparado)
 * - quiz:answer        { index }      → responde a pergunta atual
 * 
 * Eventos enviados ao cliente (emitidos pelos serviços):
 * - quiz:rooms:list      → lista pública de salas da categoria
 * - quiz:room_update     → estado da sala (jogadores, Host, contagem)
 * - quiz:room_cancelled  → sala fechada pelo Host
 * - quiz:room_kicked     → jogador expulso
 * - quiz:host_changed    → troca de Host com mensagem
 * - quiz:start           → partida iniciada
 * - quiz:question        → nova pergunta (enunciado + alternativas)
 * - quiz:answer_ack      → resultado individual da resposta
 * - quiz:results         → resultado da pergunta para todos
 * - quiz:rank            → ranking em tempo real
 * - quiz:end             → pódio final da partida
 * - quiz:error           → mensagem de erro
 * 
 * Segurança:
 * - Conexão exige JWT válido no cookie httpOnly de sessão (seadi_session).
 * - O gateway NÃO valida respostas nem calcula pontos; isso acontece
 *   exclusivamente nos serviços (servidor).
 * - A alternativa correta nunca é enviada ao cliente antes do fim da pergunta.
 * - Ações de Host (start/cancel/kick) são validadas no serviço pelo hostId.
 * ========================================================================
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { readCookie, SESSION_COOKIE_NAME } from '../auth/cookie';
import { QuizRoomService } from './quiz-room.service';
import { QuizMatchService } from './quiz-match.service';
import { QuizRoomStore } from './quiz-room.store';

interface JwtPayload {
  sub: number;
  email: string;
  ver?: number;
}

// Origens permitidas no handshake WebSocket, mesmas do CORS HTTP.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  namespace: '/quiz',
  cors: { origin: allowedOrigins, credentials: true },
})
export class QuizGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private store: QuizRoomStore,
    private roomService: QuizRoomService,
    private matchService: QuizMatchService,
  ) {}

  afterInit(server: Server) {
    this.store.setServer(server);
  }

  /**
   * Autentica a conexão. Sem token JWT válido, o socket é desconectado.
   * Tokens revogados (ver < tokenVersion) também são rejeitados.
   */
  async handleConnection(client: Socket) {
    // O token vem no cookie httpOnly de sessão, enviado automaticamente
    // pelo navegador no handshake (mesmo domínio).
    const token = readCookie(client.handshake?.headers?.cookie, SESSION_COOKIE_NAME);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      // Valida a versão do token contra o banco (logout/troca de senha invalidam).
      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        select: { id: true, tokenVersion: true },
      });
      if (!user || payload.ver === undefined || payload.ver !== user.tokenVersion) {
        client.disconnect(true);
        return;
      }

      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.roomService.disconnect(client.id);
  }

  /**
   * Mantém o socket apenas nos socket rooms de salas atuais.
   * Remove de qualquer sala antiga (id de 8 caracteres) e opcionalmente
   * entra na sala atual. Os rooms "quiz-rooms:<categoria>" são preservados.
   */
  private syncSocketRooms(client: Socket, currentRoomId?: string) {
    for (const room of client.rooms) {
      if (room === client.id) continue;
      if (room.startsWith('quiz-rooms:')) continue;
      client.leave(room);
    }
    if (currentRoomId) client.join(currentRoomId);
  }

  /* ──────────────────────────── LISTA DE SALAS ──────────────────────────── */

  /**
   * Assina a lista pública de salas de uma categoria.
   * O socket passa a receber quiz:rooms:list a cada mudança.
   */
  @SubscribeMessage('quiz:rooms:subscribe')
  onRoomsSubscribe(client: Socket, payload: { category?: string }) {
    const userId = client.data?.userId;
    if (!userId) return;

    const category = payload?.category;
    if (!category) return;

    // Sai da categoria anterior (se houver)
    const prev = client.data.roomCategory as string | undefined;
    if (prev && prev !== category) {
      client.leave(`quiz-rooms:${prev}`);
    }

    client.data.roomCategory = category;
    client.join(`quiz-rooms:${category}`);
    client.emit('quiz:rooms:list', this.roomService.listRooms(category));
  }

  /**
   * Sai da lista pública (ex.: ao entrar em uma sala).
   */
  @SubscribeMessage('quiz:rooms:unsubscribe')
  onRoomsUnsubscribe(client: Socket) {
    const category = client.data?.roomCategory as string | undefined;
    if (category) {
      client.leave(`quiz-rooms:${category}`);
      client.data.roomCategory = null;
    }
  }

  /* ──────────────────────────── CRIAÇÃO / ENTRADA ──────────────────────────── */

  /**
   * Cria uma nova sala. O usuário que criou passa a ser o Host.
   */
  @SubscribeMessage('quiz:room:create')
  async onCreate(client: Socket, payload: { category?: string }) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      const result = await this.roomService.createRoom(
        userId,
        payload?.category,
        client.id,
      );

      if (result.error || !result.roomId) {
        client.emit('quiz:error', { message: result.error || 'Não foi possível criar a sala.' });
        return;
      }

      // Sai de salas antigas e entra na nova (room sockets sincronizados)
      this.syncSocketRooms(client, result.roomId);

      // O room_update emitido pelo serviço acontece ANTES deste join,
      // então o criador ainda não receberia o estado. Enviamos direto.
      const state = this.roomService.getRoomState(result.roomId);
      if (state) client.emit('quiz:room_update', state);
    } catch {
      client.emit('quiz:error', { message: 'Não foi possível criar a sala.' });
    }
  }

  /**
   * Entra em uma sala pública existente (ou reconecta em uma partida).
   */
  @SubscribeMessage('quiz:room:join')
  async onJoin(client: Socket, payload: { roomId?: string }) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      const result = await this.roomService.joinRoom(
        userId,
        payload?.roomId,
        client.id,
      );

      if (result.error || !result.roomId) {
        client.emit('quiz:error', { message: result.error || 'Não foi possível entrar na sala.' });
        return;
      }

      this.syncSocketRooms(client, result.roomId);

      const state = this.roomService.getRoomState(result.roomId);
      if (state) client.emit('quiz:room_update', state);

      // Partida já em andamento (reconexão ou entrada no meio):
      // envia o estado atual da partida para este socket.
      if (result.midMatch) {
        this.matchService.syncPlayer(result.roomId, client.id);
      }
    } catch {
      client.emit('quiz:error', { message: 'Não foi possível entrar na sala.' });
    }
  }

  /* ──────────────────────────── SAÍDA / AÇÕES DO HOST ──────────────────────────── */

  /**
   * Sai da sala atual.
   */
  @SubscribeMessage('quiz:room:leave')
  onLeave(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.roomService.leave(userId);
      this.syncSocketRooms(client);
    }
  }

  /**
   * Cancela (fecha) a sala. Somente o Host pode cancelar.
   */
  @SubscribeMessage('quiz:room:cancel')
  onCancel(client: Socket) {
    const userId = client.data?.userId;
    if (userId) this.roomService.cancelRoom(userId);
  }

  /**
   * Inicia a partida. Somente o Host pode iniciar.
   */
  @SubscribeMessage('quiz:room:start')
  onStart(client: Socket) {
    const userId = client.data?.userId;
    if (userId) this.matchService.startMatch(userId);
  }

  /**
   * Expulsa um jogador da sala (somente Host). Funcionalidade preparada
   * para o futuro — já existe no backend, ainda sem botão na interface.
   */
  @SubscribeMessage('quiz:room:kick')
  onKick(client: Socket, payload: { userId?: number }) {
    const userId = client.data?.userId;
    const target = payload?.userId;
    if (!userId || !target) return;
    this.roomService.kickPlayer(userId, Number(target));
  }

  /* ──────────────────────────── PARTIDA ──────────────────────────── */

  /**
   * Responde a pergunta atual. Toda a validação acontece no servidor:
   * participação na partida, socket registrado, uma resposta por pergunta,
   * janela de tempo e confirmação de que a pergunta é a ATUAL.
   */
  @SubscribeMessage('quiz:answer')
  onAnswer(client: Socket, payload: { index?: number; questionIndex?: number }) {
    const userId = client.data?.userId;
    if (!userId) return;

    const index = Number(payload?.index);
    const questionIndex = Number(payload?.questionIndex);
    if (!Number.isInteger(index)) return;

    const result = this.matchService.answer(userId, client.id, index, questionIndex);
    if (!result) return;

    client.emit('quiz:answer_ack', result);
  }
}
