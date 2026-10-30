import { prisma } from '../db.js';
import { broadcastLocationUpdate } from './websocket.js';
import { broadcastPushNotification, sendPushToUser, PushPayload } from './push.js';

// Mapeamento visual de ícones de lugares para emojis
const PLACE_ICONS_EMOJI: Record<string, string> = {
  home: '🏡',
  casa: '🏡',
  work: '💼',
  trabalho: '💼',
  escritorio: '💼',
  office: '💼',
  school: '🎓',
  escola: '🎓',
  faculdade: '🎓',
  college: '🎓',
  gym: '🏋️',
  academia: '🏋️',
  hospital: '🏥',
  saude: '🏥',
  market: '🛒',
  mercado: '🛒',
  star: '⭐',
  heart: '❤️',
};

export function getPlaceEmoji(icon?: string): string {
  if (!icon) return '📍';
  const clean = icon.toLowerCase().trim();
  return PLACE_ICONS_EMOJI[clean] || '📍';
}

// Cache em memória para debounce de eventos e prevenção de oscilação de GPS (anti-bouncing)
// Chave: `${deviceId}_${placeId}` -> { lastEventType, timestamp, enteredAt }
interface GeofenceState {
  lastEventType: 'ENTER' | 'EXIT';
  timestamp: number;
  enteredAt?: number;
}
const recentGeofenceState = new Map<string, GeofenceState>();

// Cooldown de 2 minutos para evitar disparos repetidos da mesma transição
const GEOFENCE_DEBOUNCE_MS = 2 * 60 * 1000;
// Tempo mínimo de permanência antes de aceitar saída com variação mínima de borda (90 segundos)
const MIN_DWELL_BEFORE_EXIT_MS = 90 * 1000;

// Fórmula de Haversine para calcular distância precisa em metros entre duas coordenadas
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface GeofenceEventResult {
  placeId: string;
  placeName: string;
  eventType: 'ENTER' | 'EXIT';
  distanceMeters: number;
  radiusMeters: number;
}

export async function checkGeofencesForDevice(
  deviceId: string,
  latitude: number,
  longitude: number,
  accuracy: number = 0,
  recordedAt: Date = new Date()
): Promise<GeofenceEventResult[]> {
  // 1. Busca todas as cercas cadastradas
  const places = await prisma.place.findMany();
  if (places.length === 0) return [];

  // Busca dados do aparelho e usuário para montar a notificação
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { user: true },
  });

  if (!device) return [];

  const triggeredEvents: GeofenceEventResult[] = [];
  const nowMs = recordedAt.getTime();

  for (const place of places) {
    const distance = calculateDistanceMeters(latitude, longitude, place.latitude, place.longitude);

    // Busca o último evento registrado deste aparelho neste lugar
    const lastDbEvent = await prisma.placeEvent.findFirst({
      where: { deviceId, placeId: place.id },
      orderBy: { recordedAt: 'desc' },
    });

    const stateKey = `${deviceId}_${place.id}`;
    const cachedState = recentGeofenceState.get(stateKey);

    const isCurrentlyInside = cachedState
      ? cachedState.lastEventType === 'ENTER'
      : lastDbEvent?.eventType === 'ENTER';

    // Margem de histerese (mínimo 20m ou metade da precisão do GPS) para evitar falso positivo nas bordas
    const hysteresis = Math.max(20, Math.min(accuracy / 2, 50));

    // CONDIÇÃO 1: Entrou no lugar
    if (distance <= place.radiusMeters && !isCurrentlyInside) {
      // Debounce: evita re-entrada se acabou de registrar saída há menos de 1 minuto por oscilação
      if (cachedState && cachedState.lastEventType === 'EXIT' && nowMs - cachedState.timestamp < 60 * 1000) {
        continue;
      }

      await prisma.placeEvent.create({
        data: {
          deviceId,
          placeId: place.id,
          eventType: 'ENTER',
          recordedAt,
        },
      });

      recentGeofenceState.set(stateKey, {
        lastEventType: 'ENTER',
        timestamp: nowMs,
        enteredAt: nowMs,
      });

      const eventPayload: GeofenceEventResult = {
        placeId: place.id,
        placeName: place.name,
        eventType: 'ENTER',
        distanceMeters: Math.round(distance),
        radiusMeters: place.radiusMeters,
      };

      triggeredEvents.push(eventPayload);
      emitGeofenceNotification(device.user.name, place, 'ENTER', recordedAt, {
        sourceUserId: device.userId,
      });
    }
    // CONDIÇÃO 2: Saiu do lugar (distância ultrapassou o raio + histerese)
    else if (distance > place.radiusMeters + hysteresis && isCurrentlyInside) {
      // Prevenção de oscilação: se acabou de entrar há menos de 90 segundos, só aceita saída
      // se a distância for claramente maior que o raio (+ 40 metros além da histerese)
      const enteredAt = cachedState?.enteredAt || (lastDbEvent ? new Date(lastDbEvent.recordedAt).getTime() : 0);
      const dwellTime = nowMs - enteredAt;
      if (dwellTime < MIN_DWELL_BEFORE_EXIT_MS && distance < place.radiusMeters + hysteresis + 40) {
        continue;
      }

      // Debounce: evita re-saída repetida
      if (cachedState && cachedState.lastEventType === 'EXIT' && nowMs - cachedState.timestamp < GEOFENCE_DEBOUNCE_MS) {
        continue;
      }

      await prisma.placeEvent.create({
        data: {
          deviceId,
          placeId: place.id,
          eventType: 'EXIT',
          recordedAt,
        },
      });

      recentGeofenceState.set(stateKey, {
        lastEventType: 'EXIT',
        timestamp: nowMs,
      });

      const eventPayload: GeofenceEventResult = {
        placeId: place.id,
        placeName: place.name,
        eventType: 'EXIT',
        distanceMeters: Math.round(distance),
        radiusMeters: place.radiusMeters,
      };

      triggeredEvents.push(eventPayload);
      emitGeofenceNotification(device.user.name, place, 'EXIT', recordedAt, {
        sourceUserId: device.userId,
      });
    }
  }

  return triggeredEvents;
}

export interface GeofenceNotificationOptions {
  sourceUserId?: string;
  forceSendToAuthor?: boolean;
}

// Emite alerta para o WebSocket e para o Push Notification (Web Push + Expo Push)
export async function emitGeofenceNotification(
  userName: string,
  place: { id: string; name: string; icon?: string; color?: string },
  eventType: 'ENTER' | 'EXIT',
  timestamp: Date,
  options?: GeofenceNotificationOptions
) {
  const emoji = getPlaceEmoji(place.icon);
  const actionText = eventType === 'ENTER' ? 'chegou em' : 'saiu de';
  const message = `${emoji} ${userName} ${actionText} ${place.name}`;

  console.log(`[GEOFENCE ALERT] ${message} (${timestamp.toLocaleTimeString()})`);

  // 1. Dispara no WebSocket para atualizar badges, lista de alertas e toasts no mapa em tempo real
  broadcastLocationUpdate({
    type: 'GEOFENCE_ALERT',
    alert: {
      placeId: place.id,
      placeName: place.name,
      placeIcon: emoji,
      placeColor: place.color,
      userName,
      eventType,
      message,
      timestamp: timestamp.toISOString(),
    },
  });

  // 2. Dispara notificação Web Push & Expo Push Android APK
  const isEnter = eventType === 'ENTER';
  const pushTitle = isEnter ? `${emoji} Chegou em ${place.name}` : `🚗 Saiu de ${place.name}`;
  const pushBody = `${userName} acabou de ${isEnter ? 'chegar em' : 'sair de'} ${place.name}.`;

  const payload: PushPayload = {
    title: pushTitle,
    body: pushBody,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `geofence-${place.id}-${eventType}-${Date.now()}`,
    data: {
      url: `/?action=place&placeId=${place.id}`,
      type: 'geofence',
      placeId: place.id,
      eventType,
    },
  };

  try {
    if (options?.forceSendToAuthor && options?.sourceUserId) {
      // Envio de teste forçado para o próprio usuário
      await sendPushToUser(options.sourceUserId, payload);
    } else {
      // Dispara para o círculo familiar
      await broadcastPushNotification(payload, options?.sourceUserId);
    }
  } catch (err) {
    console.error('[Push Geofence Error]', err);
  }
}

// Disparo de teste para verificação manual pelo usuário no PWA
export async function sendGeofenceTestPush(
  place: { id: string; name: string; icon?: string; color?: string },
  userName: string,
  eventType: 'ENTER' | 'EXIT',
  userId?: string
) {
  await emitGeofenceNotification(userName, place, eventType, new Date(), {
    sourceUserId: userId,
    forceSendToAuthor: true,
  });

  return {
    success: true,
    message: `Notificação de teste de ${eventType === 'ENTER' ? 'Chegada' : 'Saída'} enviada para ${place.name}!`,
  };
}
