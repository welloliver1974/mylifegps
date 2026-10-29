import { prisma } from '../db.js';
import { broadcastLocationUpdate } from './websocket.js';
import { checkGeofencesForDevice } from './geofence.js';
import { checkBatteryAlert } from './batteryAlert.js';

export interface TelemetryInput {
  deviceIdentifier: string; // Ex: ID do Traccar ou IMEI/UUID
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery?: number;
  isCharging?: boolean;
  recordedAt?: Date;
}

export async function processTelemetry(input: TelemetryInput) {
  // 1. Localiza ou registra o dispositivo
  let device = await prisma.device.findUnique({
    where: { deviceIdentifier: input.deviceIdentifier },
    include: { user: true },
  });

  // Se o dispositivo ainda não existe, cria um padrão vinculado ao usuário principal
  if (!device) {
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: 'Família',
          color: '#3B82F6',
        },
      });
    }

    device = await prisma.device.create({
      data: {
        name: `Aparelho ${input.deviceIdentifier}`,
        deviceIdentifier: input.deviceIdentifier,
        userId: defaultUser.id,
      },
      include: { user: true },
    });
  }

  const recordedAt = input.recordedAt ?? new Date();

  // Preserva a última bateria conhecida se o ponto atual não informou (ex: ping web sem sensor ou GPS puro)
  let effectiveBattery =
    input.battery !== undefined && input.battery !== null && !isNaN(input.battery) && input.battery >= 0
      ? (input.battery > 0 && input.battery <= 1 ? Math.round(input.battery * 100) : Math.round(input.battery))
      : undefined;
  let effectiveIsCharging = input.isCharging;

  if (effectiveBattery === undefined) {
    const lastLocWithBattery = await prisma.locationRecord.findFirst({
      where: { deviceId: device.id, battery: { not: null } },
      orderBy: { recordedAt: 'desc' },
      select: { battery: true, isCharging: true },
    });
    if (lastLocWithBattery && lastLocWithBattery.battery !== null) {
      effectiveBattery = lastLocWithBattery.battery;
      if (effectiveIsCharging === undefined) {
        effectiveIsCharging = lastLocWithBattery.isCharging;
      }
    }
  }

  // 2. Registra o ponto de telemetria no histórico
  const record = await prisma.locationRecord.create({
    data: {
      deviceId: device.id,
      latitude: input.latitude,
      longitude: input.longitude,
      altitude: input.altitude,
      accuracy: input.accuracy,
      speed: input.speed,
      heading: input.heading,
      battery: effectiveBattery,
      isCharging: effectiveIsCharging ?? false,
      recordedAt,
    },
  });

  // 3. Atualiza o último visto do dispositivo
  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeenAt: recordedAt },
  });

  // 3.1 Monitora nível de bateria fraca (< 15%) com histerese (Etapa 10.1)
  if (record.battery !== null && record.battery !== undefined) {
    checkBatteryAlert(device, record.battery, record.isCharging).catch((err) => {
      console.error('[BatteryAlert Error]', err);
    });
  }

  // 4. Verifica Cercas Virtuais (Geofencing)
  const geofenceEvents = await checkGeofencesForDevice(
    device.id,
    record.latitude,
    record.longitude,
    record.accuracy || 0,
    recordedAt
  );

  // 5. Envia para o WebSocket em tempo real para quem estiver vendo o mapa
  const livePayload = {
    userId: device.userId,
    userName: device.user.name,
    userColor: device.user.color,
    userAvatar: device.user.avatarUrl,
    deviceId: device.id,
    deviceName: device.name,
    latitude: record.latitude,
    longitude: record.longitude,
    accuracy: record.accuracy,
    speed: record.speed,
    heading: record.heading,
    battery: record.battery,
    isCharging: record.isCharging,
    recordedAt: record.recordedAt,
    geofenceEvents,
  };

  broadcastLocationUpdate(livePayload);

  return livePayload;
}
