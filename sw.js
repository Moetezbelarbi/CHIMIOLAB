const CACHE_VERSION = "chimiolab-v1.0.0";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles.css",
  "./js/config.js",
  "./js/i18n.js",
  "./js/registry.js",
  "./js/router.js",
  "./js/pwa.js",
  "./js/graph.js",
  "./js/measure.js",
  "./js/progress.js",
  "./js/report.js",
  "./js/main.js",
  "./js/components/svg-library.js",
  "./js/activities/matiere/pmat01_spectro.js",
  "./js/activities/matiere/pmat02_conducto_etalonnage.js",
  "./js/activities/matiere/pmat03_titrage_colorimetrique.js",
  "./js/activities/matiere/pmat04_titrage_ph.js",
  "./js/activities/matiere/pmat05_titrage_conducto.js",
  "./js/activities/matiere/pmat06_dissolution_dilution.js",
  "./js/activities/mouvement/pmou02_boyle.js",
  "./js/activities/mouvement/pmou04_chute_libre.js",
  "./js/activities/ondes/p_ond01_diffraction.js",
  "./js/activities/ondes/p_ond02_interferences.js",
  "./js/activities/ondes/p_ond03_doppler.js",
  "./js/activities/ondes/p_ond04_lentille.js",
  "./js/activities/ondes/p_ond05_lunette.js",
  "./js/activities/matiere/tmat01_acide_faible.js",
  "./js/activities/matiere/tmat02_tampon.js",
  "./js/activities/matiere/tmat03_pile.js",
  "./js/activities/matiere/tmat04_cinetique.js",
  "./js/activities/matiere/tmat05_radioactivite.js",
  "./js/activities/mouvement/tmou01_newton_euler.js",
  "./js/activities/mouvement/tmou02_champ_electrique.js",
  "./js/activities/energie/tene01_rc.js",
  "./js/activities/energie/tene02_thermique.js",
  "./js/activities/ondes/tond01_photoelectrique.js",
  "./js/activities/ondes/tond02_son.js",
  "./js/activities/ondes/tond03_venturi.js",
  "./js/activities/ondes/tond04_archimede.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_VERSION) return caches.delete(k); return null; }))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(caches.match(req).then(cached => {
    if (cached) return cached;
    return fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match("./index.html"));
  }));
});
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
