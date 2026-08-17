/**
 * ========================================================================
 * SERVIÇO DE EMAIL - Envio de Emails
 * ========================================================================
 * 
 * Este serviço é responsável por enviar emails pela plataforma SEADI.
 * 
 * Funcionalidades:
 * - Envio de email de recuperação de senha
 * - Fallback para console (quando não configurado)
 * 
 * Configuração:
 * O serviço usa Gmail como provedor de email.
 * As credenciais são configuradas via variáveis de ambiente:
 * - GMAIL_USER: Email do Gmail
 * - GMAIL_PASS: Senha de app do Gmail (não a senha normal!)
 * 
 * Como obter senha de app:
 * 1. Acesse https://myaccount.google.com/security
 * 2. Ative a verificação em 2 etapas
 * 3. Gere uma senha de app para "Outro (Nome personalizado)"
 * 4. Use a senha gerada (16 caracteres) no GMAIL_PASS
 * 
 * Fallback:
 * Se as credenciais não estiverem configuradas, o serviço:
 * - Loga a mensagem no console
 * - Não envia email real
 * - Útil para desenvolvimento/testes
 * 
 * Uso:
 * Em qualquer service, injete o MailService e chame:
 * await this.mailService.sendPasswordResetCode(email, code);
 * ========================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Serviço de email do sistema SEADI.
 * 
 * Este serviço usa Nodemailer para enviar emails.
 * O Nodemailer suporta vários provedores (Gmail, SMTP, etc.).
 */
@Injectable()
export class MailService {
  /**
   * Logger para registrar eventos e erros.
   */
  private readonly logger = new Logger(MailService.name);
  
  /**
   * Transportador de email.
   * null se as credenciais não estiverem configuradas.
   */
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Construtor do MailService.
   * 
   * Verifica se as credenciais do Gmail estão configuradas.
   * Se estiverem, cria o transportador de email.
   * Se não, loga aviso e usa fallback (console).
   */
  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (user && pass) {
      // Cria transportador Gmail
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      this.logger.log('Mail service initialized with Gmail');
    } else {
      // Fallback: loga aviso
      this.logger.warn('GMAIL_USER/GMAIL_PASS not set — emails will be logged only');
    }
  }

  /**
   * Enia email de recuperação de senha.
   * 
   * @param email - Email do destinatário
   * @param code - Código de recuperação de 6 dígitos
   * 
   * Comportamento:
   * - Se o transportador estiver configurado, envia email real
   * - Se não, loga o código no console (fallback)
   * 
   * Conteúdo do email:
   * - Assunto: "SEADI — Código de recuperação de senha"
   * - Corpo: Código de 6 dígitos + instruções
   * 
   * O código expira em 30 minutos (configurado no AuthService).
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'SEADI — Código de recuperação de senha';
    const text = `Seu código de recuperação é: ${code}\n\nEle expira em 30 minutos.\n\nSe você não solicitou esta redefinição, ignore este e-mail.`;

    if (this.transporter) {
      // Envia email real via Gmail
      await this.transporter.sendMail({
        from: `"SEADI" <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        text,
      });
      this.logger.log(`Password reset code sent to ${email}`);
    } else {
      // Fallback: loga no console (desenvolvimento)
      this.logger.log(`[DEV] Password reset code for ${email}: ${code}`);
    }
  }
}
