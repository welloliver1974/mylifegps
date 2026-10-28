import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../db.js';
import { processTelemetry } from '../services/telemetry.js';

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
 * header `x-device-key` / `x-api-key`, query `key`/`apiKey` ou corpo `apiKey`.
 */
function extractDeviceKey(request: any, body?: any): string | undefined {
  const headers = request.headers || {};
  const query = (request.query as any) || {};
  const candidates = [
    headers['x-device-key'],
    headers['x-api-key'],
    query.key,
    query.apiKey,
    body?.apiKey,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

type AuthResult =
  | { ok: true; device: any | null }
  | { ok: false; status: number; error: string };

async function authorizeDevice(deviceIdentifier: string, key: string | undefined): Promise<AuthResult> {
  const device = await prisma.device.findUnique({ where: { deviceIdentifier } });

  if (MASTER_KEY && key && safeEqual(key, MASTER_KEY)) {
    return { ok: true, device }; // Chave mestra: aparelho pode ser auto-registrado
  }

  if (!device) {
    if (!REQUIRE_KEY) {
      return { ok: true, device: null }; // Modo legado: auto-registro
    }
    return {
      ok: false,
      status: 401,
      error:
        'Aparelho não registrado. Abra o painel, cadastre o aparelho em "Dispositivos" e use a chave gerada na configuração do app.',
    };
  }

  if (!REQUIRE_KEY) {
    return { ok: true, device };
  }

  if (!key) {
    return { ok: false, status: 401, error: 'Chave de telemetria ausente (header x-device-key ou ?key=).' };
  }

  if (!safeEqual(key, device.apiKey)) {
    return { ok: false, status: 401, error: 'Chave de telemetria inválida para este aparelho.' };
  }

  return { ok: true, device };
}

export async function telemetryRoutes(fastify: FastifyInstance) {
  // Ingestão via JSON padrão (App próprio / API REST)
  fastify.post('/api/telemetry', async (request, reply) => {
    const body = request.body as any;

    if (!body?.deviceIdentifier || body?.latitude === undefined || body?.longitude === undefined) {
      return reply.status(400).send({ error: 'deviceIdentifier, latitude e longitude são obrigatórios' });
    }

    const deviceIdentifier = String(body.deviceIdentifier);
    const auth = await authorizeDevice(deviceIdentifier, extractDeviceKey(request, body));
    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

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