import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { broadcastChatMessage } from '../services/websocket.js';

export async function messagesRoutes(fastify: FastifyInstance) {
  // Histórico do chat do círculo familiar (sem limite de retenção)
  fastify.get('/api/messages', async (request, reply) => {
    const { limit = '80' } = request.query as { limit?: string };
    const take = Math.min(Math.max(parseInt(limit, 10) || 80, 1), 300);

    const rows = await prisma.circleMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });

    return reply.send(rows.reverse());
  });

  // Envia mensagem ao círculo
  fastify.post('/api/messages', async (request, reply) => {
    const body = request.body as any;
    const text = (body?.text || '').toString().trim();

    if (!text) {
      return reply.status(400).send({ error: 'text é obrigatório' });
    }

    const message = await prisma.circleMessage.create({
      data: {
        userId: body.userId || null,
        userName: body.userName || 'Membro da Família',
        userColor: body.userColor || '#3B82F6',
        text: text.slice(0, 1000),
      },
    });

    broadcastChatMessage(message);

    return reply.status(201).send(message);
  });
}
