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
import { ensureDefaultCircle, normalizeInviteCode } from '../services/circle.js';

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

    // Garante que o círculo inicial existe e o admin é vinculado
    const defaultCircle = await ensureDefaultCircle();
    await prisma.circleMember.upsert({
      where: {
        circleId_userId: {
          circleId: defaultCircle.id,
          userId: user.id,
        },
      },
      update: { roleInCircle: 'admin' },
      create: {
        circleId: defaultCircle.id,
        userId: user.id,
        roleInCircle: 'admin',
      },
    });

    return reply.status(201).send({ token, expiresAt, user: publicUser(user) });
  });

  // Cadastro de novo membro com código de convite do círculo familiar
  fastify.post('/api/auth/register-with-invite', async (request, reply) => {
    const body = request.body as any;
    const name = (body?.name || '').toString().trim();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const password = (body?.password || '').toString();
    const inviteCode = normalizeInviteCode((body?.inviteCode || '').toString());

    if (!name) return reply.status(400).send({ error: 'Informe seu nome.' });
    if (!email || !email.includes('@')) return reply.status(400).send({ error: 'Informe um e-mail válido.' });
    if (password.length < MIN_PASSWORD_LENGTH) {
      return reply.status(400).send({ error: `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` });
    }
    if (!inviteCode) {
      return reply.status(400).send({ error: 'Informe o código de convite do círculo.' });
    }

    // Busca o círculo correspondente ao código
    let circle = await prisma.circle.findUnique({
      where: { inviteCode },
    });

    if (!circle) {
      const all = await prisma.circle.findMany();
      const match = all.find(
        (c) => c.inviteCode.replace(/-/g, '') === inviteCode.replace(/-/g, '')
      );
      if (match) circle = match;
    }

    if (!circle) {
      return reply.status(404).send({ error: 'Código de convite inválido ou não encontrado.' });
    }

    // Verifica se já existe conta com este e-mail
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.passwordHash) {
      return reply.status(409).send({ error: 'Já existe uma conta com este e-mail. Faça login.' });
    }

    const passwordHash = await hashPassword(password);
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, email, passwordHash, role: 'member' },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: 'member',
            color: randomColor,
          },
        });

    // Vincula ao círculo
    await prisma.circleMember.upsert({
      where: {
        circleId_userId: {
          circleId: circle.id,
          userId: user.id,
        },
      },
      update: { roleInCircle: 'member' },
      create: {
        circleId: circle.id,
        userId: user.id,
        roleInCircle: 'member',
      },
    });

    const { token, expiresAt } = await createSession(user.id);

    return reply.status(201).send({
      token,
      expiresAt,
      user: publicUser(user),
      circle: { id: circle.id, name: circle.name },
    });
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
