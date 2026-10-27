import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../db.js';

const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Cria uma sessão com token aleatório de 256 bits (revogável e sem segredo em .env)
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MS);

  await prisma.authSession.create({ data: { token, userId, expiresAt } });

  return { token, expiresAt };
}

export async function destroySession(token?: string | null) {
  if (!token) return;
  await prisma.authSession.deleteMany({ where: { token } });
}

// Valida o token e devolve o usuário, limpando sessões expiradas
export async function getUserFromToken(token?: string | null) {
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.authSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export function extractBearerToken(header?: string): string {
  if (!header) return '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

// Verifica se o sistema já tem uma conta de acesso configurada (primeiro uso)
export async function hasConfiguredAccount(): Promise<boolean> {
  const count = await prisma.user.count({ where: { passwordHash: { not: null } } });
  return count > 0;
}
