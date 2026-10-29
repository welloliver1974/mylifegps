import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';
import { calculateDistanceMeters } from '../services/geofence.js';
import { segmentPointsIntoTrips, getHistoricalDrivingReport } from '../services/tripDetection.js';
import { fetchPhoneUsageWindows } from '../services/phoneUsage.js';
import { broadcastLocationUpdateRequest } from '../services/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATARS_DIR = path.resolve(__dirname, '../../public/uploads/avatars');

export async function membersRoutes(fastify: FastifyInstance) {
  // Retorna todos os membros e suas últimas posições conhecidas
  fastify.get('/api/members/live', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;

    let userWhere: any = {};
    let placeWhere: any = {};

    if (authUser) {
      const membership = await prisma.circleMember.findFirst({
        where: { userId: authUser.id },
      });

      if (membership) {
        const circleMembers = await prisma.circleMember.findMany({
          where: { circleId: membership.circleId },
          select: { userId: true },
        });
        const memberIds = circleMembers.map((cm) => cm.userId);
        userWhere = { id: { in: memberIds } };
        placeWhere = {
          OR: [
            { circleId: membership.circleId },
            { circleId: null },
          ],
        };
      }
    }

    const [users, places] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        include: {
          devices: {
            include: {
              locations: {
                orderBy: { recordedAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      }),
      prisma.place.findMany({
        where: placeWhere,
      }),
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

      // Se o ponto mais recente veio sem bateria, resgata a última bateria conhecida do aparelho
      if (latestLocation && (latestLocation.battery === null || latestLocation.battery === undefined)) {
        for (const device of u.devices) {
          const locWithBatt = device.locations.find((l: any) => l.battery !== null && l.battery !== undefined);
          if (locWithBatt) {
            latestLocation = {
              ...latestLocation,
              battery: locWithBatt.battery,
              isCharging: latestLocation.isCharging || locWithBatt.isCharging,
            };
            break;
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
    const authUser = (request as any).authUser || (request as any).user;
    const { userId } = request.params as { userId: string };

    if (authUser && authUser.id !== userId && authUser.role !== 'admin') {
      const shared = await prisma.circleMember.findFirst({
        where: {
          userId: authUser.id,
          circle: {
            members: {
              some: { userId },
            },
          },
        },
      });
      if (!shared) {
        return reply.status(403).send({ error: 'Você não tem permissão para visualizar o histórico deste membro.' });
      }
    }

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
    const authUser = (request as any).authUser || (request as any).user;
    const { userId } = request.params as { userId: string };

    if (authUser && authUser.id !== userId && authUser.role !== 'admin') {
      const shared = await prisma.circleMember.findFirst({
        where: {
          userId: authUser.id,
          circle: {
            members: {
              some: { userId },
            },
          },
        },
      });
      if (!shared) {
        return reply.status(403).send({ error: 'Você não tem permissão para visualizar o histórico deste membro.' });
      }
    }

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
          totalSpeedEvents: 0,
          totalHardBrakingEvents: 0,
          totalRapidAccelEvents: 0,
          totalPhoneUsageMinutes: 0,
          totalPhoneUsageEpisodes: 0,
          score: 'Excelente',
          scoreValue: 100,
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

    // Janela de busca dos episódios de uso de celular (Etapa 10.3)
    let usageFrom: Date;
    let usageTo: Date;
    if (from || to) {
      usageFrom = from ? new Date(from) : new Date(records[0]?.recordedAt || Date.now());
      usageTo = to ? new Date(to) : new Date(records[records.length - 1]?.recordedAt || Date.now());
    } else if (records.length > 0) {
      usageFrom = new Date(records[0].recordedAt);
      usageTo = new Date(records[records.length - 1].recordedAt);
    } else {
      usageFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
      usageTo = new Date();
    }

    const phoneUsageWindows = await fetchPhoneUsageWindows(deviceIds, usageFrom, usageTo);

    const result = segmentPointsIntoTrips(records, places, phoneUsageWindows);
    return reply.send(result);
  });

  // Retorna a nota de direção histórica com agregação semanal/mensal e evolução diária (Etapa 9.6)
  fastify.get('/api/members/:userId/driving-history', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    const { userId } = request.params as { userId: string };

    if (authUser && authUser.id !== userId && authUser.role !== 'admin') {
      const shared = await prisma.circleMember.findFirst({
        where: {
          userId: authUser.id,
          circle: {
            members: {
              some: { userId },
            },
          },
        },
      });
      if (!shared) {
        return reply.status(403).send({ error: 'Você não tem permissão para visualizar o histórico deste membro.' });
      }
    }

    const { period = 'week', endDate } = request.query as { period?: string; endDate?: string };
    const validPeriod = period === 'month' ? 'month' : 'week';
    const refDate = endDate ? new Date(endDate) : new Date();

    const report = await getHistoricalDrivingReport(userId, validPeriod, refDate);
    return reply.send(report);
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

  // Atualiza dados de perfil do membro (nome, telefone, cor do marcador)
  fastify.put('/api/members/:id/profile', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const data: any = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.phone === 'string') data.phone = body.phone.trim();
    if (typeof body.color === 'string' && body.color.trim()) data.color = body.color.trim();
    if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        color: true,
        phone: true,
        avatarUrl: true,
        email: true,
        role: true,
      },
    });

    return reply.send({ success: true, user: updated });
  });

  // Upload de foto real de perfil do membro (Etapa 8.7)
  fastify.post('/api/members/:id/avatar', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      return reply.status(400).send({ error: 'Formato inválido. Envie imagem JPEG, PNG ou WEBP.' });
    }

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[file.mimetype] || path.extname(file.filename) || '.jpg';
    const filename = `avatar-${id}-${Date.now()}${ext}`;
    const targetPath = path.join(AVATARS_DIR, filename);

    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
    }

    const buffer = await file.toBuffer();
    await fs.promises.writeFile(targetPath, buffer);

    // Se o usuário já tinha avatar local antigo, remove o arquivo anterior para poupar disco
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(user.avatarUrl);
      const oldPath = path.join(AVATARS_DIR, oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          console.warn('[Avatar] Falha ao deletar avatar antigo:', e);
        }
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;
    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        color: true,
        avatarUrl: true,
      },
    });

    return reply.status(201).send({
      success: true,
      avatarUrl,
      user: updated,
      message: 'Foto de perfil atualizada com sucesso.',
    });
  });

  // Remove foto real de perfil e volta para as iniciais SVG
  fastify.delete('/api/members/:id/avatar', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(user.avatarUrl);
      const oldPath = path.join(AVATARS_DIR, oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          await fs.promises.unlink(oldPath);
        } catch (e) {
          console.warn('[Avatar] Falha ao deletar avatar:', e);
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        color: true,
        avatarUrl: true,
      },
    });

    return reply.send({
      success: true,
      user: updated,
      message: 'Foto de perfil removida. Voltando às iniciais coloridas.',
    });
  });

  // Solicita atualização imediata de localização do membro ("Atualizar agora" - Etapa 9.4)
  fastify.post('/api/members/:id/request-update', async (request, reply) => {
    const { id } = request.params as { id: string };

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        devices: {
          orderBy: { lastSeenAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'Membro não encontrado' });
    }

    const authUser = (request as any).authUser || (request as any).user;
    const requestedByName = authUser?.name || 'Membro do Círculo';

    broadcastLocationUpdateRequest({
      userId: targetUser.id,
      userName: targetUser.name,
      requestedBy: requestedByName,
      requestedAt: new Date().toISOString(),
    });

    return reply.send({
      success: true,
      message: `Solicitação de localização enviada para ${targetUser.name}!`,
      requestedAt: new Date().toISOString(),
      target: {
        id: targetUser.id,
        name: targetUser.name,
        activeDevice: targetUser.devices[0]?.name || null,
      },
    });
  });
}
