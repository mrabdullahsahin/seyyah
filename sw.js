'use strict';

// Sürüm numarasını güncelleyince eski cache otomatik temizlenir
var CACHE_NAME = 'seyyah-v1';

// Önceden önbelleğe alınacak app shell + tüm veri dosyaları
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

// ── Install: app shell'i önceden önbelleğe al ─────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
  // Mevcut SW'u beklemeden hemen devral
  self.skipWaiting();
});

// ── Activate: eski cache'leri temizle ────────────────────────────────
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
  // Açık sekmeleri hemen kontrol al (sayfa yenileme gerekmez)
  self.clients.claim();
});

// ── Fetch: cache-first, network fallback ─────────────────────────────
self.addEventListener('fetch', function(event) {
  // Sadece GET isteklerini yönet; diğerlerini normal geçir
  if (event.request.method !== 'GET') return;

  // chrome-extension:// gibi şemaları atla
  var url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Üçüncü taraf istekleri (fonts, tile sunucusu) → network-first
  var isThirdParty = url.origin !== self.location.origin
    && !url.hostname.includes('tile.openstreetmap.org');
  if (isThirdParty) {
    event.respondWith(
      fetch(event.request).catch(function() { return caches.match(event.request); })
    );
    return;
  }

  // Kendi kaynaklarımız → cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        // Başarılı yanıtı önbelleğe ekle
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Ağ ve cache ikisi de başarısız → boş 503
        return new Response('Çevrimdışı: içerik önbellekte bulunamadı.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      });
    })
  );
});
