import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { broadcastChatMessage, sendDirectMessage, broadcastDmRead } from '../services/websocket.js';

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

  // Envia mensagem ao círculo coletivo
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

  // Contagem de mensagens diretas não lidas agrupadas por remetente
  fastify.get('/api/messages/unread', async (request, reply) => {
    const auth = (request as any).authUser || (request as any).user;
    let userId = auth?.id;

    if (!userId) {
      const first = await prisma.user.findFirst();
      userId = first?.id;
    }

    if (!userId) {
      return reply.send({ unreadBySender: {}, totalUnread: 0 });
    }

    const unreadMessages = await prisma.directMessage.findMany({
      where: {
        receiverId: userId,
        read: false,
      },
      select: {
        senderId: true,
      },
    });

    const unreadBySender: Record<string, number> = {};
    for (const msg of unreadMessages) {
      unreadBySender[msg.senderId] = (unreadBySender[msg.senderId] || 0) + 1;
    }

    return reply.send({
      unreadBySender,
      totalUnread: unreadMessages.length,
    });
  });

  // Retorna conversa privada 1:1 entre o usuário autenticado e outro membro
  fastify.get('/api/messages/direct/:otherUserId', async (request, reply) => {
    const { otherUserId } = request.params as { otherUserId: string };
    const { limit = '100' } = request.query as { limit?: string };
    const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 300);

    const auth = (request as any).authUser || (request as any).user;
    let currentUserId = auth?.id;

    if (!currentUserId) {
      const first = await prisma.user.findFirst({
        where: { id: { not: otherUserId } },
      });
      currentUserId = first?.id;
    }

    if (!currentUserId) {
      return reply.status(400).send({ error: 'Usuário autenticado não identificado' });
    }

    // Busca mensagens trocadas entre os dois usuários
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        sender: {
          select: { id: true, name: true, color: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, color: true, avatarUrl: true },
        },
      },
    });

    // Marca as mensagens recebidas de otherUserId como lidas
    const unreadIncoming = messages.filter((m) => m.senderId === otherUserId && !m.read);
    if (unreadIncoming.length > 0) {
      const unreadIds = unreadIncoming.map((m) => m.id);
      const readAt = new Date();
      await prisma.directMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true, readAt },
      });

      broadcastDmRead({
        senderId: otherUserId,
        receiverId: currentUserId,
        readAt: readAt.toISOString(),
      });
    }

    return reply.send(messages.reverse());
  });

  // Envia mensagem direta (1:1) para outro membro da família
  fastify.post('/api/messages/direct/:otherUserId', async (request, reply) => {
    const { otherUserId } = request.params as { otherUserId: string };
    const body = (request.body as any) || {};
    const text = (body.text || '').toString().trim();

    if (!text) {
      return reply.status(400).send({ error: 'text é obrigatório' });
    }

    const auth = (request as any).authUser || (request as any).user;
    let senderId = auth?.id || body.senderId;

    if (!senderId) {
      const first = await prisma.user.findFirst({
        where: { id: { not: otherUserId } },
      });
      senderId = first?.id;
    }

    if (!senderId) {
      return reply.status(400).send({ error: 'Remetente não identificado' });
    }

    if (senderId === otherUserId) {
      return reply.status(400).send({ error: 'Não é possível enviar mensagem direta para si mesmo' });
    }

    // Valida existência do destinatário
    const receiver = await prisma.user.findUnique({
      where: { id: otherUserId },
    });
    if (!receiver) {
      return reply.status(404).send({ error: 'Membro destinatário não encontrado' });
    }

    const dm = await prisma.directMessage.create({
      data: {
        senderId,
        receiverId: otherUserId,
        text: text.slice(0, 1000),
      },
      include: {
        sender: {
          select: { id: true, name: true, color: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, color: true, avatarUrl: true },
        },
      },
    });

    const payload = {
      id: dm.id,
      senderId: dm.senderId,
      receiverId: dm.receiverId,
      senderName: dm.sender.name,
      senderColor: dm.sender.color,
      senderAvatar: dm.sender.avatarUrl,
      receiverName: dm.receiver.name,
      text: dm.text,
      read: dm.read,
      createdAt: dm.createdAt.toISOString(),
    };

    sendDirectMessage(payload);

    return reply.status(201).send({ success: true, message: payload });
  });
}

