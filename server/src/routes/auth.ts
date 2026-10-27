import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  createSession,
  destroySession,
  extractBearerToken,
  getUserFromToken,
  hasConfiguredAccount,
  hashPassword,
  verifyPassword,
} from '../services/auth.js';

const MIN_PASSWORD_LENGTH = 8;

function publicUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    color: user.color,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  // Indica ao frontend se precisa mostrar a tela de configuração inicial ou de login
  fastify.get('/api/auth/status', async () => {
    return {
      needsSetup: !(await hasConfiguredAccount()),
      authenticated: false,
    };
  });

  // Cria a primeira conta (administrador). Só funciona enquanto não existir nenhuma conta.
  fastify.post('/api/auth/setup', async (request, reply) => {
    if (await hasConfiguredAccount()) {
      return reply.status(409).send({ error: 'Já existe uma conta configurada. Faça login.' });
    }

    const body = request.body as any;
    const name = (body?.name || '').toString().trim();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const password = (body?.password || '').toString();

    if (!name) return reply.status(400).send({ error: 'Informe seu nome.' });
    if (!email || !email.includes('@')) return reply.status(400).send({ error: 'Informe um e-mail válido.' });
    if (password.length < MIN_PASSWORD_LENGTH) {
      return reply.status(400).send({ error: `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    }

    const passwordHash = await hashPassword(password);

    // Reaproveita o primeiro registro de usuário, se existir, para não duplicar a família
    const existing = await prisma.user.findFirst({ where: { passwordHash: null } });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, email, passwordHash, role: 'admin' },
        })
      : await prisma.user.create({
          data: { name, email, passwordHash, role: 'admin', color: '#3B82F6' },
        });

    const { token, expiresAt } = await createSession(user.id);

    return reply.status(201).send({ token, expiresAt, user: publicUser(user) });
  });

  // Login por e-mail e senha
  fastify.post('/api/auth/login', async (request, reply) => {
    const body = request.body as any;
    const email = (body?.email || '').toString().trim().toLowerCase();
    const password = (body?.password || '').toString();

    if (!email || !password) {
      return reply.status(400).send({ error: 'Informe e-mail e senha.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Mesma mensagem para usuário inexistente e senha errada (evita enumerar contas)
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    const { token, expiresAt } = await createSession(user.id);

    return reply.send({ token, expiresAt, user: publicUser(user) });
  });

  // Encerra a sessão atual
  fastify.post('/api/auth/logout', async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    await destroySession(token);
    return reply.send({ success: true });
  });

  // Retorna o usuário autenticado
  fastify.get('/api/auth/me', async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const user = await getUserFromToken(token);

    if (!user) return reply.status(401).send({ error: 'Não autenticado' });

    return reply.send({ user: publicUser(user) });
  });
}
