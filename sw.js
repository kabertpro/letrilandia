/* Letrilandia — service worker
   Caches the core app shell so it works offline once installed and
   satisfies the "installable" requirement in Chrome/Edge/Android.
   Any failure here is caught so it can never break the page itself. */

const CACHE_NAME = "letrilandia-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => { /* ignore missing assets, never block install */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).catch(() => {})
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          try {
            const url = new URL(event.request.url);
            if (url.origin === self.location.origin && response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
            }
          } catch (e) { /* ignore */ }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
