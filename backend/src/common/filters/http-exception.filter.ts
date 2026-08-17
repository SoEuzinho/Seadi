/**
 * ========================================================================
 * FILTRO GLOBAL DE EXCEÇÕES - SEADI Backend
 * ========================================================================
 *
 * Garante que nenhum detalhe interno (stack trace, caminhos do servidor,
 * erros SQL/Prisma) vaze para o cliente em produção.
 *
 * Comportamento:
 * - HttpException (ex.: BadRequest, Unauthorized): retorna status + mensagem.
 * - Erros inesperados (Prisma, banco, etc.): loga o detalhe no servidor
 *   e retorna "Ocorreu um erro. Tente novamente." com status 500.
 * ========================================================================
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Erro HTTP conhecido: preserva status e mensagem (nunca expõe stack)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'string' ? { message: body } : body);
      return;
    }

    // Erro inesperado: loga internamente, resposta genérica para o cliente
    console.error('[Erro inesperado]', exception instanceof Error ? exception.stack : exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Ocorreu um erro. Tente novamente.',
      statusCode: 500,
    });
  }
}
