import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configura o comportamento da notificação quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Cria os canais de notificação no Android com prioridade máxima
 */
export async function setupNotificationChannelsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações Gerais',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#762EEB',
    });

    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Alertas de Emergência e Colisão',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#DC2626',
      bypassDnd: true,
    });
  }
}

/**
 * Envia o token de push do aparelho para o servidor
 */
export async function sendPushTokenToServer(
  serverUrl: string,
  deviceIdentifier: string,
  apiKey: string,
  pushToken: string
): Promise<boolean> {
  try {
    const cleanUrl = (serverUrl || '').trim().replace(/\/$/, '');
    if (!cleanUrl || !pushToken) return false;

    const endpoint = `${cleanUrl}/api/push/register-device`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-key': (apiKey || '').trim(),
      },
      body: JSON.stringify({
        deviceIdentifier: (deviceIdentifier || '').trim(),
        pushToken: pushToken.trim(),
      }),
    });

    if (res.ok) {
      console.log('[NativePush] Token push registrado com sucesso na VPS');
      return true;
    } else {
      console.warn('[NativePush] Falha ao registrar token na VPS:', res.status);
      return false;
    }
  } catch (err) {
    console.error('[NativePush] Erro de rede ao enviar token para a VPS:', err);
    return false;
  }
}

/**
 * Pede permissão de notificação e obtém o token de push nativo do Expo/Android
 */
export async function registerForNativePushAsync(
  serverUrl: string,
  deviceIdentifier: string,
  apiKey: string
): Promise<string | null> {
  try {
    await setupNotificationChannelsAsync();

    if (!Device.isDevice) {
      console.log('[NativePush] Emulador: notificações push nativas exigem celular real.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NativePush] Permissão de notificação negada pelo usuário no Android');
      return null;
    }

    // Obtém o token Expo Push
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('[NativePush] Token Expo Push obtido:', token);

    if (serverUrl && token) {
      await sendPushTokenToServer(serverUrl, deviceIdentifier, apiKey, token);
    }

    return token;
  } catch (err) {
    console.error('[NativePush] Erro ao obter token push:', err);
    return null;
  }
}
