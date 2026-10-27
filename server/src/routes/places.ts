import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

export async function placesRoutes(fastify: FastifyInstance) {
  // Lista todas as cercas cadastradas (Casa, Trabalho, Escola)
  fastify.get('/api/places', async (_request, reply) => {
    const places = await prisma.place.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(places);
  });

  // Lista eventos recentes de entrada e saída (Timeline de alertas)
  fastify.get('/api/places/events', async (request, reply) => {
    const { limit = '50' } = request.query as { limit?: string };
    const events = await prisma.placeEvent.findMany({
      include: {
        place: true,
        device: {
          include: { user: true },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(parseInt(limit, 10), 100),
    });

    const formatted = events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      placeName: e.place.name,
      placeIcon: e.place.icon,
      placeColor: e.place.color,
      userName: e.device.user.name,
      userColor: e.device.user.color,
      userAvatar: e.device.user.avatarUrl,
      deviceName: e.device.name,
      recordedAt: e.recordedAt,
    }));

    return reply.send(formatted);
  });

  // Cadastra novo lugar
  fastify.post('/api/places', async (request, reply) => {
    const body = request.body as any;
    if (!body?.name || body?.latitude === undefined || body?.longitude === undefined) {
      return reply.status(400).send({ error: 'name, latitude e longitude são obrigatórios' });
    }

    const place = await prisma.place.create({
      data: {
        name: body.name,
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        radiusMeters: body.radiusMeters ? Number(body.radiusMeters) : 100,
        color: body.color || '#10B981',
        icon: body.icon || 'home',
      },
    });

    return reply.status(201).send(place);
  });

  // Atualiza um lugar existente (Etapa 8.3)
  fastify.put('/api/places/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const existing = await prisma.place.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Lugar não encontrado' });
    }

    const data: any = {};
    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed) {
        return reply.status(400).send({ error: 'O nome do lugar não pode ser vazio' });
      }
      data.name = trimmed;
    }
    if (body.latitude !== undefined) data.latitude = Number(body.latitude);
    if (body.longitude !== undefined) data.longitude = Number(body.longitude);
    if (body.radiusMeters !== undefined) data.radiusMeters = Number(body.radiusMeters);
    if (body.color !== undefined) data.color = String(body.color);
    if (body.icon !== undefined) data.icon = String(body.icon);

    const updated = await prisma.place.update({
      where: { id },
      data,
    });

    return reply.send(updated);
  });

  // Remove um lugar
  fastify.delete('/api/places/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.place.delete({ where: { id } });
    return reply.send({ success: true });
  });
}
