/*
 * Zontes Putrajaya Ride Hub - service worker v1.0.4
 * Defensive patch: optional files must not prevent SW installation.
 * Keep manifest identity and existing app/chat code unchanged.
 */
const VERSION = 'zontes-ride-v1.0.4';
const CORE = ['./', './index.html'];
const OPTIONAL_ASSETS = [
  './styles.css',
  './app.js',
  './config.js',
  './data.js',
  './manifest.webmanifest',
  './assets/zontes-logo.jpg',
  './assets/cameron-convoy.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Only the site entry points are required to complete installation.
    await cache.addAll(CORE);

    // A renamed/deleted optional file must not abort SW installation.
    await Promise.allSettled(OPTIONAL_ASSETS.map(async asset => {
      const response = await fetch(new Request(asset, { cache: 'reload' }));
      if (response.ok) await cache.put(asset, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('zontes-ride-') && key !== VERSION)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallback) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      await cache.put(fallback || request, response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match(request)) ||
      (fallback ? await cache.match(fallback) : undefined) ||
      Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const stored = await cache.match(request);
  if (stored) return stored;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never intercept cross-origin requests, POSTs, or paths outside this app.
  if (request.method !== 'GET' ||
      url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }
  // Refresh app code on the network first so new releases are not stuck
  // behind a cache-first old app.js/styles.css/config.js/data.js.
  if (/\.(?:js|css|webmanifest|json)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
