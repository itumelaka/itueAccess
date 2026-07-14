const CACHE_NAME = "itu-eaccess-shell-v1";
const SHELL_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/brand/itu-eaccess-mark.svg",
];

function shouldCacheRequest(request, origin) {
  if (request.method !== "GET" || request.mode === "navigate") return false;

  const url = new URL(request.url);
  if (url.origin !== origin) return false;

  return SHELL_ASSETS.includes(url.pathname)
    || url.pathname.startsWith("/_next/static/")
    || url.pathname.startsWith("/brand/");
}

const isServiceWorker = typeof self !== "undefined"
  && typeof self.skipWaiting === "function"
  && typeof caches !== "undefined";

if (isServiceWorker) {
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.mode === "navigate") {
      event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
      return;
    }

    if (!shouldCacheRequest(request, self.location.origin)) return;

    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
  });
}

if (typeof module !== "undefined") module.exports = { shouldCacheRequest };
