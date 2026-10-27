import { prisma } from '../db.js';
import { broadcastLocationUpdate } from './websocket.js';

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

  for (const place of places) {
    const distance = calculateDistanceMeters(latitude, longitude, place.latitude, place.longitude);

    // Busca o último evento registrado deste aparelho neste lugar
    const lastEvent = await prisma.placeEvent.findFirst({
      where: { deviceId, placeId: place.id },
      orderBy: { recordedAt: 'desc' },
    });

    const isCurrentlyInside = lastEvent?.eventType === 'ENTER';

    // Margem de histerese (20m ou metade da precisão do GPS) para evitar falso positivo nas bordas
    const hysteresis = Math.max(15, Math.min(accuracy / 2, 50));

    // CONDIÇÃO 1: Entrou no lugar
    if (distance <= place.radiusMeters && !isCurrentlyInside) {
      await prisma.placeEvent.create({
        data: {
          deviceId,
          placeId: place.id,
          eventType: 'ENTER',
          recordedAt,
        },
      });

      const eventPayload: GeofenceEventResult = {
        placeId: place.id,
        placeName: place.name,
        eventType: 'ENTER',
        distanceMeters: Math.round(distance),
        radiusMeters: place.radiusMeters,
      };

      triggeredEvents.push(eventPayload);
      emitGeofenceNotification(device.user.name, place.name, 'ENTER', recordedAt);
    }
    // CONDIÇÃO 2: Saiu do lugar (distância ultrapassou o raio + histerese)
    else if (distance > place.radiusMeters + hysteresis && isCurrentlyInside) {
      await prisma.placeEvent.create({
        data: {
          deviceId,
          placeId: place.id,
          eventType: 'EXIT',
          recordedAt,
        },
      });

      const eventPayload: GeofenceEventResult = {
        placeId: place.id,
        placeName: place.name,
        eventType: 'EXIT',
        distanceMeters: Math.round(distance),
        radiusMeters: place.radiusMeters,
      };

      triggeredEvents.push(eventPayload);
      emitGeofenceNotification(device.user.name, place.name, 'EXIT', recordedAt);
    }
  }

  return triggeredEvents;
}

// Emite alerta para o WebSocket e para o log/webhook
function emitGeofenceNotification(
  userName: string,
  placeName: string,
  eventType: 'ENTER' | 'EXIT',
  timestamp: Date
) {
  const actionText = eventType === 'ENTER' ? 'chegou em' : 'saiu de';
  const message = `🔔 ${userName} ${actionText} ${placeName}`;

  console.log(`[GEOFENCE ALERT] ${message} (${timestamp.toLocaleTimeString()})`);

  // Dispara no WebSocket para atualizar badges e toasts no mapa
  broadcastLocationUpdate({
    type: 'GEOFENCE_ALERT',
    alert: {
      userName,
      placeName,
      eventType,
      message,
      timestamp,
    },
  });
}
