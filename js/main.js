import { initLang, getLang, setLang, onLangChange } from "./i18n.js";
import { renderRoute, navigate } from "./router.js";
import { STORAGE_KEY_THEME } from "./config.js";

// Initialisation de la langue
initLang();

// Initialisation du thème (Clair / Sombre)
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeButton(theme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem(STORAGE_KEY_THEME, next); } catch (_) {}
  updateThemeButton(next);
}

// Rendu de l'application
function render() {
  const app = document.getElementById("app");
  if (app) renderRoute(app);
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = getLang();
}

// Enregistrement du Service Worker pour support 100% hors-ligne (PWA)
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => {
          console.log("[Chimiolab PWA] Service Worker actif :", reg.scope);
        })
        .catch(err => {
          console.warn("[Chimiolab PWA] Enregistrement SW non supporté :", err);
        });
    });
  }
}

// Initialisation globale
window.addEventListener("hashchange", render);

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  registerServiceWorker();

  const brand = document.getElementById("brand-logo");
  if (brand) {
    brand.addEventListener("click", () => navigate("/"));
    brand.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") navigate("/");
    });
  }

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  const langSel = document.getElementById("lang-select");
  if (langSel) {
    langSel.value = getLang();
    langSel.addEventListener("change", (e) => setLang(e.target.value));
  }

  render();
});

onLangChange(() => render());
