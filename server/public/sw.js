const CACHE_NAME = 'life360-v12';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css?v=12',
  '/app.js?v=12',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de API e WebSockets do cache
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Recebe notificações Web Push (VAPID) mesmo com navegador fechado
self.addEventListener('push', (event) => {
  let data = {
    title: 'My Life360',
    body: 'Novo alerta da família',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (_err) {
      data.body = event.data.text();
    }
  }

  const isSos = String(data.title || '').includes('SOS');

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: isSos ? [300, 150, 300, 150, 500] : [150, 100, 150],
    tag: data.tag || 'life360-notification',
    renotify: true,
    requireInteraction: isSos, // Notificação de SOS permanece na tela até o usuário clicar
    data: data.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'My Life360', options));
});

// Ao clicar na notificação, foca ou abre a janela do app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
