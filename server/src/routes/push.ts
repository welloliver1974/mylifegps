import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  getVapidPublicKey,
  isPushConfigured,
  sendPushToUser,
  broadcastPushNotification,
} from '../services/push.js';
import { authorizeDevice, extractDeviceKey } from './telemetry.js';

export async function pushRoutes(fastify: FastifyInstance) {
  // Registra o token nativo do APK Android (Expo Push) autenticado por chave do aparelho
  fastify.post('/api/push/register-device', async (request, reply) => {
    const body = request.body as any;
    const deviceIdentifier = body?.deviceIdentifier;
    const pushToken = body?.pushToken;

    if (!deviceIdentifier || !pushToken) {
      return reply.status(400).send({
        error: 'deviceIdentifier e pushToken são obrigatórios',
      });
    }

    const key = extractDeviceKey(request, body);
    const auth = await authorizeDevice(deviceIdentifier, key);

    if (!auth.ok) {
      return reply.status(auth.status).send({ error: auth.error });
    }

    const device = auth.device;
    if (!device.userId) {
      return reply.status(400).send({ error: 'Aparelho não vinculado a um usuário familiar' });
    }

    // Salva ou atualiza no banco a inscrição nativa Expo Push
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: pushToken },
      create: {
        userId: device.userId,
        endpoint: pushToken,
        p256dh: 'expo',
        auth: 'expo',
        userAgent: `MyLife360-APK/${device.name}`,
      },
      update: {
        userId: device.userId,
        p256dh: 'expo',
        auth: 'expo',
        userAgent: `MyLife360-APK/${device.name}`,
      },
    });

    return reply.status(201).send({
      success: true,
      subscriptionId: sub.id,
      message: 'Token de notificação nativa do APK registrado com sucesso na VPS.',
    });
  });

  // Retorna a chave pública VAPID para o navegador assinar o PushManager
  fastify.get('/api/push/public-key', async (_request, reply) => {
    return reply.send({
      configured: isPushConfigured(),
      publicKey: getVapidPublicKey(),
    });
  });

  // Salva ou atualiza a inscrição Web Push do navegador atual
  fastify.post('/api/push/subscribe', async (request, reply) => {
    const user = (request as any).authUser || (request as any).user;
    const body = request.body as any;

    if (!body || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return reply.status(400).send({
        error: 'Inscrição push inválida (endpoint, p256dh e auth são obrigatórios)',
      });
    }

    const userId = user?.id || body.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Usuário não autenticado' });
    }

    // Salva ou atualiza no SQLite
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent || (request.headers['user-agent'] as string) || null,
      },
      update: {
        userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: body.userAgent || (request.headers['user-agent'] as string) || null,
      },
    });

    return reply.status(201).send({
      success: true,
      subscriptionId: sub.id,
      message: 'Notificações push ativadas com sucesso neste aparelho.',
    });
  });

  // Cancela a inscrição Web Push
  fastify.post('/api/push/unsubscribe', async (request, reply) => {
    const body = request.body as any;
    if (!body?.endpoint) {
      return reply.status(400).send({ error: 'Endpoint é obrigatório' });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint },
    });

    return reply.send({ success: true, message: 'Inscrição push cancelada.' });
  });

  // Envia notificação de teste para o próprio usuário autenticado
  fastify.post('/api/push/test', async (request, reply) => {
    const user = (request as any).authUser || (request as any).user;
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const sent = await sendPushToUser(user.id, {
      title: '🔔 Teste de Notificação My Life360',
      body: `Olá ${user.name}! As notificações push do seu círculo familiar estão ativas.`,
      tag: 'test-push',
      data: { url: '/', type: 'test' },
    });

    return reply.send({
      success: true,
      sentCount: sent,
      message: sent > 0 ? 'Notificação de teste enviada!' : 'Nenhum dispositivo inscrito para este usuário.',
    });
  });
}
