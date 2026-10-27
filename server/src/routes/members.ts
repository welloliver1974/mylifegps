import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { calculateDistanceMeters } from '../services/geofence.js';
import { segmentPointsIntoTrips } from '../services/tripDetection.js';

export async function membersRoutes(fastify: FastifyInstance) {
  // Retorna todos os membros e suas últimas posições conhecidas
  fastify.get('/api/members/live', async (_request, reply) => {
    const [users, places] = await Promise.all([
      prisma.user.findMany({
        include: {
          devices: {
            include: {
              locations: {
                orderBy: { recordedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.place.findMany(),
    ]);

    const members = users.map((u) => {
      // Pega o dispositivo com o ponto de localização mais recente
      let latestLocation: any = null;
      let activeDevice: any = null;

      for (const device of u.devices) {
        const loc = device.locations[0];
        if (loc) {
          if (!latestLocation || new Date(loc.recordedAt) > new Date(latestLocation.recordedAt)) {
            latestLocation = loc;
            activeDevice = device;
          }
        }
      }

      // Verifica se a última posição está dentro de alguma cerca/lugar cadastrado
      let currentPlace: any = null;
      if (latestLocation && places.length > 0) {
        for (const place of places) {
          const dist = calculateDistanceMeters(
            latestLocation.latitude,
            latestLocation.longitude,
            place.latitude,
            place.longitude
          );
          if (dist <= place.radiusMeters) {
            currentPlace = {
              id: place.id,
              name: place.name,
              icon: place.icon,
              color: place.color,
              distanceMeters: Math.round(dist),
            };
            break;
          }
        }
      }

      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        color: u.color,
        phone: u.phone,
        currentPlace,
        activeDevice: activeDevice
          ? {
              id: activeDevice.id,
              name: activeDevice.name,
              lastSeenAt: activeDevice.lastSeenAt,
            }
          : null,
        location: latestLocation
          ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              accuracy: latestLocation.accuracy,
              speed: latestLocation.speed,
              heading: latestLocation.heading,
              battery: latestLocation.battery,
              isCharging: latestLocation.isCharging,
              recordedAt: latestLocation.recordedAt,
            }
          : null,
      };
    });

    return reply.send(members);
  });

  // Retorna o histórico de deslocamento (rastro) de um membro
  fastify.get('/api/members/:userId/history', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = '200', from, to } = request.query as { limit?: string; from?: string; to?: string };

    const devices = await prisma.device.findMany({
      where: { userId },
      select: { id: true },
    });

    const deviceIds = devices.map((d) => d.id);

    const whereClause: any = {
      deviceId: { in: deviceIds },
    };

    if (from || to) {
      whereClause.recordedAt = {};
      if (from) whereClause.recordedAt.gte = new Date(from);
      if (to) whereClause.recordedAt.lte = new Date(to);
    }

    const history = await prisma.locationRecord.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
      take: Math.min(parseInt(limit, 10), 1000),
    });

    return reply.send(history);
  });

  // Retorna as viagens individuais segmentadas de um membro (Recurso Life360 Gold - Etapa 8.4)
  fastify.get('/api/members/:userId/trips', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { from, to, limit = '1000' } = request.query as { from?: string; to?: string; limit?: string };

    const [devices, places] = await Promise.all([
      prisma.device.findMany({
        where: { userId },
        select: { id: true },
      }),
      prisma.place.findMany(),
    ]);

    const deviceIds = devices.map((d) => d.id);
    if (deviceIds.length === 0) {
      return reply.send({
        trips: [],
        summary: {
          totalTrips: 0,
          totalDistanceKm: 0,
          totalDurationMinutes: 0,
          maxSpeedKmH: 0,
          score: 'Excelente',
        },
      });
    }

    const whereClause: any = {
      deviceId: { in: deviceIds },
    };

    if (from || to) {
      whereClause.recordedAt = {};
      if (from) whereClause.recordedAt.gte = new Date(from);
      if (to) whereClause.recordedAt.lte = new Date(to);
    }

    const records = await prisma.locationRecord.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'asc' },
      take: Math.min(parseInt(limit, 10), 2000),
    });

    const result = segmentPointsIntoTrips(records, places);
    return reply.send(result);
  });

  // Cadastro de novo membro
  fastify.post('/api/users', async (request, reply) => {
    const { name, color, avatarUrl, phone } = request.body as any;
    if (!name) return reply.status(400).send({ error: 'Nome é obrigatório' });

    const user = await prisma.user.create({
      data: { name, color: color || '#3B82F6', avatarUrl, phone },
    });

    return reply.status(201).send(user);
  });
}
