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
