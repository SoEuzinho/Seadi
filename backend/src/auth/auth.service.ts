/**
 * ========================================================================
 * SERVIÇO DE AUTENTICAÇÃO - Lógica de Negócio
 * ========================================================================
 * 
 * Este serviço contém toda a lógica de negócio para autenticação de usuários.
 * É o coração do sistema de segurança da plataforma SEADI.
 * 
 * Funcionalidades:
 * 
 * 1. REGISTRO DE USUÁRIOS
 *    - Valida unicidade do email
 *    - Criptografa senha com bcrypt (10 rounds)
 *    - Cria usuário no banco de dados
 *    - Retorna token JWT imediatamente
 * 
 * 2. LOGIN
 *    - Valida credenciais (email + senha)
 *    - Implementa rate limiting (máx 5 tentativas/15min)
 *    - Registra tentativas de login (sucesso/falha)
 *    - Atualiza último acesso do usuário
 *    - Retorna token JWT
 * 
 * 3. RECUPERAÇÃO DE SENHA
 *    - Gera código de 6 dígitos
 *    - Envia por email
 *    - Código expira em 30 minutos
 *    - Cooldown de 5 minutos entre solicitações
 * 
 * 4. REDEFINIÇÃO DE SENHA
 *    - Valida código de recuperação
 *    - Atualiza senha com hash bcrypt
 *    - Marca código como utilizado
 * 
 * Segurança:
 * - Senhas nunca são armazenadas em texto plano
 * - Tokens JWT com expiração configurável
 * - Rate limiting previne ataques de força bruta
 * - Validações robustas de entrada
 * ========================================================================
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ActivityService } from '../progress/activity.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const MAX_CODE_ATTEMPTS = 5;

// Retenção de tentativas de login: linhas mais antigas que isso são apagadas
// a cada login (limpeza preguiçosa).
const LOGIN_ATTEMPTS_RETENTION_MS = 24 * 60 * 60 * 1000; // 24h

// Retenção de códigos de recuperação: registros antigos são removidos a cada
// nova solicitação para a tabela RedefinicaoSenha não crescer sem limite.
const RESET_CODE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Rate limiting de recuperação de senha por IP (além do cooldown por e-mail):
// evita spam de e-mails e custo de bcrypt por requisição.
const FORGOT_MAX_PER_IP = 5;
const FORGOT_WINDOW_MS = 10 * 60 * 1000; // 10 min

/**
 * Serviço de autenticação do sistema SEADI.
 * 
 * Este serviço é responsável por:
 * - Gerenciar o ciclo de vida de autenticação dos usuários
 * - Implementar medidas de segurança (rate limiting, hashing de senhas)
 * - Integrar com o sistema de email para recuperação de senha
 * - Registrar atividades de login para auditoria
 */
@Injectable()
export class AuthService {
  /**
   * Injeção de dependências do AuthService.
   * 
   * @param prisma - Serviço de acesso ao banco de dados
   * @param jwtService - Serviço de geração e validação de tokens JWT
   * @param mailService - Serviço de envio de emails
   * @param activity - Serviço de registro de atividades
   */
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private activity: ActivityService,
  ) {}

  /** Rate limiting em memória por IP para /forgot-password (chave: IP -> timestamps). */
  private forgotByIp = new Map<string, number[]>();

  /**
   * Registra um novo usuário no sistema.
   * 
   * Fluxo:
   * 1. Normaliza o email (minúsculas, sem espaços)
   * 2. Verifica se o email já está cadastrado
   * 3. Criptografa a senha com bcrypt
   * 4. Cria o usuário no banco de dados
   * 5. Gera token JWT
   * 6. Retorna dados do usuário e token
   * 
   * @param dto - Dados do registro (name, email, password, phone?, birthDate?)
   * @returns Objeto com { user, token }
   * 
   * @throws ConflictException - Se o email já estiver cadastrado
   * @throws BadRequestException - Se os dados forem inválidos
   */
  async register(dto: RegisterDto) {
    // Normaliza o email para minúsculas e remove espaços
    // Isso garante que "User@Exemplo.COM" e "user@exemplo.com" sejam o mesmo email
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Verifica se o email já existe no banco de dados
    const existing = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Criptografa a senha com bcrypt
    // O '10' indica o número de rounds de hashing (custo computacional)
    // Quanto maior, mais seguro, mas mais lento
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Cria o usuário no banco de dados
    // O select especifica quais campos retornar (nunca senha!)
    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.name,
        email: normalizedEmail,
        senha: hashedPassword,
        // Operador spread condicional: inclui o campo apenas se existir
        ...(dto.phone && { telefone: dto.phone }),
        ...(dto.birthDate && { dataNascimento: new Date(dto.birthDate) }),
      },
      select: { id: true, nome: true, email: true, tokenVersion: true, criadoEm: true },
    });

    // Gera o token JWT com o ID, email e versão do usuário.
    // A versão é verificada em cada requisição (JwtStrategy/QuizGateway);
    // ao incrementá-la (logout, troca de senha), todos os tokens antigos
    // são invalidados imediatamente.
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    });

    return { user, token };
  }

  /**
   * Realiza o login do usuário.
   * 
   * Fluxo:
   * 1. Normaliza o email
   * 2. Busca o usuário no banco
   * 3. Verifica rate limiting (máx 5 tentativas/15min)
   * 4. Compara senha com bcrypt
   * 5. Registra tentativa de login
   * 6. Se sucesso: gera token e atualiza último acesso
   * 7. Retorna dados do usuário e token
   * 
   * @param dto - Dados do login (email, password)
   * @returns Objeto com { user, token }
   * 
   * @throws UnauthorizedException - Credenciais inválidas ou muitas tentativas
   */
  async login(dto: LoginDto, ip?: string) {
    // Normaliza o email
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Limpeza preguiçosa: remove tentativas antigas para impedir que a
    // tabela TentativaLogin cresça sem limite (cada tentativa insere uma linha).
    await this.prisma.tentativaLogin.deleteMany({
      where: { momento: { lt: new Date(Date.now() - LOGIN_ATTEMPTS_RETENTION_MS) } },
    });

    // Busca o usuário pelo email (pode não existir — não quebra o fluxo)
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    /**
     * RATE LIMITING - Prevenção de ataques de força bruta
     *
     * Configurações via variáveis de ambiente:
     * - LOGIN_WINDOW_SECONDS: Janela de tempo para contagem (padrão: 900 = 15 min)
     * - MAX_LOGIN_ATTEMPTS: Máximo de tentativas falhas (padrão: 5)
     *
     * Dois limites independentes:
     * - Por IP: protege contra força bruta distribuída e enumeração de e-mails
     * - Por usuário: protege uma conta específica de senha errada repetida
     */
    const loginWindow = parseInt(process.env.LOGIN_WINDOW_SECONDS || '900', 10);
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    const since = new Date(Date.now() - loginWindow * 1000);

    const ipAttempts = ip
      ? await this.prisma.tentativaLogin.count({
          where: { ip, sucesso: false, momento: { gte: since } },
        })
      : 0;

    const userAttempts = user
      ? await this.prisma.tentativaLogin.count({
          where: { usuarioId: user.id, sucesso: false, momento: { gte: since } },
        })
      : 0;

    if (ipAttempts >= maxAttempts || userAttempts >= maxAttempts) {
      throw new UnauthorizedException('Too many attempts. Try again later.');
    }

    // Compara a senha fornecida com o hash armazenado (só se o usuário existe)
    const passwordValid = user
      ? await bcrypt.compare(dto.password, user.senha)
      : false;

    // Registra a tentativa de login (sucesso ou falha), sempre com o IP.
    // Usuários inexistentes são registrados com usuarioId = null, permitindo
    // o rate limit por IP sem quebrar a auditoria.
    await this.prisma.tentativaLogin.create({
      data: {
        usuarioId: user?.id ?? null,
        ip: ip || null,
        sucesso: passwordValid,
      },
    });

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Gera o token JWT com a versão atual do usuário
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    });

    // Atualiza o último acesso do usuário
    // Útil para estatísticas e auditoria
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcesso: new Date() },
    });

    // Registra a atividade de login
    // Isso permite rastrear quando o usuário fez login
    await this.activity.log(user.id, 'login', 'Fez login na plataforma');

    return {
      user: { id: user.id, nome: user.nome, email: user.email },
      token,
    };
  }

  /**
   * Solicita código de recuperação de senha.
   * 
   * Fluxo:
   * 1. Normaliza o email
   * 2. Verifica se o usuário existe
   * 3. Verifica cooldown (5 minutos entre solicitações)
   * 4. Gera código de 6 dígitos
   * 5. Armazena no banco com expiração de 30 minutos
   * 6. Envia código por email
   * 7. Retorna mensagem genérica (por segurança)
   * 
   * @param dto - Dados da solicitação (email)
     * @returns Mensagem de confirmação
     * 
     * @throws BadRequestException - Se cooldown não expirou
     */
  async forgotPassword(dto: ForgotPasswordDto, ip?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Limpeza preguiçosa: remove códigos antigos (já expirados e irrelevantes).
    await this.prisma.redefinicaoSenha.deleteMany({
      where: { criadoEm: { lt: new Date(Date.now() - RESET_CODE_RETENTION_MS) } },
    });

    // Rate limit por IP (além do cooldown por e-mail): impede spam de e-mails
    // e custo de bcrypt repetido com emails diferentes.
    if (ip) {
      const agora = Date.now();
      const recentes = (this.forgotByIp.get(ip) || []).filter(
        (t) => agora - t < FORGOT_WINDOW_MS,
      );
      if (recentes.length >= FORGOT_MAX_PER_IP) {
        throw new BadRequestException('Too many requests. Try again later.');
      }
      recentes.push(agora);
      this.forgotByIp.set(ip, recentes);

      // Poda do mapa para impedir crescimento sem limite.
      if (this.forgotByIp.size > 10000) {
        for (const [k, v] of this.forgotByIp) {
          const vivos = v.filter((t) => agora - t < FORGOT_WINDOW_MS);
          if (vivos.length === 0) this.forgotByIp.delete(k);
          else this.forgotByIp.set(k, vivos);
        }
      }
    }

    // Verifica se o usuário existe
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    // Por segurança, sempre retorna a mesma mensagem
    // Isso previne enumeração de usuários
    if (!user) {
      return { message: 'Recovery code sent to email' };
    }

    /**
     * COOLDOWN - Prevenção de spam de emails
     * 
     * Configuração via variável de ambiente:
     * - FORGOT_PASSWORD_COOLDOWN_SECONDS: Tempo mínimo entre solicitações (padrão: 300 = 5 min)
     */
    const cooldown = parseInt(process.env.FORGOT_PASSWORD_COOLDOWN_SECONDS || '300', 10);
    const recentCode = await this.prisma.redefinicaoSenha.findFirst({
      where: {
        email: normalizedEmail,
        usado: false,
        criadoEm: { gte: new Date(Date.now() - cooldown * 1000) },
      },
    });

    if (recentCode) {
      throw new BadRequestException('Please wait before requesting a new code');
    }

    // Gera código aleatório de 6 dígitos
    // randomInt do módulo crypto é criptograficamente seguro
    const code = String(randomInt(100000, 1000000));

    // Armazena apenas o HASH do código no banco (nunca o valor em texto plano),
    // com expiração de 30 minutos
    const codigoHash = await bcrypt.hash(code, 10);
    await this.prisma.redefinicaoSenha.create({
      data: {
        email: normalizedEmail,
        codigo: codigoHash,
        expiraEm: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // Envia o código por email
    await this.mailService.sendPasswordResetCode(normalizedEmail, code);

    return { message: 'Recovery code sent to email' };
  }

  /**
   * Redefine a senha do usuário com código de recuperação.
   * 
   * Fluxo:
   * 1. Normaliza o email
   * 2. Valida o código (existe, não expirado, não utilizado)
   * 3. Busca o usuário
   * 4. Criptografa a nova senha
   * 5. Atualiza a senha no banco
   * 6. Marca o código como utilizado
   * 7. Retorna mensagem de sucesso
   * 
   * @param dto - Dados da redefinição (email, code, newPassword)
   * @returns Mensagem de sucesso
   * 
   * @throws BadRequestException - Código inválido, expirado ou usuário não encontrado
   */
  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Busca o código de recuperação mais recente ainda não utilizado
    // (mesmo que expirado — tentativas são contadas para bloquear brute force)
    const record = await this.prisma.redefinicaoSenha.findFirst({
      where: {
        email: normalizedEmail,
        usado: false,
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired recovery code');
    }

    // Bloqueia o código após MAX_CODE_ATTEMPTS tentativas
    if (record.tentativas >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException('Invalid or expired recovery code');
    }

    // Registra a tentativa antes de validar (mesmo com falha)
    await this.prisma.redefinicaoSenha.update({
      where: { id: record.id },
      data: { tentativas: { increment: 1 } },
    });

    // Como o código é armazenado como hash, a comparação usa bcrypt
    const codeValid = await bcrypt.compare(dto.code, record.codigo);

    if (!codeValid || record.expiraEm < new Date()) {
      throw new BadRequestException('Invalid or expired recovery code');
    }

    // Busca o usuário
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Atualiza a senha no banco e invalida todos os tokens JWT existentes
    // (tokenVersion incrementada — sessões antigas deixam de valer).
    await this.prisma.usuario.update({
      where: { email: normalizedEmail },
      data: { senha: hashedPassword, tokenVersion: { increment: 1 } },
    });

    // Marca o código como utilizado (não pode ser reutilizado)
    await this.prisma.redefinicaoSenha.update({
      where: { id: record.id },
      data: { usado: true },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Encerra a sessão do usuário invalidando o token atual (e todos os
   * anteriores) via incremento de tokenVersion.
   */
  async logout(userId: number) {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Logged out successfully' };
  }
}
