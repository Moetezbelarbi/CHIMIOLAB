import { initLang, getLang, setLang, onLangChange, applyI18nToDom } from "./i18n.js";
import { renderRoute, cleanupCurrent } from "./router.js";
import { registerServiceWorker } from "./pwa.js";
import { PRIMARY_COLOR } from "./config.js";

initLang();

function updateLangSelect() {
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = getLang();
}

function render() {
  const app = document.getElementById("app");
  renderRoute(app);
  applyI18nToDom(document);
  updateLangSelect();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("lang-select");
  if (sel) sel.addEventListener("change", e => { setLang(e.target.value); render(); });
  document.documentElement.style.setProperty("--primary", PRIMARY_COLOR);
  render();
  registerServiceWorker();
});
onLangChange(() => render());
window.addEventListener("beforeunload", cleanupCurrent);
