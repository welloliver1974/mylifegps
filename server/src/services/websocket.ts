import { WebSocket } from 'ws';

// Conjunto de clientes conectados ao mapa ao vivo
const clients = new Set<WebSocket>();

export function registerWsClient(socket: WebSocket) {
  clients.add(socket);

  socket.on('close', () => {
    clients.delete(socket);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
}

// Dispara atualizações para todos os navegadores/apps com o mapa aberto
export function broadcastLocationUpdate(payload: any) {
  const message = JSON.stringify({
    type: 'LOCATION_UPDATE',
    data: payload,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Dispara Alerta de SOS / Pânico de Emergência em tempo real para o Círculo
export function broadcastSosAlert(payload: any) {
  const message = JSON.stringify({
    type: 'SOS_ALERT',
    alert: {
      id: Math.random().toString(36).substring(2, 9),
      userId: payload.userId,
      userName: payload.userName,
      userAvatar: payload.userAvatar,
      latitude: payload.latitude,
      longitude: payload.longitude,
      battery: payload.battery,
      triggeredAt: new Date().toISOString(),
      message: payload.message || `🚨 ALERTA DE EMERGÊNCIA: ${payload.userName || 'Membro da Família'} acionou o SOS!`,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Dispara mensagem de chat para todos os membros do círculo em tempo real
export function broadcastChatMessage(message: any) {
  const payload = JSON.stringify({
    type: 'CHAT_MESSAGE',
    message,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Dispara Check-in de Membro para todo o círculo (Recurso Life360)
export function broadcastCheckin(payload: any) {
  const message = JSON.stringify({
    type: 'CHECKIN_ALERT',
    alert: {
      id: Math.random().toString(36).substring(2, 9),
      userId: payload.userId,
      userName: payload.userName || 'Membro da Família',
      placeName: payload.placeName || 'Local Atual',
      timestamp: new Date().toISOString(),
      message: `📍 ${payload.userName || 'Membro'} fez Check-in: Estou seguro!`,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
