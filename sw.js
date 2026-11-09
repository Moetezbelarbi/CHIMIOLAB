const CACHE_VERSION = "chimiolab-v3.0.1";
const PRECACHE = [
  "./", "./index.html", "./manifest.webmanifest", "./styles.css",
  "./js/config.js", "./js/i18n.js", "./js/main.js", "./js/router.js", "./js/registry.js",
  "./js/measure.js", "./js/graph.js", "./js/activities/pmat04_titrage_ph.js",
  "./icon-192.png", "./icon-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_VERSION ? caches.delete(k) : null))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE_VERSION).then(c => c.put(e.request, copy)).catch(() => {});
    return resp;
  }).catch(() => caches.match("./index.html"))));
});
