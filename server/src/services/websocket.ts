import { WebSocket } from 'ws';
import { broadcastPushNotification, sendPushToUser } from './push.js';

// Conjunto de clientes conectados ao mapa ao vivo
const clients = new Set<WebSocket>();
// Mapeamento de socket para userId do membro autenticado
const clientUsers = new Map<WebSocket, string>();

export function registerWsClient(socket: WebSocket, userId?: string) {
  clients.add(socket);
  if (userId) {
    clientUsers.set(socket, userId);
  }

  socket.on('close', () => {
    clients.delete(socket);
    clientUsers.delete(socket);
  });

  socket.on('error', () => {
    clients.delete(socket);
    clientUsers.delete(socket);
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
      id: payload.id || Math.random().toString(36).substring(2, 9),
      userId: payload.userId,
      userName: payload.userName,
      userAvatar: payload.userAvatar,
      latitude: payload.latitude,
      longitude: payload.longitude,
      battery: payload.battery,
      triggeredAt: payload.createdAt || new Date().toISOString(),
      message: payload.message || `🚨 ALERTA DE EMERGÊNCIA: ${payload.userName || 'Membro da Família'} acionou o SOS!`,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }

  // Notifica todos os outros membros do círculo via Web Push no celular
  broadcastPushNotification(
    {
      title: '🚨 ALERTA DE SOS / PÂNICO',
      body: payload.message || `Emergência: ${payload.userName || 'Membro da Família'} acionou o SOS!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'sos-alert',
      data: { url: '/', type: 'sos', userId: payload.userId, sosId: payload.id },
    },
    payload.userId
  ).catch((err) => console.error('[Push SOS Error]', err));
}

// Dispara Notificação de Resolução do SOS (Alerta cancelado ou resolvido)
export function broadcastSosResolved(payload: {
  id: string;
  status: string;
  resolvedByName?: string;
  resolvedAt: string;
}) {
  const message = JSON.stringify({
    type: 'SOS_RESOLVED',
    alert: payload,
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

// Dispara reação em mensagem do círculo em tempo real (Etapa 9.5)
export function broadcastChatReaction(payload: {
  messageId: string;
  reactions: any;
  userId: string;
  userName: string;
  emoji: string;
  action: 'added' | 'removed';
}) {
  const message = JSON.stringify({
    type: 'CHAT_REACTION',
    data: payload,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Dispara reação em mensagem direta 1:1 apenas para os dois participantes (Etapa 9.5)
export function broadcastDmReaction(payload: {
  messageId: string;
  reactions: any;
  userId: string;
  userName: string;
  emoji: string;
  action: 'added' | 'removed';
  senderId: string;
  receiverId: string;
}) {
  const message = JSON.stringify({
    type: 'DM_REACTION',
    data: payload,
  });

  for (const [socket, userId] of clientUsers.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      if (userId === payload.senderId || userId === payload.receiverId) {
        socket.send(message);
      }
    }
  }
}

// Notifica por Web Push os membros mencionados com @nome (Etapa 9.5)
export function notifyMentions(payload: {
  mentions: { id: string; name: string }[];
  authorName: string;
  text: string;
  isDirect?: boolean;
}) {
  const { mentions, authorName, text, isDirect } = payload;
  const snippet = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  for (const mention of mentions) {
    sendPushToUser(mention.id, {
      title: `${isDirect ? '💬' : '📣'} ${authorName} mencionou você`,
      body: snippet,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `mention-${mention.id}`,
      data: { url: '/', type: 'mention', mentionId: mention.id },
    }).catch((err) => console.error('[Push Mention Error]', err));
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

  // Notifica via Web Push
  broadcastPushNotification(
    {
      title: '📍 Check-in de Família',
      body: `${payload.userName || 'Membro'} fez check-in: Estou seguro!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'checkin-alert',
      data: { url: '/', type: 'checkin' },
    },
    payload.userId
  ).catch((err) => console.error('[Push Checkin Error]', err));
}

// Dispara mensagem direta (1:1) apenas para o remetente e destinatário
export function sendDirectMessage(message: any) {
  const payload = JSON.stringify({
    type: 'DIRECT_MESSAGE',
    message,
  });

  const { senderId, receiverId, senderName, text } = message;

  // Entrega em tempo real para os sockets abertos dos dois participantes
  for (const [socket, userId] of clientUsers.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      if (userId === senderId || userId === receiverId) {
        socket.send(payload);
      }
    }
  }

  // Notifica o destinatário via Web Push caso esteja com o app fechado
  if (receiverId) {
    sendPushToUser(receiverId, {
      title: `💬 ${senderName || 'Mensagem Privada'}`,
      body: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `dm-${senderId}`,
      data: { url: '/', type: 'dm', senderId },
    }).catch((err) => console.error('[Push DM Error]', err));
  }
}

// Notifica leitura de mensagens diretas
export function broadcastDmRead(payload: {
  senderId: string;
  receiverId: string;
  readAt: string;
}) {
  const message = JSON.stringify({
    type: 'DM_READ',
    data: payload,
  });

  for (const [socket, userId] of clientUsers.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      if (userId === payload.senderId || userId === payload.receiverId) {
        socket.send(message);
      }
    }
  }
}

// Dispara solicitação de atualização forçada de localização ("Atualizar agora" - Etapa 9.4)
export function broadcastLocationUpdateRequest(payload: {
  userId: string;
  userName: string;
  requestedBy: string;
  requestedAt: string;
}) {
  const message = JSON.stringify({
    type: 'LOCATION_UPDATE_REQUEST',
    data: payload,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }

  // Notifica o membro alvo via Web Push silencioso/alta prioridade caso o app esteja fechado
  if (payload.userId) {
    sendPushToUser(payload.userId, {
      title: '📍 Atualização Solicitada',
      body: `${payload.requestedBy || 'Um familiar'} solicitou sua posição em tempo real.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'location-update-request',
      data: { url: '/', type: 'request_location_update' },
    }).catch((err) => console.error('[Push Request Update Error]', err));
  }
}

