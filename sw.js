const CACHE_NAME = 'vitalcore-v3';
const ASSETS = [
  '/vitalcore-health/',
  '/vitalcore-health/index.html',
  '/vitalcore-health/manifest.json',
  '/vitalcore-health/icons/icon-192.png',
  '/vitalcore-health/icons/icon-512.png'
];

// How long to wait for the network before falling back to cache, for
// requests that should always try to be fresh (index.html / navigations).
// Keeps the app fast on poor connections while still picking up updates
// automatically whenever a network response arrives in time.
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Race a fetch against a timeout — resolves with the network response if it
// arrives in time, otherwise rejects so the caller can fall back to cache.
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network timeout')), timeoutMs);
    fetch(request).then(res => { clearTimeout(timer); resolve(res); })
                   .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// Is this a request that should always try the network first, so updates
// (pushed "whenever possible", not on a fixed schedule) are picked up
// automatically without the user or developer having to do anything?
function isFreshnessSensitive(request) {
  return request.mode === 'navigate' || request.url.endsWith('/index.html') || request.url.endsWith('/vitalcore-health/');
}

self.addEventListener('fetch', e => {
  if (isFreshnessSensitive(e.request)) {
    // Network-first with a timeout: try to get the latest version, but
    // don't make the user wait forever on a slow/dead connection — fall
    // back to whatever's cached (and cache the fresh response for next time).
    e.respondWith(
      fetchWithTimeout(e.request, NETWORK_TIMEOUT_MS)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, resClone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/vitalcore-health/index.html')))
    );
    return;
  }
  // Everything else (icons, manifest, etc.) — cache-first, since these
  // rarely change and don't need a freshness check on every load.
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .catch(() => caches.match('/vitalcore-health/index.html'))
      )
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'VitalCore', body: 'Health check-in time!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/vitalcore-health/icons/icon-192.png',
      badge: '/vitalcore-health/icons/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
