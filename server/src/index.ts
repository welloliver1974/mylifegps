// Garante que o fuso horário padrão do servidor seja o de Brasília (America/Sao_Paulo),
// alinhando relatórios diários, cortes de viagens e logs com o celular do usuário
process.env.TZ = process.env.TZ || 'America/Sao_Paulo';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, prisma } from './db.js';
import { registerWsClient, broadcastSosAlert, broadcastCheckin } from './services/websocket.js';
import { extractBearerToken, getUserFromToken } from './services/auth.js';
import { telemetryRoutes } from './routes/telemetry.js';
import { membersRoutes } from './routes/members.js';
import { placesRoutes } from './routes/places.js';
import { messagesRoutes } from './routes/messages.js';
import { authRoutes } from './routes/auth.js';
import { geocodingRoutes } from './routes/geocoding.js';
import { pushRoutes } from './routes/push.js';
import { phoneUsageRoutes } from './routes/phoneUsage.js';
import { emergencyRoutes } from './routes/emergency.js';
import { devicesRoutes } from './routes/devices.js';
import { adminRoutes } from './routes/admin.js';
import { circleRoutes } from './routes/circle.js';
import { recordAccess, pruneAccessLogs } from './services/audit.js';
import { startBackupScheduler } from './services/backup.js';
import { ensureDefaultCircle } from './services/circle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Tolera corpo vazio em requisições com header Content-Type: application/json
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body: string, defaultDone) => {
  if (!body || body.trim() === '') {
    defaultDone(null, {});
    return;
  }
  try {
    const json = JSON.parse(body);
    defaultDone(null, json);
  } catch (err: any) {
    err.statusCode = 400;
    defaultDone(err, undefined);
  }
});

// Rotas de API que não exigem sessão: autenticação, ingestão de telemetria dos aparelhos,
// alerta de acidente por chave de aparelho, registro de push do APK, config pública e health
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/telemetry',
  '/api/emergency/crash',
  '/api/push/register-device',
  '/api/phone-usage/ingest',
  '/api/config',
  '/health',
];

function isPublicApi(url: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function bootstrap() {
  try {
    // 1. Configura SQLite com WAL mode e garante círculo inicial
    await initDb();
    await ensureDefaultCircle().catch((err) => {
      console.warn('Aviso ao inicializar círculo padrão:', err);
    });

    // 2. Plugins (CORS, Multipart e WebSockets)
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5 MB por avatar
        files: 1,
      },
    });

    await fastify.register(websocket);

    // 3. Guarda de autenticação para todas as rotas /api (exceto login e telemetria)
    fastify.addHook('onRequest', async (request, reply) => {
      (request as any)._startTime = Date.now();

      const url = request.raw.url || '';

      if (!url.startsWith('/api/')) return;
      if (isPublicApi(url)) return;
      if (request.method === 'OPTIONS') return;

      const token = extractBearerToken(request.headers.authorization);
      const user = await getUserFromToken(token);

      if (!user) {
        return reply.status(401).send({ error: 'Não autenticado. Faça login para continuar.' });
      }

      (request as any).authUser = user;
      (request as any).user = user;
    });

    // 3b. Auditoria de acessos (Etapa 8.9) — grava o resultado de cada chamada de API
    fastify.addHook('onResponse', async (request, reply) => {
      const startedAt = (request as any)._startTime;
      const user = (request as any).authUser || (request as any).user;

      recordAccess({
        userId: user?.id || null,
        userName: user?.name || null,
        method: request.method,
        path: request.raw.url || '',
        statusCode: reply.statusCode,
        ip: request.ip,
        userAgent: request.headers['user-agent'] || null,
        durationMs: startedAt ? Date.now() - startedAt : null,
      }).catch(() => {});
    });

    // 4. Rotas de autenticação (públicas por prefixo)
    await fastify.register(authRoutes);

    // 5. Endpoint WebSocket protegido por token na query string
    fastify.register(async (app) => {
      app.get('/ws', { websocket: true }, async (socket, request) => {
        const token = (request.query as any)?.token as string | undefined;
        const user = await getUserFromToken(token);

        if (!user) {
          socket.send(JSON.stringify({ type: 'ERROR', message: 'Não autenticado.' }));
          socket.close(1008, 'Unauthorized');
          return;
        }

        registerWsClient(socket, user.id);
        socket.send(
          JSON.stringify({
            type: 'CONNECTED',
            message: 'Conectado ao servidor de telemetria em tempo real.',
          })
        );

        socket.on('message', async (raw) => {
          try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'TRIGGER_SOS') {
              const data = msg.data || {};
              const userId = user.id;
              const lat = Number(data.latitude) || 0;
              const lon = Number(data.longitude) || 0;
              const battery = data.battery !== undefined ? Number(data.battery) : null;
              const message = data.message || `🚨 ALERTA DE EMERGÊNCIA: ${user.name} acionou o SOS!`;

              const event = await prisma.sosEvent.create({
                data: {
                  userId,
                  latitude: lat,
                  longitude: lon,
                  battery,
                  message,
                  status: 'ACTIVE',
                },
              });

              broadcastSosAlert({
                id: event.id,
                userId,
                userName: user.name,
                userAvatar: user.avatarUrl,
                latitude: lat,
                longitude: lon,
                battery,
                createdAt: event.createdAt.toISOString(),
                message,
              });
            } else if (msg.type === 'TRIGGER_CHECKIN') {
              broadcastCheckin(msg.data);
            }
          } catch (err) {
            fastify.log.error(err);
          }
        });
      });
    });

    // 6. Health Check e Configuração
    fastify.get('/health', async () => {
      return { status: 'online', timestamp: new Date().toISOString() };
    });

    fastify.get('/api/config', async () => {
      const raw = process.env.CARTO_API_KEY || '';
      const cartoApiKey = raw
        .replace(/^CARTO_API_KEY\s*=\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      return {
        cartoApiKey,
      };
    });

    fastify.post('/api/checkin', async (request, reply) => {
      const body = request.body as any;
      broadcastCheckin(body || {});
      return reply.send({ success: true, message: 'Check-in transmitido com sucesso.' });
    });

    // 7. Registra Rotas de Telemetria, Membros, Lugares, Chat, Geocoding, Push e Emergência
    await fastify.register(telemetryRoutes);
    await fastify.register(membersRoutes);
    await fastify.register(placesRoutes);
    await fastify.register(messagesRoutes);
    await fastify.register(geocodingRoutes);
    await fastify.register(pushRoutes);
    await fastify.register(phoneUsageRoutes);
    await fastify.register(emergencyRoutes);
    await fastify.register(devicesRoutes);
    await fastify.register(adminRoutes);
    await fastify.register(circleRoutes);

    // 8. Serve arquivos estáticos do Painel Web / PWA (Mapa e Interface)
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Servidor My Life360 ativo em http://${host}:${port}`);
    console.log(`📡 WebSocket ativo em ws://${host}:${port}/ws`);

    // 9. Rotinas de segurança em segundo plano (Etapa 8.9)
    if (process.env.TELEMETRY_REQUIRE_KEY === 'false') {
      console.warn('⚠️ TELEMETRY_REQUIRE_KEY=false — ingestão de GPS está ABERTA (insegura).');
    } else {
      console.log('🔐 Ingestão de telemetria protegida por chave por aparelho.');
    }

    startBackupScheduler();

    // Limpa o log de acessos antigo na subida e uma vez por dia
    pruneAccessLogs().catch((err) => console.error('[Audit] Falha ao limpar logs antigos:', err));
    setInterval(
      () => pruneAccessLogs().catch((err) => console.error('[Audit] Falha ao limpar logs antigos:', err)),
      24 * 60 * 60 * 1000
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
