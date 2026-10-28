import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  getUserCircle,
  regenerateCircleInviteCode,
  joinCircleWithCode,
  removeMemberFromCircle,
} from '../services/circle.js';

export async function circleRoutes(fastify: FastifyInstance) {
  // Retorna os dados do círculo do usuário autenticado e seus membros
  fastify.get('/api/circle', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const membership = await getUserCircle(authUser.id);
    if (!membership) {
      return reply.status(404).send({ error: 'Nenhum círculo encontrado para este usuário.' });
    }

    const circle = membership.circle;
    const members = circle.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      color: m.user.color,
      phone: m.user.phone,
      role: m.user.role,
      roleInCircle: m.roleInCircle,
      joinedAt: m.joinedAt,
      isCurrentUser: m.user.id === authUser.id,
    }));

    return reply.send({
      id: circle.id,
      name: circle.name,
      inviteCode: circle.inviteCode,
      myRole: membership.roleInCircle,
      members,
    });
  });

  // Regenera o código de convite do círculo (apenas admin)
  fastify.post('/api/circle/invite/regenerate', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const membership = await getUserCircle(authUser.id);
    if (!membership) {
      return reply.status(404).send({ error: 'Círculo não encontrado.' });
    }

    try {
      const inviteCode = await regenerateCircleInviteCode(membership.circleId, authUser.id);
      return reply.send({
        success: true,
        inviteCode,
        message: 'Novo código de convite gerado com sucesso.',
      });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ error: err.message || 'Erro ao gerar código de convite.' });
    }
  });

  // Entra em um círculo usando o código de convite
  fastify.post('/api/circle/join', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const body = request.body as any;
    const inviteCode = (body?.inviteCode || '').toString();

    try {
      const circle = await joinCircleWithCode(authUser.id, inviteCode);
      return reply.send({
        success: true,
        message: `Você entrou no círculo ${circle.name}!`,
        circle: {
          id: circle.id,
          name: circle.name,
          inviteCode: circle.inviteCode,
        },
      });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ error: err.message || 'Erro ao entrar no círculo.' });
    }
  });

  // Remove um membro do círculo (apenas admin)
  fastify.delete('/api/circle/members/:memberId', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const { memberId } = request.params as { memberId: string };
    const membership = await getUserCircle(authUser.id);
    if (!membership) {
      return reply.status(404).send({ error: 'Círculo não encontrado.' });
    }

    try {
      await removeMemberFromCircle(membership.circleId, memberId, authUser.id);
      return reply.send({
        success: true,
        message: 'Membro removido do círculo com sucesso.',
      });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ error: err.message || 'Erro ao remover membro.' });
    }
  });

  // Renomeia o círculo (apenas admin)
  fastify.put('/api/circle/name', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    if (!authUser) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const body = request.body as any;
    const name = (body?.name || '').toString().trim();
    if (!name) {
      return reply.status(400).send({ error: 'Nome do círculo é obrigatório.' });
    }

    const membership = await getUserCircle(authUser.id);
    if (!membership || membership.roleInCircle !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem renomear o círculo.' });
    }

    const updated = await prisma.circle.update({
      where: { id: membership.circleId },
      data: { name },
    });

    return reply.send({
      success: true,
      name: updated.name,
    });
  });
}
