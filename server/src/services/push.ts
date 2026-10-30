import webpush from 'web-push';
import { prisma } from '../db.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@mylife360.local';

let pushConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    pushConfigured = true;
    console.log('🔔 Web Push (VAPID) configurado com sucesso');
  } catch (err) {
    console.error('❌ Falha ao configurar VAPID details:', err);
  }
} else {
  console.warn('⚠️ Chaves VAPID não configuradas. Web Push desativado.');
}

export function isPushConfigured(): boolean {
  return pushConfigured;
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface SubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Envia uma notificação Push (Web Push VAPID ou Expo Push Nativo para APK Android).
 * Remove automaticamente a inscrição do banco se o serviço retornar expirada/desinstalada.
 */
export async function sendPushNotification(
  subscription: SubscriptionRecord,
  payload: PushPayload
): Promise<boolean> {
  const isExpo =
    subscription.endpoint.startsWith('ExponentPushToken[') || subscription.p256dh === 'expo';

  // 1. Envio Nativo para o APK Android via Expo Push Service
  if (isExpo) {
    try {
      const isEmergency =
        payload.title.includes('SOS') ||
        payload.title.includes('ACIDENTE') ||
        payload.title.includes('COLISÃO') ||
        payload.title.includes('CRÍTICA');

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: subscription.endpoint,
          title: payload.title,
          body: payload.body,
          sound: 'default',
          channelId: isEmergency ? 'emergency' : 'default',
          priority: isEmergency ? 'high' : 'default',
          data: payload.data || {},
        }),
      });

      if (!response.ok) {
        console.warn(`[ExpoPush] HTTP ${response.status} ao enviar para ${subscription.endpoint}`);
        return false;
      }

      const resData = (await response.json()) as any;
      if (resData?.data?.details?.error === 'DeviceNotRegistered') {
        console.log(`[ExpoPush] Aparelho desinstalado, removendo token: ${subscription.endpoint}`);
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
        return false;
      }

      return resData?.data?.status === 'ok';
    } catch (err: any) {
      console.error('[ExpoPush Error]', err.message);
      return false;
    }
  }

  // 2. Envio Web Push (VAPID) para navegadores / PWA
  if (!pushConfigured) return false;

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 86400, // 24 horas de retenção na fila do push service
      urgency: payload.title.includes('SOS') ? 'high' : 'normal',
    });
    return true;
  } catch (err: any) {
    // 404 (Not Found) ou 410 (Gone) indica que o navegador desinscreveu ou expirou
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`[Push] Inscrição expirada removida: ${subscription.endpoint.slice(0, 35)}...`);
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      } catch (dbErr) {
        console.error('Erro ao remover inscrição expirada:', dbErr);
      }
    } else {
      console.error('[Push Error]', err.statusCode, err.message);
    }
    return false;
  }
}

/**
 * Envia notificação Web Push / Expo Push para todos os aparelhos de todos os membros
 * (opcionalmente excluindo o autor do evento).
 */
export async function broadcastPushNotification(
  payload: PushPayload,
  excludeUserId?: string
): Promise<number> {
  try {
    const where: any = {};
    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }

    let subscriptions = await prisma.pushSubscription.findMany({ where });
    // Se o filtro excludeUserId não encontrou outros membros, mas existem inscrições cadastradas
    // (cenário de desenvolvedor/teste com apenas 1 usuário), envia para ele para permitir ver o push
    if (subscriptions.length === 0 && excludeUserId) {
      subscriptions = await prisma.pushSubscription.findMany();
    }
    if (subscriptions.length === 0) return 0;

    let successCount = 0;
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const ok = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );
        if (ok) successCount++;
      })
    );

    return successCount;
  } catch (err) {
    console.error('Erro ao enviar broadcast push:', err);
    return 0;
  }
}

/**
 * Envia notificação Web Push / Expo Push para todos os aparelhos de um usuário específico.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    let successCount = 0;
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const ok = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );
        if (ok) successCount++;
      })
    );

    return successCount;
  } catch (err) {
    console.error(`Erro ao enviar push para usuário ${userId}:`, err);
    return 0;
  }
}
