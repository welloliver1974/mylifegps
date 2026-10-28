import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { broadcastLocationUpdateRequest } from '../services/websocket.js';

function generateApiKey(): string {
  return `l360_${crypto.randomBytes(24).toString('hex')}`;
}

function maskKey(key: string): string {
  if (!key || key.length <= 10) return '••••';
  return `${key.slice(0, 8)}${'•'.repeat(12)}${key.slice(-4)}`;
}

export async function devicesRoutes(fastify: FastifyInstance) {
  // Lista os aparelhos que enviam telemetria (com chave de ingestão)
  fastify.get('/api/devices', async (_request, reply) => {
    const devices = await prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, color: true, avatarUrl: true } },
      },
    });

    const now = Date.now();

    return reply.send(
      devices.map((d) => {
        const lastSeenMs = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : null;
        const minutesAgo = lastSeenMs ? Math.floor((now - lastSeenMs) / 60000) : null;

        return {
          id: d.id,
          name: d.name,
          identifier: d.deviceIdentifier,
          deviceIdentifier: d.deviceIdentifier,
          apiKey: d.apiKey, // Painel privado da família: exibimos a chave completa para configuração
          maskedApiKey: maskKey(d.apiKey),
          userId: d.userId,
          userName: d.user?.name || null,
          userColor: d.user?.color || null,
          userAvatar: d.user?.avatarUrl || null,
          user: d.user ? { id: d.user.id, name: d.user.name, color: d.user.color, avatarUrl: d.user.avatarUrl } : null,
          lastSeenAt: d.lastSeenAt,
          minutesAgo,
          online: minutesAgo !== null && minutesAgo <= 10,
          createdAt: d.createdAt,
        };
      })
    );
  });

  // Cadastra um aparelho e devolve a chave de telemetria que o app deve usar
  fastify.post('/api/devices', async (request, reply) => {
    const body = (request.body as any) || {};
    const name = (body.name || '').toString().trim();

    if (!name) {
      return reply.status(400).send({ error: 'O nome do aparelho é obrigatório' });
    }

    let userId = body.userId;
    if (!userId) {
      const auth = (request as any).authUser || (request as any).user;
      const owner = auth?.id ? null : await prisma.user.findFirst();
      userId = auth?.id || owner?.id;
    }

    if (!userId) {
      return reply.status(400).send({ error: 'Nenhum membro disponível para vincular o aparelho' });
    }

    const deviceIdentifier =
      (body.deviceIdentifier || body.identifier || '').toString().trim() ||
      `device-${crypto.randomBytes(4).toString('hex')}`;

    const exists = await prisma.device.findUnique({ where: { deviceIdentifier } });
    if (exists) {
      return reply.status(409).send({ error: 'Já existe um aparelho com este identificador' });
    }

    const device = await prisma.device.create({
      data: {
        name,
        deviceIdentifier,
        userId,
        apiKey: generateApiKey(),
      },
    });

    return reply.status(201).send({
      success: true,
      id: device.id,
      apiKey: device.apiKey,
      device: {
        id: device.id,
        name: device.name,
        deviceIdentifier: device.deviceIdentifier,
        apiKey: device.apiKey,
      },
      message: 'Aparelho criado. Use a chave de telemetria na configuração do app.',
    });
  });

  // Renomeia ou transfere o aparelho para outro membro
  fastify.put('/api/devices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Aparelho não encontrado' });
    }

    const data: any = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.userId === 'string' && body.userId.trim()) data.userId = body.userId.trim();

    const updated = await prisma.device.update({ where: { id }, data });

    return reply.send({
      success: true,
      device: {
        id: updated.id,
        name: updated.name,
        deviceIdentifier: updated.deviceIdentifier,
        userId: updated.userId,
      },
    });
  });

  // Rotaciona a chave de telemetria (invalida a anterior imediatamente)
  fastify.post('/api/devices/:id/rotate-key', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Aparelho não encontrado' });
    }

    const apiKey = generateApiKey();
    await prisma.device.update({ where: { id }, data: { apiKey } });

    return reply.send({
      success: true,
      deviceId: id,
      apiKey,
      message: 'Chave de telemetria rotacionada. Atualize o app do aparelho.',
    });
  });

  // Remove o aparelho e todo o histórico de localização ligado a ele
  fastify.delete('/api/devices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Aparelho não encontrado' });
    }

    await prisma.device.delete({ where: { id } });

    return reply.send({
      success: true,
      message: 'Aparelho removido. O histórico de localização dele também foi apagado.',
    });
  });

  // Solicita atualização imediata de localização de um aparelho ("Atualizar agora" - Etapa 9.4)
  fastify.post('/api/devices/:id/request-update', async (request, reply) => {
    const { id } = request.params as { id: string };

    const device = await prisma.device.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!device) {
      return reply.status(404).send({ error: 'Aparelho não encontrado' });
    }

    const authUser = (request as any).authUser || (request as any).user;
    const callerName = authUser?.name || 'Familiar';

    broadcastLocationUpdateRequest({
      userId: device.userId,
      userName: device.user?.name || device.name,
      requestedBy: callerName,
      requestedAt: new Date().toISOString(),
    });

    return reply.send({
      success: true,
      message: `Solicitação enviada para o aparelho ${device.name}!`,
      requestedAt: new Date().toISOString(),
    });
  });
}