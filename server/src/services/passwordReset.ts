import crypto from 'crypto';
import { prisma } from '../db.js';
import { createSession, hashPassword } from './auth.js';

// Caracteres seguros e sem ambiguidade visual (sem 0, O, 1, I, L)
const SAFE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const MIN_PASSWORD_LENGTH = 8;
export const DEFAULT_RESET_EXPIRY_MINUTES = 30;

/**
 * Gera um código de recuperação legível e seguro (ex: REC-K7W2-9M4P)
 */
export function generateRawResetCode(prefix = 'REC'): string {
  const getChunk = (len: number) => {
    const bytes = crypto.randomBytes(len);
    let chunk = '';
    for (let i = 0; i < len; i++) {
      chunk += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
    }
    return chunk;
  };
  return `${prefix}-${getChunk(4)}-${getChunk(4)}`;
}

/**
 * Normaliza o código de recuperação para facilitar a digitação
 * Aceita: "rec-k7w2-9m4p", "reck7w29m4p", "REC K7W2 9M4P" -> "REC-K7W2-9M4P"
 */
export function normalizeResetCode(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.startsWith('REC') && clean.length === 11) {
    return `REC-${clean.substring(3, 7)}-${clean.substring(7, 11)}`;
  }
  if (clean.length === 8) {
    return `REC-${clean.substring(0, 4)}-${clean.substring(4, 8)}`;
  }
  return raw.trim().toUpperCase();
}

/**
 * Verifica se um usuário (admin) pode gerar código de recuperação para o usuário-alvo.
 * Regras:
 * 1. O próprio usuário pode gerar para si se for admin.
 * 2. Administrador do sistema (role: 'admin') pode gerar para qualquer membro.
 * 3. Administrador de um círculo (roleInCircle: 'admin') pode gerar para membros do mesmo círculo.
 */
export async function canUserManageReset(adminUserId: string, targetUserId: string): Promise<boolean> {
  if (adminUserId === targetUserId) {
    const self = await prisma.user.findUnique({ where: { id: adminUserId } });
    return self?.role === 'admin';
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { circleMembers: true },
  });

  if (!admin) return false;
  if (admin.role === 'admin') return true;

  // Verifica se estão no mesmo círculo e o solicitante é admin desse círculo
  const adminCircleIds = admin.circleMembers
    .filter((cm) => cm.roleInCircle === 'admin')
    .map((cm) => cm.circleId);

  if (adminCircleIds.length === 0) return false;

  const targetMember = await prisma.circleMember.findFirst({
    where: {
      userId: targetUserId,
      circleId: { in: adminCircleIds },
    },
  });

  return Boolean(targetMember);
}

/**
 * Gera um novo código de recuperação para um membro.
 * Invalida automaticamente qualquer código anterior ainda pendente para este usuário.
 */
export async function generatePasswordResetCode(
  targetUserId: string,
  createdById?: string,
  validMinutes: number = DEFAULT_RESET_EXPIRY_MINUTES
) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    const error: any = new Error('Usuário não encontrado.');
    error.status = 404;
    throw error;
  }

  // Invalida tokens pendentes anteriores deste usuário
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: targetUserId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(),
    },
  });

  // Gera código único
  let code = generateRawResetCode();
  let exists = await prisma.passwordResetToken.findUnique({ where: { code } });
  while (exists) {
    code = generateRawResetCode();
    exists = await prisma.passwordResetToken.findUnique({ where: { code } });
  }

  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000);

  const tokenRecord = await prisma.passwordResetToken.create({
    data: {
      code,
      userId: targetUserId,
      createdBy: createdById || 'system',
      expiresAt,
    },
  });

  return {
    code: tokenRecord.code,
    expiresAt: tokenRecord.expiresAt,
    validMinutes,
    targetUser: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

/**
 * Valida o código e redefine a senha do usuário.
 * Revoga todas as sessões anteriores por segurança e devolve uma nova sessão autenticada.
 */
export async function resetPasswordWithCode(emailInput: string, codeInput: string, newPassword: string) {
  const email = (emailInput || '').toString().trim().toLowerCase();
  const rawCode = (codeInput || '').toString().trim();

  if (!email || !email.includes('@')) {
    const err: any = new Error('Informe um e-mail válido.');
    err.status = 400;
    throw err;
  }

  if (!rawCode) {
    const err: any = new Error('Informe o código de recuperação.');
    err.status = 400;
    throw err;
  }

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    const err: any = new Error(`A nova senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Mensagem deliberadamente idêntica para não enumerar e-mails cadastrados
    const err: any = new Error('Código de recuperação inválido ou e-mail não encontrado.');
    err.status = 400;
    throw err;
  }

  const normalizedCode = normalizeResetCode(rawCode);

  // Busca o token associado ao usuário
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      code: normalizedCode,
    },
  });

  if (!resetToken) {
    const err: any = new Error('Código de recuperação inválido ou incorreto.');
    err.status = 400;
    throw err;
  }

  if (resetToken.usedAt !== null) {
    const err: any = new Error('Este código de recuperação já foi utilizado. Solicite um novo código.');
    err.status = 400;
    throw err;
  }

  if (resetToken.expiresAt.getTime() < Date.now()) {
    const err: any = new Error('Este código de recuperação expirou. Peça ao administrador para gerar um novo código.');
    err.status = 400;
    throw err;
  }

  // Criptografa a nova senha com bcrypt
  const passwordHash = await hashPassword(newPassword);

  // Atualiza o usuário
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Marca o token como consumido
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  // Revoga todas as sessões ativas anteriores deste usuário (garantia de segurança)
  await prisma.authSession.deleteMany({
    where: { userId: user.id },
  });

  // Cria uma nova sessão fresca para o usuário logar na hora
  const session = await createSession(user.id);

  return {
    success: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      color: user.color,
    },
    message: 'Senha redefinida com sucesso!',
  };
}
