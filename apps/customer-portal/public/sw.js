// Bumped whenever the caching rules change, so old caches are dropped on activate.
const CACHE_NAME = 'homepulse-v2';

// App shell resources to cache on install
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
];

// ── Install: cache shell ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean stale caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for pages, cache-first only for hashed build files ─
// Only files whose name changes with their content (Vite's /assets/*-<hash>.js|css)
// are safe to serve from cache forever. Everything else, including the dev
// server's /src and /node_modules modules, always comes from the network, so a
// code change can never be answered with an old copy.
const isHashedAsset = (path) => path.startsWith('/assets/') && /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|svg|jpg|webp)$/.test(path);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for API calls and other hosts
  if (url.pathname.startsWith('/api') || url.hostname !== self.location.hostname || event.request.method !== 'GET') {
    return;
  }

  // Navigation requests: network-first, fallback to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then((r) => r ?? fetch(event.request))
      )
    );
    return;
  }

  if (!isHashedAsset(url.pathname)) return;

  // Hashed build assets: cache-first
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
    )
  );
});

// ── Push: show notification ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'New notification', body: '', icon: '/icon-192.png', url: '/' };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  );
});

// ── Notification click: open / focus the portal ────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});
