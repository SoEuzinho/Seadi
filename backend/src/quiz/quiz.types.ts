/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Tipos e Constantes
 * ========================================================================
 * 
 * Este arquivo centraliza os tipos e as constantes de configuração do
 * Quiz Multiplayer. Manter essas informações em um único lugar evita
 * códigos duplicados e facilita futuras expansões (salas privadas,
 * torneios, sistema de recompensas, etc.).
 * 
 * Configurações atuais:
 * - MAX_PLAYERS: quantidade máxima de jogadores por sala
 * - QUESTION_TIME: tempo (em segundos) de cada pergunta
 * - QUESTIONS_COUNT: quantidade de perguntas por partida
 * - PAUSE_BETWEEN_QUESTIONS: intervalo entre uma pergunta e outra
 * 
 * Categorias:
 * As categorias representam os temas disponíveis para criação de partida.
 * A categoria "misto" sortea perguntas de todas as outras categorias.
 * ========================================================================
 */

export const MAX_PLAYERS = 100;
export const QUESTION_TIME = 20;
export const QUESTIONS_COUNT = 15;
export const PAUSE_BETWEEN_QUESTIONS = 4;
export const ROOM_LIFETIME_MS = 2 * 60 * 1000;

export const QUIZ_CATEGORIES = [
  {
    id: 'iniciante',
    nome: 'Iniciante',
    icone: '🖥️',
    descricao:
      'Ligar e desligar o computador, mouse, teclado, Windows, área de trabalho, abrir programas, internet básica, Wi-Fi e janelas',
  },
  {
    id: 'basico',
    nome: 'Básico',
    icone: '🌐',
    descricao:
      'Google e navegação, pesquisas, digitação, acentuação, arquivos, downloads, e-mail, comunicação online e aplicativos úteis',
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    icone: '🚀',
    descricao:
      'Organização digital, atualizações, segurança básica, teclas de atalho, pen drive e solução de problemas',
  },
  {
    id: 'programador',
    nome: 'Programador',
    icone: '💻',
    descricao:
      'HTML, CSS, JavaScript, banco de dados e lógica de programação — conteúdo extra para quem quer ir além dos módulos',
  },
  { id: 'misto', nome: 'Misto', icone: '🎲', descricao: 'Perguntas sorteadas de todos os módulos' },
];

export type QuizCategoryId =
  | 'iniciante'
  | 'basico'
  | 'avancado'
  | 'programador'
  | 'misto';

export function isQuizCategory(value: string): value is QuizCategoryId {
  return QUIZ_CATEGORIES.some((c) => c.id === value);
}

export function getQuizCategoryName(id: string): string {
  const found = QUIZ_CATEGORIES.find((c) => c.id === id);
  return found ? found.nome : 'Misto';
}

/**
 * Status de uma sala:
 * - waiting:  aguardando jogadores (aparece na lista pública)
 * - playing:  partida em andamento (não aceita novos jogadores)
 * - finished: partida encerrada (aguardando exibição do pódio)
 */
export type RoomStatus = 'waiting' | 'playing' | 'finished';

/**
 * Jogador dentro de uma sala.
 * Toda a lógica de pontos/acertos/erros vive no servidor.
 */
export interface RoomPlayer {
  userId: number;
  socketId: string;
  nome: string;
  fotoUrl: string | null;
  connected: boolean;
  /** Timestamp de entrada — usado para escolher o novo Host (o mais antigo). */
  joinedAt: number;
  pontos: number;
  acertos: number;
  erros: number;
  /** Tempos de resposta (em segundos) por pergunta respondida. */
  tempos: number[];
  /** Controle anti-trapaça: só é permitido responder uma vez por pergunta. */
  respondeu: boolean;
  respostaCorreta: boolean;
  ultimaResposta: number | null;
}

/**
 * Pergunta interna da partida (sem a alternativa correta).
 * O campo `tempo` é adicionado apenas no payload enviado ao cliente.
 */
export interface QuizQuestion {
  id: number;
  enunciado: string;
  alternativas: string[];
}

export interface QuizRoom {
  id: string;
  /** Nome público da sala (segue o nome do Host). */
  nome: string;
  categoria: string;
  maxPlayers: number;
  status: RoomStatus;
  hostId: number;
  players: Map<number, RoomPlayer>;
  questions: QuizQuestion[];
  /** Índices corretos das perguntas — mantidos APENAS no servidor. */
  correctIndexes: number[];
  currentQuestion: number;
  questionDeadline: number | null;
  questionTimer: NodeJS.Timeout | null;
  pauseTimer: NodeJS.Timeout | null;
  /** Timestamp em que termina a pausa entre perguntas (null fora da pausa). */
  pauseDeadline: number | null;
  /** Garante que closeQuestion rode uma única vez por pergunta (anti-duplicação). */
  questionClosed: boolean;
  createdAt: number;
  startedAt: number | null;
}

export interface JoinResult {
  roomId?: string;
  error?: string;
  /** true quando a entrada aconteceu em uma partida JÁ em andamento. */
  midMatch?: boolean;
}

/**
 * Item exibido na lista pública de salas de uma categoria.
 */
export interface RoomListItem {
  roomId: string;
  nome: string;
  categoria: string;
  hostId: number;
  hostName: string;
  playersCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

/**
 * Estado completo de uma sala, enviado aos membros via quiz:room_update.
 */
export interface RoomPayload {
  roomId: string;
  nome: string;
  status: RoomStatus;
  categoria: string;
  hostId: number;
  playersCount: number;
  maxPlayers: number;
  players: {
    userId: number;
    nome: string;
    fotoUrl: string | null;
    isHost: boolean;
  }[];
}
