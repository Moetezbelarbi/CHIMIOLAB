import { CACHE_VERSION } from "./config.js";
import { t } from "./i18n.js";
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).then(reg => {
      if (reg.waiting) showUpdateBanner(reg);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(reg);
        });
      });
    }).catch(err => console.warn("SW registration failed", err));
  });
}
function showUpdateBanner(reg) {
  const el = document.createElement("div");
  el.className = "pwa-banner pwa-update";
  el.setAttribute("role", "status");
  el.textContent = t("pwa.update");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "OK";
  btn.addEventListener("click", () => {
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    location.reload();
  });
  el.appendChild(btn);
  document.body.appendChild(el);
}
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; showInstallBanner(); });
function showInstallBanner() {
  if (document.querySelector(".pwa-install")) return;
  const el = document.createElement("div");
  el.className = "pwa-banner pwa-install";
  el.setAttribute("role", "status");
  el.textContent = t("pwa.install");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "OK";
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    el.remove();
  });
  document.body.appendChild(el);
}
window.addEventListener("appinstalled", () => { const el = document.querySelector(".pwa-install"); if (el) el.remove(); });
export { CACHE_VERSION };