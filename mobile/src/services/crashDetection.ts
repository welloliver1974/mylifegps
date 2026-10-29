import { Accelerometer } from 'expo-sensors';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';
import {
  calculateGForce,
  getGForceSeverity,
  normalizeCrashConfig,
  resolveThreshold,
  shouldTriggerCrashFlow,
  DEFAULT_COUNTDOWN_SECONDS,
  DEFAULT_MIN_SPEED_KMH,
  DEFAULT_SENSITIVITY,
  type CrashSensitivity,
  type CrashSeverity,
} from './crashMath';

export type { CrashSensitivity, CrashSeverity };
export {
  SENSITIVITY_THRESHOLDS,
  calculateGForce,
  getGForceSeverity,
  isCrashImpact,
  isSpeedEligible,
  formatCrashMessage,
} from './crashMath';

export interface CrashEvent {
  id: string;
  timestamp: number;
  gForce: number;
  speedKmh: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  battery?: number;
  severity: CrashSeverity;
  isSimulation?: boolean;
}

export interface CrashConfig {
  enabled: boolean;
  sensitivity: CrashSensitivity;
  minSpeedKmh: number;
  countdownSeconds: number;
}

export const DEFAULT_CRASH_CONFIG: CrashConfig = {
  enabled: true,
  sensitivity: DEFAULT_SENSITIVITY,
  minSpeedKmh: DEFAULT_MIN_SPEED_KMH,
  countdownSeconds: DEFAULT_COUNTDOWN_SECONDS,
};

// ============================================================================
// Estado em Memória do Rastreador de Movimento
// ============================================================================

interface MovementState {
  speedKmh: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  lastUpdated: number;
}

const currentMovement: MovementState = {
  speedKmh: 0,
  lastUpdated: Date.now(),
};

/** Atualiza o estado instantâneo de deslocamento GPS (chamado pelo locationTask). */
export function updateMovementState(update: Partial<MovementState>) {
  if (typeof update.speedKmh === 'number' && !isNaN(update.speedKmh)) {
    currentMovement.speedKmh = Math.max(0, update.speedKmh);
  }
  if (typeof update.latitude === 'number') currentMovement.latitude = update.latitude;
  if (typeof update.longitude === 'number') currentMovement.longitude = update.longitude;
  if (typeof update.accuracy === 'number') currentMovement.accuracy = update.accuracy;
  currentMovement.lastUpdated = Date.now();
}

export function getCurrentMovementState(): Readonly<MovementState> {
  return { ...currentMovement };
}

// ============================================================================
// Persistência de Configuração no AsyncStorage
// ============================================================================

const STORAGE_KEY_CONFIG = 'crash_detection_config';

export async function loadCrashConfig(): Promise<CrashConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_CRASH_CONFIG };
    return normalizeCrashConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CRASH_CONFIG };
  }
}

export async function saveCrashConfig(updates: Partial<CrashConfig>): Promise<CrashConfig> {
  const current = await loadCrashConfig();
  const merged: CrashConfig = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
  return merged;
}

// ============================================================================
// Monitoramento Ativo do Acelerômetro
// ============================================================================

let accelerometerSubscription: { remove: () => void } | null = null;
let lastTriggerTime = 0;
const TRIGGER_COOLDOWN_MS = 45000; // 45 s de silêncio após um disparo, para não repetir o alerta em loop

/**
 * Inicia a escuta em tempo real do acelerômetro nativo do dispositivo.
 */
export async function startCrashMonitoring(
  onCrashDetected: (event: CrashEvent) => void
): Promise<{ success: boolean; reason?: string }> {
  try {
    const config = await loadCrashConfig();
    if (!config.enabled) {
      stopCrashMonitoring();
      return { success: false, reason: 'Detecção desativada pelo usuário.' };
    }

    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, reason: 'Acelerômetro não disponível neste aparelho ou emulador.' };
    }

    // Reinicia caso já houvesse uma escuta ativa
    stopCrashMonitoring();

    // Amostragem de 100 ms (10 leituras/s). No Android 12+ a permissão
    // HIGH_SAMPLING_RATE_SENSORS (app.json) libera intervalos abaixo de 200 ms.
    Accelerometer.setUpdateInterval(100);

    accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = calculateGForce(x, y, z);

      const eligible = shouldTriggerCrashFlow({
        magnitude,
        speedKmh: currentMovement.speedKmh,
        sensitivity: config.sensitivity,
        minSpeedKmh: config.minSpeedKmh,
      });
      if (!eligible) return;

      const now = Date.now();
      if (now - lastTriggerTime < TRIGGER_COOLDOWN_MS) {
        return; // Ainda em período de cooldown
      }
      lastTriggerTime = now;

      const event: CrashEvent = {
        id: `crash-${now}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        gForce: magnitude,
        speedKmh: currentMovement.speedKmh,
        latitude: currentMovement.latitude,
        longitude: currentMovement.longitude,
        accuracy: currentMovement.accuracy,
        severity: getGForceSeverity(magnitude),
        isSimulation: false,
      };

      // Vibra imediatamente para alertar o condutor
      try {
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      } catch {}

      onCrashDetected(event);
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message || 'Falha ao iniciar acelerômetro.' };
  }
}

/** Encerra a escuta do sensor. */
export function stopCrashMonitoring() {
  if (accelerometerSubscription) {
    try {
      accelerometerSubscription.remove();
    } catch {}
    accelerometerSubscription = null;
  }
}

/**
 * Simula um evento de colisão para a família testar o fluxo sem bater o carro.
 */
export function simulateCrashEvent(onCrashDetected: (event: CrashEvent) => void): CrashEvent {
  const now = Date.now();
  const event: CrashEvent = {
    id: `sim-crash-${now}`,
    timestamp: now,
    gForce: 3.4,
    speedKmh: currentMovement.speedKmh > 0 ? currentMovement.speedKmh : 48,
    latitude: currentMovement.latitude,
    longitude: currentMovement.longitude,
    accuracy: currentMovement.accuracy || 10,
    severity: 'moderate',
    isSimulation: true,
  };

  try {
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
  } catch {}

  onCrashDetected(event);
  return event;
}

// ============================================================================
// Envio do Alerta de Acidente ao Servidor (após o fim da contagem de segurança)
// ============================================================================

export async function sendCrashEmergencySos(event: CrashEvent): Promise<{
  success: boolean;
  event?: any;
  error?: string;
}> {
  try {
    const serverUrl = await AsyncStorage.getItem('server_url');
    const deviceId = (await AsyncStorage.getItem('device_id')) || '';
    const deviceKey = (await AsyncStorage.getItem('device_api_key')) || '';
    const cleanKey = deviceKey.trim().replace(/^["']|["']$/g, '');

    if (!serverUrl) {
      return { success: false, error: 'URL do servidor não configurada.' };
    }

    // Resgata a posição mais recente se o evento não trouxer coordenadas
    let lat = event.latitude;
    let lon = event.longitude;
    let accuracy = event.accuracy;

    if (lat === undefined || lon === undefined) {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
        accuracy = loc.coords.accuracy ?? undefined;
      } catch {}
    }

    let batteryLevel: number | undefined;
    try {
      const b = await Battery.getBatteryLevelAsync();
      if (typeof b === 'number' && b >= 0) batteryLevel = Math.round(b * 100);
    } catch {}

    const payload = {
      deviceIdentifier: deviceId.trim(),
      apiKey: cleanKey,
      type: 'CRASH',
      gForce: event.gForce,
      speedKmh: event.speedKmh,
      isSimulation: event.isSimulation || false,
      latitude: lat,
      longitude: lon,
      accuracy,
      battery: batteryLevel,
      // Sem `message`: o servidor compõe o texto com o nome real do membro do círculo,
      // evitando expor o identificador técnico do aparelho no alerta da família.
    };

    // Rota pública autenticada pela chave do aparelho (x-device-key):
    // o sensor nativo dispara mesmo em segundo plano, sem sessão de usuário carregada.
    const endpoint = `${serverUrl.replace(/\/$/, '')}/api/emergency/crash`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cleanKey) {
      headers['x-device-key'] = cleanKey;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, event: data.event };
    }

    let parsedError = '';
    try {
      const json = await response.json();
      parsedError = json.error || json.message || '';
    } catch {
      parsedError = await response.text().catch(() => '');
    }
    return { success: false, error: parsedError || `Status HTTP ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de conexão com o servidor.' };
  }
}

/**
 * Encerra o alerta de colisão quando o condutor confirma que está bem.
 * Usa a rota pública autenticada pela chave do aparelho.
 */
export async function resolveCrashEmergencySos(sosId: string): Promise<boolean> {
  try {
    const serverUrl = await AsyncStorage.getItem('server_url');
    const deviceId = (await AsyncStorage.getItem('device_id')) || '';
    const deviceKey = (await AsyncStorage.getItem('device_api_key')) || '';
    const cleanKey = deviceKey.trim().replace(/^["']|["']$/g, '');

    if (!serverUrl || !sosId) return false;

    const endpoint = `${serverUrl.replace(/\/$/, '')}/api/emergency/crash/${sosId}/cancel`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cleanKey ? { 'x-device-key': cleanKey } : {}),
      },
      body: JSON.stringify({ deviceIdentifier: deviceId.trim(), apiKey: cleanKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Limiar em Gs da sensibilidade atual (usado na interface de ajustes). */
export function thresholdForSensitivity(sensitivity: CrashSensitivity): number {
  return resolveThreshold(sensitivity);
}
