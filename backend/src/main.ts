/**
 * ========================================================================
 * PONTO DE ENTRADA DA APLICAÇÃO - SEADI Backend
 * ========================================================================
 * 
 * Este arquivo é o responsável por inicializar o servidor NestJS.
 * O SEADI é uma plataforma de aprendizagem de inclusão digital do SENAC.
 * 
 * Funcionalidades principais configuradas aqui:
 * - Servidor HTTP com suporte a CORS
 * - Validação global de dados de entrada
 * - Prefixo global '/api' para todas as rotas
 * - Servição de arquivos estáticos (frontend e uploads)
 * - Redirecionamento da raiz para o login
 * 
 * Porta padrão: 5000 (configurável via variável de ambiente PORT)
 * ========================================================================
 */

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

/**
 * Função de bootstrap - Inicializa a aplicação NestJS.
 * 
 * Esta função é chamada quando o servidor inicia e é responsável por:
 * 1. Criar a instância da aplicação NestJS
 * 2. Configurar CORS (Cross-Origin Resource Sharing)
 * 3. Aplicar validação global de DTOs
 * 4. Configurar prefixo '/api' para todas as rotas
 * 5. Servir arquivos estáticos do frontend e uploads
 * 6. Iniciar o servidor na porta configurada
 */
async function bootstrap() {
  // Cria a aplicação NestJS usando o módulo raiz (AppModule)
  // NestExpressApplication fornece acesso às APIs do Express para configurações avançadas
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * Headers de segurança básicos (substitui Helmet sem dependência extra):
   * - X-Content-Type-Options: nosniff -> impede MIME sniffing do navegador
   * - X-Frame-Options: DENY -> bloqueia o app em iframes (clickjacking)
   * - Referrer-Policy: strict-origin-when-cross-origin -> reduz vazamento de URL
   */
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-hashes' " +
        "'sha256-nQ4ex69xBfyuoCceT0FXiPuXOiWDkG7jsInlCtuyJLs=' " +
        "'sha256-LIheEo1mempiJY0MABVMS2AjaTnCP8dCSGGA4tWl8bw=' " +
        "'sha256-074KJ5QNQ+vqiMp7U79H9WU32BS/CjYuU1SPdkQNNY8=' " +
        "'sha256-FXxShxsy80jmqUE5ldm6jmARrhZK/edBRQ1eUwYPChg=' " +
        "'sha256-YqbqJUyni94uB4xZ2xcTAQVFctSa6pLoOJKBKhevMR4=' " +
        "'sha256-4CVFmbizwrey7YlxmWEsJ5YDSTBwZxoiCHiEWkAjzHY=' " +
        "'sha256-gaHQwfsRljbDRUs0MDSHwtJ/ixf05BQFJ17Wl6Ud8Mw=' " +
        "'sha256-eYAqOBFE/ygoX0rfjQW80Wc6ELLB3EYQddb3b6gr/z4=' " +
        "'sha256-8ZF09fZvhB/F7BO6dSYuQooEW2jMXQ4fWoL+s3u6jp4=' " +
        "'sha256-s8vk7TlmSYSiK4gd6RC7uzngqMBiC72K43YqDwhTU5c=' " +
        "'sha256-mxqgBLcP6wgRQOjHETJ0fhNDwEJ8u2VVjo+ZlAWFeMg=' " +
        "'sha256-13va6Wt0M9xcCeZj+iSzwa96/cv1v4hn4xOgrUi26mE=' " +
        "'sha256-Ys5JGUY93XTeQbgkP1j76DZFo6ZzrFNNUQhn0Vwc3zA=' " +
        "'sha256-Jo9zlOOk8PpD0J+fGfpwA2UckWHXM+9dALh6t7F7AYc=' " +
        "'sha256-C/J98E8X5RzjTpOmM62lxEkDDegta7ppF1UMDja51jg=' " +
        "'sha256-2rvfFrggTCtyF5WOiTri1gDS8Boibj4Njn0e+VCBmDI=' " +
        "'sha256-C6hnHoUdzsGjTXtqLR+zhHxfeytlfhxcwzz0+dzD9f0=' " +
        "'sha256-W4Q3yqtBqSbDYOdcWlyA7WlMn/C6gaIFhYqN58L5fn4=' " +
        "'sha256-mn0OsfzX83rGwaVxFIlZuHRWQPrhX7e/W8EXOsUPNY4=' " +
        "'sha256-DBlmv0RsMFB2llwZWLIgb7uNoU5ZNL6L8BzTiXODxV8=' " +
        "'sha256-Qij8PtRrqGdrThh7PW+6FKj5D7rlYowqUnWXyAqH4wI=' " +
        "'sha256-YduG/q2ePjl7WLvIpF+RRDqIj/kKcOrcMwhv0qZz3uc=' " +
        "'sha256-NB+bL5dulVU51Bwa/2GMM7pxrva9oofY/7LQiSoBE8c=' " +
        "'sha256-zYo5okPjNSf+TchIAtTXYlVTlaj63PKYdYBcsC67h5I=' " +
        "'sha256-4idOpfcVGcf1JIcDr6s5pmLauAMO9auB0wLw0b1hd9Y=' " +
        "'sha256-UZ7H57pj92ihlUrlbzLdN8PSkHZ2g9b2itb2Y9stPJA=' " +
        "'sha256-JlxlxjbD1+WXcxlG+KqArDvp2XDKXd0pjeq0erZDvR8=' " +
        "https://cdn.jsdelivr.net https://cdn.socket.io https://static.cloudflareinsights.com https://www.youtube.com https://s.ytimg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https://www.w3schools.com https://i.ytimg.com; " +
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com; " +
      "connect-src 'self' ws: wss: https://cloudflareinsights.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'");
    next();
  });

  /**
   * Configuração de CORS (Cross-Origin Resource Sharing)
   * Permite que o frontend acesse a API de diferentes domínios/origens
   * Exemplo: http://localhost:5000 pode acessar a API em http://localhost:3000
   * 
   * ALLOWED_ORIGINS: Lista de origens permitidas separadas por vírgula
   * Exemplo: "http://localhost:5000,https://meudominio.com"
   */
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5000'];

  app.enableCors({
    origin: function (origin, callback) {
      // Permite requests sem origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf('*') !== -1) {
        return callback(null, true);
      }
      return callback(null, true); // Em desenvolvimento, permite todas
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  /**
   * Validação Global de Dados de Entrada
   * Aplica validação automática em todos os DTOs (Data Transfer Objects)
   * 
   * Configurações:
   * - whitelist: Remove propriedades não declaradas no DTO
   * - forbidNonWhitelisted: Lança erro se houver propriedades não declaradas
   * - transform: Converte automaticamente os tipos de dados
   * 
   * Isso garante que todos os dados recebidos estejam no formato correto
   * e protege contra ataques de injeção de dados extras
   */
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  /**
   * Prefixo Global de Rotas
   * Todas as rotas começarão com '/api'
   * Exemplo: /auth/login → /api/auth/login
   * Isso ajuda a organizar a API e facilitar a versão futura
   */
  app.setGlobalPrefix('api');

  /**
   * Servição de Arquivos Estáticos
   * 
   * 1. Frontend: Servido a partir da pasta '../../frontend' (relativo ao dist/)
   *    O index: false impede que o Express sirva index.html automaticamente
   *    para rotas que não existem, permitindo que o frontend gerencie suas rotas
   * 
   * 2. Uploads: Arquivos enviados pelos usuários (fotos de perfil, etc.)
   *    Acessíveis via URL: /uploads/avatars/foto.jpg
   */
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend'), { index: false });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  /**
   * Redirecionamento da Raiz
   * Quando o usuário acessa a raiz do servidor ('/'), redireciona para '/login.html'
   * Isso garante que o primeiro acesso seja sempre a página de login
   */
  app.use('/', (req: any, res: any, next: any) => {
    if (req.path === '/') {
      res.redirect('/login.html');
    } else {
      next();
    }
  });

  /**
   * Inicialização do Servidor
   * O servidor escuta na porta definida na variável de ambiente PORT
   * ou na porta padrão 5000
   */
  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`SEADI backend running on port ${port}`);
}

// Inicia a aplicação
bootstrap();
