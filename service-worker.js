const CACHE_NAME = 'maestrofusion360-cache-v1';

const FILES_TO_CACHE = [
    'index.html',
    'config.js',
    'scripts.js',
    'styles.css',
    'favicon.ico',
    'manifest.webmanifest',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/editor.png'
];

// Service worker installation and resource caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Service worker activation and cleanup of old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* Handling network requests: respond with cache if available, 
otherwise fetch from network and cache the response */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response || caches.match(event.request);
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
