/**
 * ========================================================================
 * UTILITÁRIO DE COOKIE - Sessão httpOnly (JWT)
 * ========================================================================
 *
 * O token JWT passa a viver em um cookie httpOnly (não acessível via JS),
 * reduzindo o impacto de XSS: um script malicioso não consegue ler o token.
 *
 * - httpOnly: true   → invisível para document.cookie / JS
 * - secure: SESSION_COOKIE_SECURE=true → só trafega por HTTPS
 * - sameSite: lax    → evita envio em requisições cross-site (CSRF)
 * ========================================================================
 */

export const SESSION_COOKIE_NAME = 'seadi_session';

// Mesmo prazo do JWT_EXPIRES_IN (12h): o navegador apaga o cookie quando
// o token expirar no servidor.
const TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_MAX_AGE_MS,
  };
}

/**
 * Extrai o valor de um cookie do header `Cookie`.
 * Usado pelo JwtStrategy e pelo QuizGateway (Socket.IO handshake),
 * sem depender de middlewares de parsing de cookie.
 */
export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
