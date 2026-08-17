/**
 * ========================================================================
 * QUIZ MULTIPLAYER - Serviço de Pontuação
 * ========================================================================
 * 
 * A pontuação é SEMPRE calculada no servidor. O cliente apenas envia
 * a alternativa escolhida; nunca informa o tempo ou os pontos.
 * 
 * Regra de pontuação:
 * - Responder corretamente: quanto mais rápido, mais pontos.
 * - Responder errado ou não responder: 0 pontos.
 * 
 * A fórmula usa o tempo restante da pergunta elevado a uma potência,
 * criando uma curva decrescente: respostas rápidas valem quase 100
 * pontos, enquanto respostas no limite valem bem menos.
 * 
 * Exemplos (pergunta de 20 segundos):
 * - 0s  → 100 pontos
 * - 2s  → ~94 pontos
 * - 5s  → ~84 pontos
 * - 10s → ~66 pontos
 * - 15s → ~44 pontos
 * - 20s → 0 pontos
 * ========================================================================
 */

import { Injectable } from '@nestjs/common';
import { QUESTION_TIME } from './quiz.types';

const MAX_POINTS = 100;
const MIN_POINTS = 0;

@Injectable()
export class QuizScoreService {
  /**
   * Calcula os pontos de uma resposta correta.
   *
   * @param elapsedSeconds - Tempo gasto para responder (em segundos)
   * @param questionTime - Tempo total da pergunta (padrão: 20s)
   * @returns Pontuação entre MIN_POINTS e MAX_POINTS
   */
  calculatePoints(elapsedSeconds: number, questionTime: number = QUESTION_TIME): number {
    const elapsed = Math.max(0, Math.min(elapsedSeconds, questionTime));
    if (elapsed >= questionTime) return MIN_POINTS;

    const remaining = questionTime - elapsed;
    const progress = remaining / questionTime;

    return Math.round(MAX_POINTS * Math.pow(progress, 0.6));
  }
}
