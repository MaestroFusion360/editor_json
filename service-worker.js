const CACHE_NAME = "maestrofusion360-cache-v1";

const FILES_TO_CACHE = [
  "index.html",
  "config.js",
  "scripts.js",
  "styles.css",
  "favicon.ico",
  "manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/editor.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
];

// Service worker installation and resource caching
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Service worker activation and cleanup of old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
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
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the response is valid, return it and update the cache
        if (response && response.status === 200) {
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        }
        // If the response is invalid (e.g., 404), try to return from cache
        return caches.match(event.request);
      })
      .catch(() => {
        // If the network is unavailable, return from cache
        return caches.match(event.request);
      })
  );
});
