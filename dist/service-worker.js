const CACHE_NAME = 'twobeone-shell-v4';
const RUNTIME_CACHE = 'twobeone-runtime-v4';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching app shell');
        // Cache individually — addAll fails entirely if any URL 404s
        return Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url).catch(e => console.warn("[SW] Skip:", url))));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

async function navigationNetworkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
  }
}

function isCodeAsset(request) {
  const pathname = new URL(request.url).pathname;
  return request.destination === 'script' || request.destination === 'style' || /\/assets\/.*\.(js|css)$/.test(pathname);
}

async function codeAssetNetworkFirst(request) {
  try {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type') || '';
    const expectedType = request.destination === 'style' || request.url.endsWith('.css') ? 'text/css' : 'javascript';

    // Vercel's SPA fallback can return index.html for an obsolete chunk URL.
    // Never cache or serve that HTML as JavaScript/CSS.
    if (!response.ok || !contentType.includes(expectedType)) {
      return new Response('Asset version is no longer available', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || new Response('Offline', { status: 503 });
  }
}

// Fetch event - fresh HTML and code, cached static assets, offline fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(event.request));
    return;
  }

  if (isCodeAsset(event.request)) {
    event.respondWith(codeAssetNetworkFirst(event.request));
    return;
  }

  event.respondWith(caches.match(event.request).then(async (cachedResponse) => {
    if (cachedResponse) return cachedResponse;
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'error') {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return new Response('Offline', { status: 503 });
    }
  }));
});

// Handle background sync for prayer requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-prayers') {
    event.waitUntil(syncPrayers());
  }
  
  if (event.tag === 'sync-journal') {
    event.waitUntil(syncJournal());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'TwoBeOne';
  const notificationData = (data && typeof data === 'object' && data !== null) ? data : { url: data || '/' };
  const options = {
    body: notificationData.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    renotify: true,
    data: notificationData,
    tag: notificationData.tag || 'twobeone-notification',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const rawData = event.notification.data || {};
  const targetUrl = typeof rawData === 'string'
    ? rawData
    : rawData.url || '/';
  const url = targetUrl.startsWith('http') ? targetUrl : new URL(targetUrl, self.location.origin).toString();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(url);
            }
          }
        }
        return clients.openWindow(url);
      })
    );
  }
});

// Handle messages from clients (for SKIP_WAITING)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skipping waiting...');
    self.skipWaiting();
  }
});

// Helper functions for background sync
async function syncPrayers() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    const prayerRequests = requests.filter(req => req.url.includes('/prayers'));
    
    for (const request of prayerRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync prayer:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync prayers failed:', error);
  }
}

async function syncJournal() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    const journalRequests = requests.filter(req => req.url.includes('/journal'));
    
    for (const request of journalRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync journal:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync journal failed:', error);
  }
}

// Periodic background sync (for daily devotionals)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-devotional-sync') {
    event.waitUntil(fetchDailyDevotional());
  }
});

async function fetchDailyDevotional() {
  try {
    const response = await fetch('/functions/v1/make-server-6d579fee/devotionals/today');
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put('/devotional/today', response);
    }
  } catch (error) {
    console.error('[Service Worker] Failed to fetch daily devotional:', error);
  }
}
