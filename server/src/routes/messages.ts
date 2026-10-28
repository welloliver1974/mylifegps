import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  broadcastChatMessage,
  sendDirectMessage,
  broadcastDmRead,
  broadcastChatReaction,
  broadcastDmReaction,
  notifyMentions,
} from '../services/websocket.js';
import { resolveMentions } from '../services/mentions.js';

// Emojis aceitos para reação (evita armazenar payload arbitrário)
const ALLOWED_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '✅'];

/** Lê o JSON de reações com tolerância a valores legados/corrompidos. */
function parseReactions(raw: unknown): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const clean: Record<string, string[]> = {};
    for (const [emoji, users] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(users)) {
        clean[emoji] = users.filter((u): u is string => typeof u === 'string');
      }
    }
    return clean;
  } catch {
    return {};
  }
}

/** Alterna a reação de um usuário em um emoji, devolvendo o mapa atualizado. */
function toggleReaction(
  reactions: Record<string, string[]>,
  emoji: string,
  userId: string
): { reactions: Record<string, string[]>; action: 'added' | 'removed' } {
  const current = reactions[emoji] || [];
  const has = current.includes(userId);
  const next = has ? current.filter((id) => id !== userId) : [...current, userId];

  const updated = { ...reactions };
  if (next.length === 0) {
    delete updated[emoji];
  } else {
    updated[emoji] = next;
  }

  return { reactions: updated, action: has ? 'removed' : 'added' };
}

export async function messagesRoutes(fastify: FastifyInstance) {
  // Histórico do chat do círculo familiar (sem limite de retenção)
  fastify.get('/api/messages', async (request, reply) => {
    const { limit = '80' } = request.query as { limit?: string };
    const take = Math.min(Math.max(parseInt(limit, 10) || 80, 1), 300);

    const rows = await prisma.circleMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });

    // Entrega as reações já como objeto para o cliente não precisar de JSON.parse
    const normalized = rows.map((row) => ({
      ...row,
      reactions: parseReactions(row.reactions),
    }));

    return reply.send(normalized.reverse());
  });

  // Envia mensagem ao círculo coletivo
  fastify.post('/api/messages', async (request, reply) => {
    const body = request.body as any;
    const text = (body?.text || '').toString().trim();

    if (!text) {
      return reply.status(400).send({ error: 'text é obrigatório' });
    }

    const auth = (request as any).authUser || (request as any).user;
    const authorId = body.userId || auth?.id || null;
    const authorName = body.userName || auth?.name || 'Membro da Família';

    const message = await prisma.circleMessage.create({
      data: {
        userId: authorId,
        userName: authorName,
        userColor: body.userColor || auth?.color || '#3B82F6',
        text: text.slice(0, 1000),
      },
    });

    const payload = { ...message, reactions: {} } as any;

    // Menções @nome: notifica os membros citados (Etapa 9.5)
    try {
      const mentions = await resolveMentions(text, authorId);
      if (mentions.length > 0) {
        payload.mentions = mentions;
        notifyMentions({ mentions, authorName, text });
      }
    } catch (err) {
      console.error('[Mentions] Falha ao resolver menções:', err);
    }

    broadcastChatMessage(payload);

    return reply.status(201).send(payload);
  });

  // Alterna uma reação emoji em uma mensagem do círculo (Etapa 9.5)
  fastify.post('/api/messages/:id/react', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const emoji = (body.emoji || '').toString();

    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return reply.status(400).send({ error: 'Reação não suportada.' });
    }

    const auth = (request as any).authUser || (request as any).user;
    const userId = body.userId || auth?.id;

    if (!userId) {
      return reply.status(400).send({ error: 'Usuário não identificado para reagir.' });
    }

    const existing = await prisma.circleMessage.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Mensagem não encontrada.' });
    }

    const { reactions, action } = toggleReaction(parseReactions(existing.reactions), emoji, userId);

    const updated = await prisma.circleMessage.update({
      where: { id },
      data: { reactions: JSON.stringify(reactions) },
    });

    const userName = body.userName || auth?.name || 'Membro';

    broadcastChatReaction({
      messageId: id,
      reactions,
      userId,
      userName,
      emoji,
      action,
    });

    return reply.send({ success: true, messageId: id, reactions, action });
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

    const normalized = messages.map((m) => ({
      ...m,
      reactions: parseReactions(m.reactions),
    }));

    return reply.send(normalized.reverse());
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

    const payload: any = {
      id: dm.id,
      senderId: dm.senderId,
      receiverId: dm.receiverId,
      senderName: dm.sender.name,
      senderColor: dm.sender.color,
      senderAvatar: dm.sender.avatarUrl,
      receiverName: dm.receiver.name,
      text: dm.text,
      reactions: {},
      read: dm.read,
      createdAt: dm.createdAt.toISOString(),
    };

    // Menções @nome em mensagem privada (Etapa 9.5)
    try {
      const mentions = await resolveMentions(text, senderId);
      if (mentions.length > 0) {
        payload.mentions = mentions;
        notifyMentions({ mentions, authorName: dm.sender.name, text, isDirect: true });
      }
    } catch (err) {
      console.error('[Mentions] Falha ao resolver menções da DM:', err);
    }

    sendDirectMessage(payload);

    return reply.status(201).send({ success: true, message: payload });
  });

  // Alterna uma reação emoji em uma mensagem direta 1:1 (Etapa 9.5)
  fastify.post('/api/messages/direct/react/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const emoji = (body.emoji || '').toString();

    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return reply.status(400).send({ error: 'Reação não suportada.' });
    }

    const auth = (request as any).authUser || (request as any).user;
    const userId = body.userId || auth?.id;

    if (!userId) {
      return reply.status(400).send({ error: 'Usuário não identificado para reagir.' });
    }

    const existing = await prisma.directMessage.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Mensagem não encontrada.' });
    }

    // Só quem participa da conversa pode reagir
    if (existing.senderId !== userId && existing.receiverId !== userId) {
      return reply.status(403).send({ error: 'Você não participa desta conversa.' });
    }

    const { reactions, action } = toggleReaction(parseReactions(existing.reactions), emoji, userId);

    await prisma.directMessage.update({
      where: { id },
      data: { reactions: JSON.stringify(reactions) },
    });

    broadcastDmReaction({
      messageId: id,
      reactions,
      userId,
      userName: body.userName || auth?.name || 'Membro',
      emoji,
      action,
      senderId: existing.senderId,
      receiverId: existing.receiverId,
    });

    return reply.send({ success: true, messageId: id, reactions, action });
  });
}

