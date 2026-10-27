import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { broadcastSosAlert, broadcastSosResolved } from '../services/websocket.js';

export async function emergencyRoutes(fastify: FastifyInstance) {
  // Retorna histórico persistido de alertas de SOS
  fastify.get('/api/emergency/sos', async (request, reply) => {
    const { status = 'ALL', limit = '50' } = request.query as {
      status?: string;
      limit?: string;
    };

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const events = await prisma.sosEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            color: true,
            avatarUrl: true,
            phone: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 100),
    });

    return reply.send({ events });
  });

  // Retorna alertas de emergência ativos no momento
  fastify.get('/api/emergency/sos/active', async (_request, reply) => {
    const activeEvents = await prisma.sosEvent.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            color: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ activeEvents });
  });

  // Dispara novo alerta de SOS e persiste no banco
  fastify.post('/api/emergency/sos', async (request, reply) => {
    const user = (request as any).authUser || (request as any).user;
    const body = (request.body as any) || {};

    let userId = user?.id || body.userId;
    let userName = user?.name || body.userName;
    let userAvatar = user?.avatarUrl || body.userAvatar;

    // Se não encontrou o usuário na sessão, busca pelo body ou pelo primeiro usuário
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst();
      if (!fallbackUser) {
        return reply.status(400).send({ error: 'Nenhum usuário cadastrado' });
      }
      userId = fallbackUser.id;
      userName = fallbackUser.name;
      userAvatar = fallbackUser.avatarUrl;
    }

    let lat = Number(body.latitude);
    let lon = Number(body.longitude);
    let accuracy = body.accuracy ? Number(body.accuracy) : null;
    let battery = body.battery !== undefined ? Number(body.battery) : null;

    // Se coordenadas não foram passadas, busca a última localização conhecida do usuário no banco
    if (isNaN(lat) || isNaN(lon)) {
      const latestLoc = await prisma.locationRecord.findFirst({
        where: { device: { userId } },
        orderBy: { recordedAt: 'desc' },
      });

      if (latestLoc) {
        lat = latestLoc.latitude;
        lon = latestLoc.longitude;
        accuracy = latestLoc.accuracy;
        battery = latestLoc.battery;
      } else {
        lat = 0;
        lon = 0;
      }
    }

    const message = body.message || `🚨 ALERTA DE EMERGÊNCIA: ${userName} acionou o SOS!`;

    // Persiste no banco de dados SQLite
    const event = await prisma.sosEvent.create({
      data: {
        userId,
        latitude: lat,
        longitude: lon,
        accuracy,
        battery,
        message,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            color: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Dispara WebSocket em tempo real e Web Push para todos os aparelhos
    broadcastSosAlert({
      id: event.id,
      userId,
      userName,
      userAvatar,
      latitude: lat,
      longitude: lon,
      battery,
      createdAt: event.createdAt.toISOString(),
      message,
    });

    return reply.status(201).send({
      success: true,
      event,
      message: 'Alerta de SOS gravado e transmitido à família com sucesso.',
    });
  });

  // Resolve ou cancela um alerta de emergência existente
  fastify.put('/api/emergency/sos/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).authUser || (request as any).user;
    const body = (request.body as any) || {};

    const existing = await prisma.sosEvent.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Alerta de SOS não encontrado' });
    }

    const newStatus = body.status === 'CANCELED' ? 'CANCELED' : 'RESOLVED';
    const resolvedAt = new Date();
    const resolvedById = user?.id || null;
    const resolvedByName = user?.name || 'Membro da Família';

    const updated = await prisma.sosEvent.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedAt,
        resolvedById,
      },
      include: {
        user: { select: { id: true, name: true, color: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    // Notifica todos os navegadores conectados para silenciar sirene e fechar o alerta
    broadcastSosResolved({
      id,
      status: newStatus,
      resolvedByName,
      resolvedAt: resolvedAt.toISOString(),
    });

    return reply.send({
      success: true,
      event: updated,
      message: `Alerta marcado como ${newStatus === 'RESOLVED' ? 'Resolvido' : 'Cancelado'}.`,
    });
  });
}
