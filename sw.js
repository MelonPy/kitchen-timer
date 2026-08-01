/* ============================================================
   Service worker — Kitchen Timer
   ------------------------------------------------------------
   Cache-first strategy: every app file is cached at install
   time, so the app then works fully offline. To publish an
   update, bump the cache version number below.
   ============================================================ */

const CACHE = 'kitchen-timer-v11';

const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './default-config.js',
  './lang/en.js',
  './lang/fr.js',
  './lang/zh-TW.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  // Purge old caches after an update
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then((response) => response || fetch(e.request))
  );
});
