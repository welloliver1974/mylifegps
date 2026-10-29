import { broadcastPushNotification } from './push.js';
import { broadcastBatteryLowAlert } from './websocket.js';

interface DeviceAlertState {
  lastAlertAt: number;
  lastAlertBattery: number;
}

// Guarda o estado de alerta por aparelho em memória
const alertStateByDevice = new Map<string, DeviceAlertState>();

// Cooldown padrão: 4 horas para não espamar o círculo da família
const LOW_BATTERY_COOLDOWN_MS = 4 * 60 * 60 * 1000;
// Cooldown crítico: 30 minutos se a bateria cair para <= 5%
const CRITICAL_BATTERY_COOLDOWN_MS = 30 * 60 * 1000;

export interface BatteryDeviceContext {
  id: string;
  name: string;
  userId: string;
  user?: {
    name: string;
  } | null;
}

/**
 * Avalia se o nível de bateria atual deve disparar alerta de bateria fraca (< 15%)
 * para o círculo familiar.
 *
 * Regras:
 * 1. Bateria <= 15% e aparelho não está carregando.
 * 2. Histerese: se a bateria subir para >= 30%, limpa o cooldown (recarregou).
 * 3. Cooldown de 4h entre alertas ordinários (< 15%).
 * 4. Alerta de emergência (< 5%) permitido após 30 min do primeiro alerta.
 */
export async function checkBatteryAlert(
  device: BatteryDeviceContext,
  battery: number | null | undefined,
  isCharging?: boolean
): Promise<{ triggered: boolean; reason?: string }> {
  if (battery === undefined || battery === null || isNaN(battery) || battery < 0) {
    return { triggered: false, reason: 'Nível de bateria ausente ou inválido' };
  }

  const roundedBattery = Math.round(battery);

  // Se o celular estiver carregando ou a bateria recuperou (>= 30%), limpa o histórico de alerta
  if (isCharging || roundedBattery >= 30) {
    if (alertStateByDevice.has(device.id)) {
      alertStateByDevice.delete(device.id);
    }
    return { triggered: false, reason: 'Dispositivo carregando ou com carga normal' };
  }

  // Só alerta se estiver <= 15%
  if (roundedBattery > 15) {
    return { triggered: false, reason: 'Bateria acima do limiar de 15%' };
  }

  const now = Date.now();
  const lastState = alertStateByDevice.get(device.id);
  const isCritical = roundedBattery <= 5;

  if (lastState) {
    const elapsed = now - lastState.lastAlertAt;

    // Se já alertou em nível crítico ou se o cooldown ainda não passou
    if (isCritical && lastState.lastAlertBattery > 5 && elapsed >= CRITICAL_BATTERY_COOLDOWN_MS) {
      // Permite alerta de bateria crítica (caiu para <= 5% e já faz > 30min do alerta anterior)
    } else if (elapsed < LOW_BATTERY_COOLDOWN_MS) {
      return {
        triggered: false,
        reason: `Alerta recente já emitido há ${Math.round(elapsed / 60000)} minutos (cooldown)`,
      };
    }
  }

  // Atualiza o estado
  alertStateByDevice.set(device.id, {
    lastAlertAt: now,
    lastAlertBattery: roundedBattery,
  });

  const memberName = device.user?.name || 'Membro da Família';
  const alertTitle = isCritical ? '🪫 BATERIA CRÍTICA' : '🪫 Bateria Fraca';
  const alertBody = isCritical
    ? `Atenção: A bateria de ${memberName} está acabando (${roundedBattery}%)!`
    : `A bateria de ${memberName} está em ${roundedBattery}%.`;

  // 1. Notifica via WebSocket os clientes conectados ao mapa
  broadcastBatteryLowAlert({
    userId: device.userId,
    userName: memberName,
    deviceId: device.id,
    deviceName: device.name,
    battery: roundedBattery,
    isCharging: false,
    recordedAt: new Date().toISOString(),
  });

  // 2. Notifica o círculo via Web Push (excluindo o próprio usuário para não duplicar no aparelho dele)
  broadcastPushNotification(
    {
      title: alertTitle,
      body: alertBody,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `battery-${device.id}`,
      data: {
        url: '/',
        type: 'battery_low',
        userId: device.userId,
        battery: roundedBattery,
      },
    },
    device.userId
  ).catch((err) => {
    console.error('[Battery Push Error]', err);
  });

  console.log(`[BatteryAlert] 🪫 Alerta de bateria (${roundedBattery}%) emitido para ${memberName} (${device.name})`);

  return { triggered: true };
}

/**
 * Reseta o mapa em memória (útil para testes automatizados)
 */
export function resetBatteryAlertState() {
  alertStateByDevice.clear();
}
