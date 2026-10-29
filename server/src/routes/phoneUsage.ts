import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { authorizeDevice, extractDeviceKey } from './telemetry.js';
import { recordPhoneUsage, PHONE_USAGE_MIN_SPEED_KMH } from '../services/phoneUsage.js';

export async function phoneUsageRoutes(fastify: FastifyInstance) {
  /**
   * Registra um episódio de uso de celular ao volante (Etapa 10.3).
   * Autenticação flexível, igual à telemetria: aceita a chave do aparelho
   * (l360_...) ou o token de sessão do usuário logado no PWA/APK.
   * A rota fica fora do guard de sessão (prefixo público) justamente para
   * aceitar a chave do aparelho; a sessão continua válida como alternativa.
   */
  fastify.post('/api/phone-usage/ingest', async (request, reply) => {
    const body = (request.body || {}) as any;

    const startedAtRaw = body.startedAt || body.startTime;
    const endedAtRaw = body.endedAt || body.endTime;

    if (!startedAtRaw || !endedAtRaw) {
      return reply.status(400).send({ error: 'startedAt e endedAt são obrigatórios' });
    }

    const key = extractDeviceKey(request, body);
    const deviceIdentifier = String(body.deviceIdentifier || body.deviceId || body.identifier || '').trim();
    const auth = await authorizeDevice(deviceIdentifier, key);

    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    if (!auth.device) {
      return reply.status(400).send({ error: 'Aparelho não identificado. Cadastre o dispositivo no painel.' });
    }

    // Confere o contexto de direção: só aceita o episódio se houver leitura recente
    // do próprio aparelho acima do limiar de velocidade, evitando dados inventados
    // ou episódios sem qualquer movimento associado.
    const latest = await prisma.locationRecord.findFirst({
      where: { deviceId: auth.device.id },
      orderBy: { recordedAt: 'desc' },
      select: { speed: true, recordedAt: true },
    });

    const maxSpeedReported = Number(body.maxSpeedKmH ?? body.maxSpeed);
    const latestSpeed = latest?.speed !== null && latest?.speed !== undefined ? Number(latest.speed) : 0;
    const bestSpeed = Math.max(Number.isFinite(maxSpeedReported) ? maxSpeedReported : 0, latestSpeed);

    if (bestSpeed < PHONE_USAGE_MIN_SPEED_KMH) {
      return reply.status(422).send({
        error: `Uso de celular só é contabilizado acima de ${PHONE_USAGE_MIN_SPEED_KMH} km/h enquanto o veículo se desloca.`,
        observedSpeedKmH: Math.round(bestSpeed),
      });
    }

    const result = await recordPhoneUsage({
      deviceId: auth.device.id,
      startedAt: new Date(startedAtRaw),
      endedAt: new Date(endedAtRaw),
      durationSeconds: body.durationSeconds,
      maxSpeedKmH: bestSpeed,
      source: body.source,
    });

    if (!result.ok) {
      // 409 para duplicidade (o cliente pode reenviar sem alarme), 400 para dados inválidos
      const status = result.reason === 'Episódio já registrado' ? 409 : 400;
      return reply.status(status).send({ success: status === 409, reason: result.reason, event: result.event });
    }

    return reply.status(201).send({ success: true, event: result.event });
  });

  /**
   * Lista os episódios de uso de celular do próprio usuário (ou de um membro do
   * mesmo círculo), útil para auditoria e para a futura tela de detalhamento.
   */
  fastify.get('/api/phone-usage/:userId', async (request, reply) => {
    const authUser = (request as any).authUser || (request as any).user;
    const { userId } = request.params as { userId: string };
    const { from, to } = request.query as { from?: string; to?: string };

    if (authUser && authUser.id !== userId && authUser.role !== 'admin') {
      const shared = await prisma.circleMember.findFirst({
        where: {
          userId: authUser.id,
          circle: { members: { some: { userId } } },
        },
      });
      if (!shared) {
        return reply.status(403).send({ error: 'Você não tem permissão para ver estes dados.' });
      }
    }

    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const devices = await prisma.device.findMany({ where: { userId }, select: { id: true } });
    const deviceIds = devices.map((d) => d.id);

    if (deviceIds.length === 0) {
      return reply.send({ events: [], totalMinutes: 0, totalEvents: 0, from: start.toISOString(), to: end.toISOString() });
    }

    const events = await prisma.phoneUsageEvent.findMany({
      where: {
        deviceId: { in: deviceIds },
        startedAt: { lte: end },
        endedAt: { gte: start },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });

    const totalSeconds = events.reduce((acc, e) => acc + (e.durationSeconds || 0), 0);

    return reply.send({
      events: events.map((e) => ({
        id: e.id,
        startedAt: e.startedAt.toISOString(),
        endedAt: e.endedAt.toISOString(),
        durationSeconds: e.durationSeconds,
        durationMinutes: Math.round((e.durationSeconds / 60) * 10) / 10,
        maxSpeedKmH: e.maxSpeedKmH,
        source: e.source,
      })),
      totalMinutes: Math.floor(totalSeconds / 60),
      totalEvents: events.length,
      from: start.toISOString(),
      to: end.toISOString(),
    });
  });
}
