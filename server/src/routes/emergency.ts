import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { broadcastSosAlert, broadcastSosResolved } from '../services/websocket.js';
import { authorizeDevice, extractDeviceKey } from './telemetry.js';

/**
 * Cria o evento de emergência, persiste e transmite ao círculo.
 * Compartilhado entre o SOS manual (sessão) e o acidente veicular (chave do aparelho).
 */
async function createEmergencyEvent(params: {
  userId: string;
  userName?: string;
  userAvatar?: string | null;
  type: 'SOS' | 'CRASH';
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  battery?: number | null;
  message: string;
}) {
  let { latitude: lat, longitude: lon, accuracy, battery } = params;

  // Sem coordenadas no corpo: usa a última posição conhecida do aparelho
  if (lat === undefined || lon === undefined || lat === null || lon === null || isNaN(Number(lat)) || isNaN(Number(lon))) {
    const latestLoc = await prisma.locationRecord.findFirst({
      where: { device: { userId: params.userId } },
      orderBy: { recordedAt: 'desc' },
    });
    if (latestLoc) {
      lat = latestLoc.latitude;
      lon = latestLoc.longitude;
      accuracy = accuracy ?? latestLoc.accuracy;
      battery = battery ?? latestLoc.battery;
    } else {
      lat = 0;
      lon = 0;
    }
  }

  const event = await prisma.sosEvent.create({
    data: {
      userId: params.userId,
      type: params.type,
      latitude: Number(lat),
      longitude: Number(lon),
      accuracy: accuracy ?? null,
      battery: battery ?? null,
      message: params.message,
      status: 'ACTIVE',
    },
    include: {
      user: { select: { id: true, name: true, color: true, avatarUrl: true } },
    },
  });

  broadcastSosAlert({
    id: event.id,
    userId: params.userId,
    userName: params.userName,
    userAvatar: params.userAvatar,
    type: params.type,
    latitude: Number(lat),
    longitude: Number(lon),
    battery: battery ?? null,
    createdAt: event.createdAt.toISOString(),
    message: params.message,
  });

  return event;
}

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

    const message = body.message || `🚨 ALERTA DE EMERGÊNCIA: ${userName} acionou o SOS!`;
    const type = (body.type === 'CRASH' || message.includes('ACIDENTE')) ? 'CRASH' : 'SOS';

    const event = await createEmergencyEvent({
      userId,
      userName,
      userAvatar,
      type,
      latitude: body.latitude !== undefined ? Number(body.latitude) : null,
      longitude: body.longitude !== undefined ? Number(body.longitude) : null,
      accuracy: body.accuracy ? Number(body.accuracy) : null,
      battery: body.battery !== undefined ? Number(body.battery) : null,
      message,
    });

    return reply.status(201).send({
      success: true,
      event,
      message: type === 'CRASH'
        ? 'Alerta de colisão gravado e transmitido à família com sucesso.'
        : 'Alerta de SOS gravado e transmitido à família com sucesso.',
    });
  });

  // Detecção de acidente veicular pelo app mobile (Etapa 9.3)
  // Autenticada pela chave do aparelho (x-device-key), pois o sensor nativo dispara
  // mesmo com o app em segundo plano e sem sessão de usuário carregada.
  fastify.post('/api/emergency/crash', async (request, reply) => {
    const body = (request.body as any) || {};

    const rawKey = extractDeviceKey(request, body);
    const rawIdentifier = String(body.deviceIdentifier || body.deviceId || body.identifier || '');
    const auth = await authorizeDevice(rawIdentifier, rawKey);
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    if (!auth.device?.userId) {
      return reply.status(400).send({
        error: 'Aparelho não vinculado a um usuário. Cadastre e vincule o aparelho no painel em "Dispositivos & Chaves GPS".',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.device.userId } });
    if (!user) {
      return reply.status(404).send({ error: 'Usuário do aparelho não encontrado.' });
    }

    const gForce = Number(body.gForce ?? body.metadata?.gForce ?? 0);
    const speedKmh = Number(body.speedKmh ?? body.metadata?.speedKmh ?? 0);
    const isSimulation = Boolean(body.isSimulation ?? body.metadata?.isSimulation);

    const message = body.message || `🚗💥 POSSÍVEL ACIDENTE DETECTADO: ${user.name} sofreu impacto de ${gForce.toFixed(1)}G${
      speedKmh > 0 ? ` a ~${Math.round(speedKmh)} km/h` : ''
    }!${isSimulation ? ' (Teste de simulação)' : ''}`;

    const event = await createEmergencyEvent({
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      type: 'CRASH',
      latitude: body.latitude !== undefined ? Number(body.latitude) : null,
      longitude: body.longitude !== undefined ? Number(body.longitude) : null,
      accuracy: body.accuracy ? Number(body.accuracy) : null,
      battery: body.battery !== undefined ? Number(body.battery) : null,
      message,
    });

    return reply.status(201).send({
      success: true,
      event,
      device: { id: auth.device.id, name: auth.device.name },
      message: 'Alerta de colisão gravado e transmitido à família com sucesso.',
    });
  });

  // Cancela o próprio alerta de colisão quando o condutor confirma que está bem
  // (o sensor nativo dispara sozinho, então o cancelamento também usa a chave do aparelho)
  fastify.post('/api/emergency/crash/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};

    const rawKey = extractDeviceKey(request, body);
    const rawIdentifier = String(body.deviceIdentifier || body.deviceId || body.identifier || '');
    const auth = await authorizeDevice(rawIdentifier, rawKey);
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    const existing = await prisma.sosEvent.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Alerta de emergência não encontrado' });
    }

    // Só o aparelho dono do alerta pode cancelá-lo por esta rota pública
    if (!auth.device?.userId || auth.device.userId !== existing.userId) {
      return reply.status(403).send({ error: 'Este aparelho não pode cancelar este alerta.' });
    }

    if (existing.status !== 'ACTIVE') {
      return reply.send({ success: true, event: existing, message: 'Alerta já estava encerrado.' });
    }

    const resolvedAt = new Date();
    const updated = await prisma.sosEvent.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt,
        resolvedById: existing.userId,
      },
    });

    broadcastSosResolved({
      id,
      status: 'RESOLVED',
      resolvedByName: 'Próprio condutor (app)',
      resolvedAt: resolvedAt.toISOString(),
    });

    return reply.send({
      success: true,
      event: updated,
      message: 'Alerta de colisão encerrado pelo condutor.',
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
