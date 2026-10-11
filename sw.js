// DairyERP Service Worker (PWA Offline & Instant Cache)
// Auto-incremented build token:
const CACHE_VERSION = 'dairy-erp-va8a7ba0-mv49ku3x';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/portal.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Use addAll with error tolerance so third-party CDN issues don't abort install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW Precache Warning]', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches automatically on version bump
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION && key.startsWith('dairy-erp-')) {
            console.log('[SW Cache Cleanup] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. Static UI & CDN Assets -> Cache-First with Network Fallback
// 2. Read-only API (/api/animals, /api/dashboard/stats) -> Stale-While-Revalidate with offline fallback
// 3. Mutating API (POST, PUT, DELETE) & Auth -> Network-Only
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests (mutations always require live connection or local queues)
  if (req.method !== 'GET') {
    return;
  }

  // API endpoints: Stale-While-Revalidate for offline barn viewing
  if (url.pathname.startsWith('/api/animals') || url.pathname.startsWith('/api/dashboard/stats')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cachedResponse = await cache.match(req);
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[SW Offline] Network failed, serving cached fallback for', url.pathname);
          return cachedResponse;
        });

        // Return cached immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Auth endpoints: always Network-Only
  if (url.pathname.startsWith('/api/auth/')) {
    return;
  }

  // Static Assets & App Shell: Cache-First
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        // Cache successful local assets and CDN resources
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin || url.hostname.includes('cdn') || url.hostname.includes('googleapis'))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for HTML navigation
        if (req.mode === 'navigate') {
          return caches.match('/portal.html') || caches.match('/index.html');
        }
      });
    })
  );
});

// Push Notifications Listener (Ready for Paid Pro Tier & Telegram alerts)
self.addEventListener('push', (event) => {
  let data = { title: 'DairyERP Сповіщення', body: 'Оновлення статусу стада або каренції ліків.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'dairy-alert',
      url: data.url || '/portal.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('portal.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/portal.html');
      }
    })
  );
});
