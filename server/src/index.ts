import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { registerWsClient, broadcastSosAlert } from './services/websocket.js';
import { telemetryRoutes } from './routes/telemetry.js';
import { membersRoutes } from './routes/members.js';
import { placesRoutes } from './routes/places.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function bootstrap() {
  try {
    // 1. Configura SQLite com WAL mode
    await initDb();

    // 2. Plugins (CORS e WebSockets)
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    await fastify.register(websocket);

    // 3. Endpoint WebSocket para streaming do mapa em tempo real e SOS
    fastify.register(async (app) => {
      app.get('/ws', { websocket: true }, (socket) => {
        registerWsClient(socket);
        socket.send(
          JSON.stringify({
            type: 'CONNECTED',
            message: 'Conectado ao servidor de telemetria em tempo real.',
          })
        );

        socket.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'TRIGGER_SOS') {
              broadcastSosAlert(msg.data);
            }
          } catch (err) {
            fastify.log.error(err);
          }
        });
      });
    });

    // 4. Rota de Health Check, Configuração e Alerta SOS via REST
    fastify.get('/health', async () => {
      return { status: 'online', timestamp: new Date().toISOString() };
    });

    fastify.get('/api/config', async () => {
      return {
        cartoApiKey: process.env.CARTO_API_KEY || '',
      };
    });

    fastify.post('/api/emergency/sos', async (request, reply) => {
      const body = request.body as any;
      broadcastSosAlert(body || {});
      return reply.send({ success: true, message: 'Alerta de SOS transmitido com sucesso.' });
    });

    // 5. Registra Rotas de Telemetria, Membros e Lugares
    await fastify.register(telemetryRoutes);
    await fastify.register(membersRoutes);
    await fastify.register(placesRoutes);

    // 6. Serve arquivos estáticos do Painel Web / PWA (Mapa e Interface)
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Servidor My Life360 ativo em http://${host}:${port}`);
    console.log(`📡 WebSocket ativo em ws://${host}:${port}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
