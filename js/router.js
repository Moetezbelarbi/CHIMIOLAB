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
  if (parts[0] === "level" && parts[1] && parts[2] && parts[3]) return renderActivityList(container, parts[1], parts[2], parts[3]);
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
  const wrap = document.createElement("div");
  wrap.className = "landing";
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <div class="hero-badge">${t("app.title")}</div>
    <h1>${t("nav.chooseLevel")}</h1>
    <p>${t("app.subtitle")}</p>`;
  wrap.appendChild(hero);
  const grid = document.createElement("div");
  grid.className = "card-grid";
  grid.appendChild(makeCard(
    t("nav.level.premiere"),
    t("ui.level.premiere.desc"),
    () => navigate("/level/premiere"),
    "1ʳᵉ"
  ));
  grid.appendChild(makeCard(
    t("nav.level.terminale"),
    t("ui.level.terminale.desc"),
    () => navigate("/level/terminale"),
    "T"
  ));
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

function renderSubjects(container, level) {
  const wrap = document.createElement("div");
  wrap.className = "landing";
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <div class="crumb">${t("nav.level." + level)}</div>
    <h1>${t("nav.chooseSubject")}</h1>
    <p>${t("ui.subject.physique.desc")} · ${t("ui.subject.chimie.desc")}</p>`;
  wrap.appendChild(hero);
  const grid = document.createElement("div");
  grid.className = "card-grid";
  grid.appendChild(makeCard(
    t("nav.subject.chimie"),
    t("ui.subject.chimie.desc"),
    () => navigate(`/level/${level}/chimie`),
    "⚗"
  ));
  grid.appendChild(makeCard(
    t("nav.subject.physique"),
    t("ui.subject.physique.desc"),
    () => navigate(`/level/${level}/physique`),
    "⚛"
  ));
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

function renderThemes(container, level, subject) {
  const wrap = document.createElement("div");
  wrap.className = "landing";
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <div class="crumb">${t("nav.level." + level)} · ${t("nav.subject." + subject)}</div>
    <h1>${t("nav.themes")}</h1>`;
  wrap.appendChild(hero);
  const acts = listActivities().filter(a => a.level === level && a.subject === subject);
  const themes = [...new Set(acts.map(a => a.theme))];
  const grid = document.createElement("div");
  grid.className = "card-grid";
  themes.forEach(th => {
    const count = acts.filter(a => a.theme === th).length;
    grid.appendChild(makeCard(
      t("ui.theme." + th),
      count + " " + t("nav.activityCount"),
      () => navigate(`/level/${level}/${subject}/${th}`),
      "▣"
    ));
  });
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

function renderActivityList(container, level, subject, theme) {
  const wrap = document.createElement("div");
  wrap.className = "landing";
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <div class="crumb">${t("nav.level." + level)} · ${t("nav.subject." + subject)} · ${t("ui.theme." + theme)}</div>
    <h1>${t("ui.theme." + theme)}</h1>`;
  wrap.appendChild(hero);
  const acts = listActivities().filter(a => a.level === level && a.subject === subject && a.theme === theme);
  const grid = document.createElement("div");
  grid.className = "card-grid";
  acts.forEach(a => {
    grid.appendChild(makeCard(t(a.titleKey), "", () => navigate(`/activity/${a.id}`), "▶"));
  });
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

let currentCleanup = null;

export function renderActivity(container, id) {
  if (currentCleanup) { try { currentCleanup(); } catch (_) {} currentCleanup = null; }
  const act = getActivity(id);
  if (!act) { container.textContent = "Activité inconnue : " + id; return; }
  const wrap = document.createElement("div");
  wrap.className = "activity";
  const header = document.createElement("div");
  header.className = "activity-header";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn-back";
  back.textContent = "← " + t("nav.back");
  back.addEventListener("click", () => history.back());
  header.appendChild(back);
  const h1 = document.createElement("h1");
  h1.textContent = t(act.titleKey);
  header.appendChild(h1);
  wrap.appendChild(header);
  const mountPoint = document.createElement("div");
  mountPoint.className = "mount-point";
  wrap.appendChild(mountPoint);
  container.appendChild(wrap);
  const cleanup = act.mount(mountPoint);
  currentCleanup = typeof cleanup === "function" ? cleanup : (act.cleanup || null);
}

export function cleanupCurrent() {
  if (currentCleanup) { try { currentCleanup(); } catch (_) {} currentCleanup = null; }
}
