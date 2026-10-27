import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK_NAME = 'background-location-task';

// Define a tarefa de rastreamento em segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocation] Erro na tarefa:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[locations.length - 1]; // Pega o ponto mais recente
      await sendTelemetryToServer(location);
    }
  }
});

// Envia telemetria para a VPS
export async function sendTelemetryToServer(location: Location.LocationObject) {
  try {
    const serverUrl = await AsyncStorage.getItem('server_url');
    const deviceId = await AsyncStorage.getItem('device_id');

    if (!serverUrl || !deviceId) {
      console.log('[BackgroundLocation] Servidor ou DeviceID não configurados.');
      return;
    }

    // Nível de bateria e status de carregamento
    let batteryLevel: number | undefined;
    let isCharging = false;

    try {
      const level = await Battery.getBatteryLevelAsync();
      batteryLevel = Math.round(level * 100);
      const state = await Battery.getBatteryStateAsync();
      isCharging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
    } catch {
      // Ignora erro de leitura de bateria em emuladores
    }

    const payload = {
      deviceIdentifier: deviceId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed ? location.coords.speed * 3.6 : 0, // m/s para km/h
      heading: location.coords.heading,
      battery: batteryLevel,
      isCharging,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    const endpoint = `${serverUrl.replace(/\/$/, '')}/api/telemetry`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[BackgroundLocation] Coordenada enviada com sucesso:', location.coords.latitude, location.coords.longitude);
      await AsyncStorage.setItem('last_sync', new Date().toISOString());
    } else {
      console.warn('[BackgroundLocation] Servidor respondeu com status:', response.status);
    }
  } catch (err: any) {
    console.error('[BackgroundLocation] Falha ao enviar telemetria:', err.message);
  }
}

// Inicia o serviço em segundo plano com Foreground Service discreto
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
      distanceInterval: 50, // Economia máxima de bateria: só dispara se andar > 50 metros
      deferredUpdatesInterval: 60000, // Envia a cada 60s
      foregroundService: {
        notificationTitle: 'My Life360 Ativo',
        notificationBody: 'Compartilhando localização segura com sua família.',
        notificationColor: '#3B82F6',
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
