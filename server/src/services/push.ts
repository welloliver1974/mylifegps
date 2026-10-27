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
 * Envia uma notificação Web Push para uma inscrição específica.
 * Remove automaticamente a inscrição do banco se o serviço de push retornar 404/410 (inscrição expirada).
 */
export async function sendPushNotification(
  subscription: SubscriptionRecord,
  payload: PushPayload
): Promise<boolean> {
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
 * Envia notificação Web Push para todos os aparelhos de todos os membros (opcionalmente excluindo o autor do evento).
 */
export async function broadcastPushNotification(
  payload: PushPayload,
  excludeUserId?: string
): Promise<number> {
  if (!pushConfigured) return 0;

  try {
    const where: any = {};
    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }

    const subscriptions = await prisma.pushSubscription.findMany({ where });
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
 * Envia notificação Web Push para todos os aparelhos de um usuário específico.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!pushConfigured) return 0;

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
