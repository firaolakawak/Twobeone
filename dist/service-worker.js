const CACHE_NAME = 'twobeone-v1.0.0';
const RUNTIME_CACHE = 'twobeone-runtime';
const OFFLINE_URL = '/offline.html';

// Files to cache immediately on install
const PRECACHE_URLS = [
  '/',
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

// Fetch event - network first, then cache, with offline fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Network first strategy for API calls
        if (event.request.url.includes('/functions/v1/')) {
          return fetch(event.request)
            .then((response) => {
              // Clone the response before caching
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
              return response;
            })
            .catch(() => {
              // Return cached version if network fails
              return cachedResponse || new Response(
                JSON.stringify({ error: 'Offline - please check your connection' }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            });
        }

        // Cache first strategy for static assets
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network and cache for future
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Offline');
          });
      })
  );
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
  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
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

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
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