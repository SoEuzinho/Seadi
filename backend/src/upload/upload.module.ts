/**
 * ========================================================================
 * MÓDULO DE UPLOAD - Gerenciamento de Arquivos
 * ========================================================================
 * 
 * Este módulo é responsável por gerenciar o upload de arquivos
 * para a plataforma SEADI.
 * 
 * Funcionalidades:
 * - Upload de fotos de perfil (avatars)
 * - Validação de tipo de arquivo (MIME type)
 * - Limite de tamanho (5MB)
 * - Limpeza de fotos antigas
 * 
 * Tipos de arquivo permitidos:
 * - image/jpeg (JPG)
 * - image/png (PNG)
 * - image/webp (WebP)
 * - image/gif (GIF)
 * 
 * Local de armazenamento:
 * - /uploads/avatars/ (fotos de perfil)
 * - Acessíveis via URL: /uploads/avatars/foto.jpg
 * 
 * Segurança:
 * - Autenticação JWT obrigatória
 * - Validação de MIME type
 * - Limite de tamanho
 * - Limpeza de fotos antigas
 * ========================================================================
 */

import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

/**
 * Módulo de upload do sistema SEADI.
 * 
 * Controllers:
 * - UploadController: Endpoint para upload de fotos
 * 
 * Nota: Este módulo não tem providers próprios,
 * pois usa o PrismaService (global) diretamente no controller.
 */
@Module({
  controllers: [UploadController],
})
export class UploadModule {}
