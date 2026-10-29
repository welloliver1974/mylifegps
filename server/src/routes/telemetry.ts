import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { processTelemetry } from '../services/telemetry.js';
import { getUserFromToken } from '../services/auth.js';

// Em produção a ingestão é protegida por chave por aparelho.
// TELEMETRY_REQUIRE_KEY=false reabre a rota (apenas para migração/uso local).
const REQUIRE_KEY = process.env.TELEMETRY_REQUIRE_KEY !== 'false';
// Chave mestra opcional: aceita qualquer deviceIdentifier (útil para Traccar com URL única)
const MASTER_KEY = process.env.TELEMETRY_MASTER_KEY || '';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extrai a chave de telemetria de onde o cliente conseguir enviar:
 * header `x-device-key` / `x-api-key` / `authorization`, query `key`/`apiKey`, ou corpo `apiKey`/`key`/`deviceApiKey`.
 */
export function extractDeviceKey(request: any, body?: any): string | undefined {
  const headers = request.headers || {};
  const query = (request.query as any) || {};
  const candidates = [
    headers['x-device-key'],
    headers['x-api-key'],
    headers['authorization'],
    query.key,
    query.apiKey,
    body?.apiKey,
    body?.key,
    body?.deviceApiKey,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    }
  }
  return undefined;
}

type AuthResult =
  | { ok: true; device: any | null }
  | { ok: false; status: number; error: string };

export async function authorizeDevice(deviceIdentifier: string, key: string | undefined): Promise<AuthResult> {
  const cleanId = String(deviceIdentifier || '').trim();
  const cleanKey = String(key || '').trim().replace(/^["']|["']$/g, '');

  if (MASTER_KEY && cleanKey && safeEqual(cleanKey, MASTER_KEY)) {
    let device = cleanId ? await prisma.device.findUnique({ where: { deviceIdentifier: cleanId } }) : null;
    return { ok: true, device }; // Chave mestra: aparelho pode ser auto-registrado
  }

  // 1. Busca primeiro pela chave única de telemetria (l360_...).
  // Cada aparelho cadastrado possui uma chave criptográfica única no banco.
  let device = cleanKey ? await prisma.device.findUnique({ where: { apiKey: cleanKey } }) : null;

  // 2. Se não encontrou pela chave, busca pelo identificador exato informado
  if (!device && cleanId) {
    device = await prisma.device.findUnique({ where: { deviceIdentifier: cleanId } });
  }

  // 3. Se ainda não encontrou, busca tolerante no identificador ou nome (case-insensitive)
  if (!device && cleanId) {
    const allDevices = await prisma.device.findMany();
    device =
      allDevices.find(
        (d) =>
          d.deviceIdentifier.toLowerCase() === cleanId.toLowerCase() ||
          d.name.toLowerCase() === cleanId.toLowerCase()
      ) || null;
  }

  // 4. Se a chave não for de aparelho, verifica se é uma sessão ativa de usuário autenticado (painel web / app mobile)
  if (cleanKey) {
    const sessionUser = await getUserFromToken(cleanKey);
    if (sessionUser) {
      let userDevice = await prisma.device.findFirst({
        where: { userId: sessionUser.id },
        orderBy: { lastSeenAt: 'desc' },
      });
      if (!userDevice) {
        userDevice = await prisma.device.create({
          data: {
            name: `${sessionUser.name} (Navegador/App)`,
            deviceIdentifier: `web-${sessionUser.id.slice(0, 8)}`,
            userId: sessionUser.id,
            apiKey: `l360_auto_${crypto.randomBytes(12).toString('hex')}`,
          },
        });
      }
      return { ok: true, device: userDevice };
    }
  }

  if (!device) {
    if (!REQUIRE_KEY) {
      return { ok: true, device: null }; // Modo legado: auto-registro
    }
    return {
      ok: false,
      status: 401,
      error:
        'Aparelho não registrado. Abra o painel web em "Dispositivos & Chaves GPS", copie a Chave de Telemetria (l360_...) gerada e cole no app.',
    };
  }

  if (!REQUIRE_KEY) {
    return { ok: true, device };
  }

  if (!cleanKey) {
    return { ok: false, status: 401, error: 'Chave de telemetria ausente. Copie a chave (l360_...) do painel web.' };
  }

  if (!safeEqual(cleanKey, device.apiKey)) {
    return { ok: false, status: 401, error: 'Chave de telemetria inválida para este aparelho.' };
  }

  return { ok: true, device };
}

export async function telemetryRoutes(fastify: FastifyInstance) {
  // Ingestão via JSON padrão (App próprio / API REST)
  fastify.post('/api/telemetry', async (request, reply) => {
    const body = request.body as any;

    if (body?.latitude === undefined || body?.longitude === undefined) {
      return reply.status(400).send({ error: 'latitude e longitude são obrigatórios' });
    }

    const rawKey = extractDeviceKey(request, body);
    const rawIdentifier = String(body.deviceIdentifier || body.deviceId || body.identifier || '');
    const auth = await authorizeDevice(rawIdentifier, rawKey);
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    // Usa o deviceIdentifier oficial do banco para garantir que as posições fiquem vinculadas ao mesmo aparelho
    const deviceIdentifier = auth.device?.deviceIdentifier || rawIdentifier || 'device-default';

    const result = await processTelemetry({
      deviceIdentifier,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      altitude: body.altitude !== undefined && body.altitude !== null ? Number(body.altitude) : undefined,
      accuracy: body.accuracy !== undefined && body.accuracy !== null ? Number(body.accuracy) : undefined,
      speed: body.speed !== undefined && body.speed !== null ? Number(body.speed) : undefined,
      heading: body.heading !== undefined && body.heading !== null ? Number(body.heading) : undefined,
      battery: body.battery !== undefined && body.battery !== null ? Number(body.battery) : undefined,
      isCharging: Boolean(body.isCharging),
      recordedAt: body.timestamp ? new Date(body.timestamp) : undefined,
    });

    return reply.status(201).send({ success: true, data: result });
  });

  // Compatibilidade imediata com Traccar Client (Protocolo OsmAnd HTTP GET e POST)
  // A chave vai na URL do Traccar: .../api/telemetry/traccar?id=MEU-ID&key=CHAVE&lat=...&lon=...
  const handleTraccar = async (request: any, data: any, reply: any) => {
    const id = data.id || data.deviceid;
    const lat = data.lat || data.latitude;
    const lon = data.lon || data.longitude;

    if (!id || lat === undefined || lon === undefined) {
      return reply.status(400).send({ error: 'Parâmetros id, lat e lon são necessários' });
    }

    const deviceIdentifier = String(id);
    const auth = await authorizeDevice(deviceIdentifier, extractDeviceKey(request, data));
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    const timestamp = data.timestamp ? new Date(Number(data.timestamp) * 1000) : new Date();

    await processTelemetry({
      deviceIdentifier,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      altitude: data.altitude !== undefined ? parseFloat(data.altitude) : undefined,
      accuracy:
        data.accuracy !== undefined || data.hdop !== undefined
          ? parseFloat(data.accuracy || data.hdop)
          : undefined,
      speed: data.speed !== undefined ? parseFloat(data.speed) * 3.6 : undefined, // converte nós ou m/s para km/h
      heading:
        data.bearing !== undefined || data.heading !== undefined
          ? parseFloat(data.bearing || data.heading)
          : undefined,
      battery: data.batt !== undefined ? parseFloat(data.batt) : undefined,
      isCharging: data.charge === 'true' || data.charge === true,
      recordedAt: timestamp,
    });

    return reply.status(200).send('OK');
  };

  fastify.get('/api/telemetry/traccar', async (request, reply) => {
    return handleTraccar(request, request.query, reply);
  });

  fastify.post('/api/telemetry/traccar', async (request, reply) => {
    const data = { ...(request.query as object), ...(request.body as object) };
    return handleTraccar(request, data, reply);
  });
}