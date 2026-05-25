'use strict';

// Bumping the version number automatically clears the old cache
var CACHE_NAME = 'seyyah-v1';

// App shell + all data files to precache
var PRECACHE = [
  './',
  './style.css',
  './app.js',
  './manifest.json',
  './data/cities.json',
  './data/istanbul.json',
  './data/ankara.json',
  './data/izmir.json',
  './data/konya.json',
  './data/trabzon.json',
  './data/gaziantep.json',
];

// ── Install: precache the app shell ──────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
  // Take control immediately without waiting for the current SW
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  // Claim open tabs immediately (no page refresh needed)
  self.clients.claim();
});

// ── Fetch: cache-first, network fallback ─────────────────────────────
self.addEventListener('fetch', function(event) {
  // Only handle GET requests; let everything else pass through
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) schemes such as chrome-extension://
  var url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Third-party requests (fonts, tile server) → network-first
  var isThirdParty = url.origin !== self.location.origin
    && !url.hostname.includes('tile.openstreetmap.org');
  if (isThirdParty) {
    event.respondWith(
      fetch(event.request).catch(function() { return caches.match(event.request); })
    );
    return;
  }

  // Own resources → cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        // Cache a successful response
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Both network and cache failed → return empty 503
        return new Response('Offline: content not found in cache.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      });
    })
  );
});
