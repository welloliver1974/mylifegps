import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateMovementState } from './crashDetection';

export const LOCATION_TASK_NAME = 'background-location-task';

// Define a tarefa de rastreamento em segundo plano (disparada pelo sistema operacional)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocation] Erro na tarefa:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[locations.length - 1]; // Ponto mais recente
      await sendTelemetryToServer(location);
    }
  }
});

// Envia telemetria para a VPS
export async function sendTelemetryToServer(location: Location.LocationObject): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const serverUrl = await AsyncStorage.getItem('server_url');
    const deviceId = await AsyncStorage.getItem('device_id');
    const deviceKey = await AsyncStorage.getItem('device_api_key');

    if (!serverUrl || !deviceId) {
      console.log('[BackgroundLocation] Servidor ou DeviceID não configurados.');
      return { ok: false, error: 'Servidor ou DeviceID não configurados.' };
    }

    // Nível de bateria e status de carregamento
    let batteryLevel: number | undefined;
    let isCharging = false;

    try {
      const level = await Battery.getBatteryLevelAsync();
      if (typeof level === 'number' && level >= 0) {
        batteryLevel = level <= 1 ? Math.round(level * 100) : Math.round(level);
      }
      const state = await Battery.getBatteryStateAsync();
      isCharging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
    } catch {
      // Ignora erro de leitura de bateria em emuladores ou dispositivos sem sensor
    }

    const cleanKey = (deviceKey || '').trim().replace(/^["']|["']$/g, '');
    const cleanId = (deviceId || '').trim();
    const speedKmh = location.coords.speed ? Math.round(location.coords.speed * 3.6) : 0;

    // Sincroniza velocidade e posição com o motor de detecção de colisão (Etapa 9.3)
    updateMovementState({
      speedKmh,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: typeof location.coords.accuracy === 'number' ? location.coords.accuracy : undefined,
    });

    const payload = {
      deviceIdentifier: cleanId,
      apiKey: cleanKey,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: speedKmh, // m/s para km/h
      heading: location.coords.heading,
      battery: batteryLevel,
      isCharging,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    const endpoint = `${serverUrl.replace(/\/$/, '')}/api/telemetry`;

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
      console.log('[BackgroundLocation] Coordenada enviada com sucesso:', location.coords.latitude, location.coords.longitude);
      await AsyncStorage.setItem('last_sync', new Date().toISOString());
      return { ok: true, status: response.status };
    } else {
      let parsedError = '';
      try {
        const json = await response.json();
        parsedError = json.error || json.message || '';
      } catch {
        parsedError = await response.text().catch(() => '');
      }
      console.warn('[BackgroundLocation] Servidor respondeu com status:', response.status, parsedError);
      return { ok: false, status: response.status, error: parsedError || `Status HTTP ${response.status}` };
    }
  } catch (err: any) {
    console.error('[BackgroundLocation] Falha ao enviar telemetria:', err.message);
    return { ok: false, error: err.message || 'Erro desconhecido de rede' };
  }
}

// Testa a conexão enviando a coordenada atual imediatamente
export async function testTelemetryConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const serverUrl = await AsyncStorage.getItem('server_url');
    const deviceId = await AsyncStorage.getItem('device_id');
    const deviceKey = await AsyncStorage.getItem('device_api_key');

    if (!serverUrl || !deviceId) {
      return { success: false, message: 'Preencha a URL do servidor e o Identificador do celular.' };
    }
    if (!deviceKey) {
      return { success: false, message: 'Chave de telemetria ausente. Copie do painel web em "Dispositivos".' };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, message: 'Permissão de localização do Android não concedida.' };
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const res = await sendTelemetryToServer(loc);

    if (res.ok) {
      return {
        success: true,
        message: `Coordenada enviada com sucesso!\nLat: ${loc.coords.latitude.toFixed(5)}, Lon: ${loc.coords.longitude.toFixed(5)}`,
      };
    } else {
      return {
        success: false,
        message: res.error || `Erro de autorização (${res.status}). Verifique a chave no painel web.`,
      };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Falha ao testar conexão.' };
  }
}

/**
 * Captura imediata de alta precisão ("Atualizar agora" — Etapa 9.4).
 * Disparada quando um familiar solicita a posição pelo painel web.
 */
export async function forceImmediateLocationUpdate(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, error: 'Permissão de localização não concedida.' };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const res = await sendTelemetryToServer(loc);
    return { ok: res.ok, error: res.error };
  } catch (err: any) {
    console.error('[ForceUpdate] Falha na captura imediata:', err?.message);
    return { ok: false, error: err?.message || 'Falha ao obter posição.' };
  }
}

// Inicia o rastreamento em segundo plano com Foreground Service discreto
export async function startLocationTracking() {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    throw new Error('Permissão de localização em primeiro plano negada.');
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    throw new Error('Permissão de localização o tempo todo (segundo plano) negada.');
  }

  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!isStarted) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50, // Economia máxima de bateria: só envia se andar > 50 metros
      deferredUpdatesInterval: 60000, // No máximo uma vez por minuto quando em movimento
      foregroundService: {
        notificationTitle: 'My Life360 Ativo',
        notificationBody: 'Compartilhando localização com o círculo familiar.',
        notificationColor: '#762EEB',
      },
    });
  }
}

export async function stopLocationTracking() {
  const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
