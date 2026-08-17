/**
 * ========================================================================
 * CONTROLADOR DE UPLOAD - Upload de Fotos de Perfil
 * ========================================================================
 * 
 * Este controlador expõe o endpoint para upload de fotos de perfil.
 * 
 * Endpoint disponível:
 * - POST /api/auth/upload-photo - Upload de foto de perfil
 * 
 * Configurações de upload:
 * - Tamanho máximo: 5MB
 * - Tipos permitidos: JPG, PNG, WebP, GIF
 * - Local: /uploads/avatars/
 * - Nome do arquivo: timestamp + número aleatório + extensão
 * 
 * Fluxo:
 * 1. Usuário seleciona arquivo no frontend
 * 2. Frontend envia via POST multipart/form-data
 * 3. Multer processa o arquivo (validação, armazenamento)
 * 4. Controller atualiza o banco de dados
 * 5. Remove foto antiga (se existir)
 * 6. Retorna URL da nova foto
 * 
 * Segurança:
 * - Autenticação JWT obrigatória
 * - Validação de MIME type
 * - Limite de tamanho
 * - Limpeza de fotos antigas
 * ========================================================================
 */

import {
  Controller, Post, UseGuards, Req, UploadedFile,
  UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Configurações de upload.
 */
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB em bytes

// Assinaturas de arquivo (magic bytes) para validar o conteúdo real,
// não apenas o MIME type informado pelo cliente.
const MAGIC_BYTES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  'image/png': (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
    b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A,
  'image/webp': (b) => b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
  'image/gif': (b) => b.length >= 6 && (b.toString('latin1', 0, 4) === 'GIF8'),
};

/**
 * Controlador de upload.
 * 
 * Este controlador usa Multer para processar uploads de arquivo.
 * O Multer é um middleware do Express para lidar com multipart/form-data.
 */
@Controller()
export class UploadController {
  /**
   * Injeção de dependência do PrismaService.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Endpoint para upload de foto de perfil.
   * 
   * POST /api/auth/upload-photo
   * 
   * Requer autenticação: SIM (JWT)
   * 
   * Content-Type: multipart/form-data
   * Campo: photo (arquivo)
   * 
   * Configurações do Multer:
   * - storage: Armazenamento em disco (diskStorage)
   * - limits: Tamanho máximo de 5MB
   * - fileFilter: Validação de MIME type
   * 
   * Retorna:
   * - fotoUrl: URL da foto uploadada
   * 
   * Erros:
   * - 400 Bad Request: Arquivo inválido ou não enviado
   * - 413 Payload Too Large: Arquivo muito grande (>5MB)
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth/upload-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      // Armazena em memória (buffer) — o arquivo só é gravado em disco após
      // a validação do conteúdo real (magic bytes), evitando preencher o
      // disco com requisições inválidas.
      storage: memoryStorage(),

      // Limite de tamanho: 5MB
      limits: { fileSize: MAX_SIZE },

      // Filtro de validação de tipo de arquivo
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.'), false);
        }
      },
    }),
  )
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    // Valida se um arquivo foi enviado
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');

    // Valida o conteúdo real do arquivo (magic bytes), além do MIME type.
    // Um arquivo com MIME "image/jpeg" mas conteúdo HTML é rejeitado.
    const magicOk = MAGIC_BYTES[file.mimetype];
    if (!magicOk || !file.buffer || !magicOk(file.buffer)) {
      throw new BadRequestException('Conteúdo do arquivo não corresponde a uma imagem válida.');
    }

    // Busca o usuário atual
    const user = await this.prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');

    // Remove foto anterior se existir
    // Isso evita acúmulo de arquivos não utilizados
    if (user.fotoUrl) {
      const oldPath = join(__dirname, '..', '..', 'uploads', 'avatars', user.fotoUrl.replace('/uploads/avatars/', ''));
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
      }
    }

    // Gera nome único e grava o arquivo validado em disco.
    // Extensão derivada do MIME validado (nunca do nome original do cliente).
    const ext = EXT_BY_MIME[file.mimetype] ?? '.jpg';
    const filename = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    const dir = join(__dirname, '..', '..', 'uploads', 'avatars');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, filename), file.buffer);

    // Gera URL da nova foto
    const fotoUrl = '/uploads/avatars/' + filename;

    // Atualiza o banco de dados com a nova URL
    await this.prisma.usuario.update({
      where: { id: req.user.id },
      data: { fotoUrl },
    });

    return { fotoUrl };
  }
}
