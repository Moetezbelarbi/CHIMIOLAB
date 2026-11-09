import { t } from "./i18n.js";
import { listActivities, getActivity } from "./registry.js";

export function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  return { parts: h.split("/").filter(Boolean) };
}
export function navigate(path) { location.hash = "#" + path; }

export function renderRoute(container) {
  const { parts } = parseHash();
  container.innerHTML = "";
  if (parts.length === 0) return renderLevels(container);
  if (parts[0] === "level" && parts[1] && !parts[2]) return renderSubjects(container, parts[1]);
  if (parts[0] === "level" && parts[1] && parts[2] && !parts[3]) return renderThemes(container, parts[1], parts[2]);
  if (parts[0] === "level" && parts[1] && parts[2] && parts[3]) return renderActivities(container, parts[1], parts[2], parts[3]);
  if (parts[0] === "activity" && parts[1]) return renderActivity(container, parts[1]);
  return renderLevels(container);
}

function makeCard(title, desc, onClick, icon) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.innerHTML = `
    <div class="card-icon">${icon || "•"}</div>
    <div class="card-body">
      <div class="card-title">${title}</div>
      ${desc ? `<div class="card-desc">${desc}</div>` : ""}
    </div>
    <div class="card-arrow">›</div>`;
  card.addEventListener("click", onClick);
  return card;
}

function renderLevels(container) {
  const h1 = document.createElement("h1");
  h1.textContent = t("ui.chooseLevel");
  container.appendChild(h1);
  container.appendChild(makeCard(t("level.premiere"), "Titrages et dosages", () => navigate("/level/premiere"), "1ʳᵉ"));
  container.appendChild(makeCard(t("level.terminale"), "À venir", () => navigate("/level/terminale"), "T"));
}

function renderSubjects(container, level) {
  const back = document.createElement("button");
  back.className = "btn-back"; back.textContent = "← " + t("nav.back");
  back.addEventListener("click", () => history.back());
  container.appendChild(back);
  const h1 = document.createElement("h1");
  h1.textContent = t("ui.chooseSubject");
  container.appendChild(h1);
  container.appendChild(makeCard(t("subject.chimie"), "Titrages, dosages, cinétique", () => navigate(`/level/${level}/chimie`), "⚗"));
  container.appendChild(makeCard(t("subject.physique"), "À venir", () => navigate(`/level/${level}/physique`), "⚛"));
}

function renderThemes(container, level, subject) {
  const back = document.createElement("button");
  back.className = "btn-back"; back.textContent = "← " + t("nav.back");
  back.addEventListener("click", () => history.back());
  container.appendChild(back);
  const h1 = document.createElement("h1");
  h1.textContent = t("ui.chooseTheme");
  container.appendChild(h1);
  const acts = listActivities().filter(a => a.level === level && a.domain === subject);
  const themes = [...new Set(acts.map(a => a.theme))];
  if (themes.length === 0) {
    container.appendChild(makeCard("À venir", "Aucune activité pour l'instant", () => {}, "…"));
    return;
  }
  themes.forEach(th => {
    const count = acts.filter(a => a.theme === th).length;
    container.appendChild(makeCard(t("theme." + th), count + " activité(s)", () => navigate(`/level/${level}/${subject}/${th}`), "▣"));
  });
}

function renderActivities(container, level, subject, theme) {
  const back = document.createElement("button");
  back.className = "btn-back"; back.textContent = "← " + t("nav.back");
  back.addEventListener("click", () => history.back());
  container.appendChild(back);
  const h1 = document.createElement("h1");
  h1.textContent = t("theme." + theme);
  container.appendChild(h1);
  const acts = listActivities().filter(a => a.level === level && a.domain === subject && a.theme === theme);
  acts.forEach(a => {
    container.appendChild(makeCard(t(a.titleKey), "", () => navigate(`/activity/${a.id}`), "▶"));
  });
}

let currentCleanup = null;

export function renderActivity(container, id) {
  if (currentCleanup) { try { currentCleanup(); } catch (_) {} currentCleanup = null; }
  const act = getActivity(id);
  if (!act) { container.textContent = "Activité inconnue : " + id; return; }
  const back = document.createElement("button");
  back.className = "btn-back"; back.textContent = "← " + t("nav.back");
  back.addEventListener("click", () => history.back());
  container.appendChild(back);
  const h1 = document.createElement("h1");
  h1.textContent = t(act.titleKey);
  container.appendChild(h1);
  const mountPoint = document.createElement("div");
  container.appendChild(mountPoint);
  const cleanup = act.mount(mountPoint);
  currentCleanup = typeof cleanup === "function" ? cleanup : null;
}
