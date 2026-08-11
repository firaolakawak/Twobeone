// TwoBeOne Service Worker
// Strategy:
//   - App shell (HTML/JS/CSS): cache-first, update in background
//   - Static assets (images, fonts, icons): cache-first, long TTL
//   - API calls (supabase functions): network-first, cache fallback
//   - Everything else: stale-while-revalidate

const CACHE_VERSION  = 'v2';
const SHELL_CACHE    = `twobeone-shell-${CACHE_VERSION}`;
const STATIC_CACHE   = `twobeone-static-${CACHE_VERSION}`;
const API_CACHE      = `twobeone-api-${CACHE_VERSION}`;

// App-shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use individual adds so a single 404 doesn't abort everything
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

// ─── Activate — prune old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const VALID = new Set([SHELL_CACHE, STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !VALID.has(k)).map((k) => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isApiRequest(url) {
  return url.includes('/functions/v1/') || url.includes('.supabase.co');
}

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|otf|ico)(\?|$)/.test(url);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Network-first: try network, fall back to cache
async function networkFirst(request, cacheName) {
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Offline — check your connection' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cache-first: serve from cache, update in background
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh cache in background (stale-while-revalidate)
    fetch(request).then((res) => {
      if (res.ok) caches.open(cacheName).then((c) => c.put(request, res));
    }).catch(() => {});
    return cached;
  }
  try {
    const networkRes = await fetch(request);
    if (networkRes.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    // Return offline page for navigation, empty for assets
    if (isNavigationRequest(request)) {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    return new Response('', { status: 503 });
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET and cross-origin (except Supabase API)
  if (request.method !== 'GET') return;
  if (!url.startsWith(self.location.origin) && !isApiRequest(url)) return;

  // Supabase API → network-first (data must be fresh)
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets (images, fonts, icons) → cache-first, long-lived
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // App shell / navigation → cache-first with background refresh
  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

// ─── Message handler (SKIP_WAITING from app) ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
