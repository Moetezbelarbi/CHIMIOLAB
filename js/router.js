import { t } from "./i18n.js";
import { listActivities, getActivity } from "./registry.js";

export function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  return { parts: h.split("/").filter(Boolean) };
}

export function navigate(path) {
  location.hash = "#" + path;
}

let currentCleanup = null;

export function renderRoute(container) {
  if (currentCleanup) {
    try { currentCleanup(); } catch (_) {}
    currentCleanup = null;
  }

  const { parts } = parseHash();
  container.innerHTML = "";

  if (parts.length === 0) return renderLevels(container);
  if (parts[0] === "all") return renderAllActivities(container);
  if (parts[0] === "level" && parts[1] && !parts[2]) return renderSubjects(container, parts[1]);
  if (parts[0] === "level" && parts[1] && parts[2] && !parts[3]) return renderThemes(container, parts[1], parts[2]);
  if (parts[0] === "level" && parts[1] && parts[2] && parts[3]) return renderActivities(container, parts[1], parts[2], parts[3]);
  if (parts[0] === "activity" && parts[1]) return renderActivity(container, parts[1]);

  return renderLevels(container);
}

function makeBreadcrumb(items) {
  const nav = document.createElement("nav");
  nav.className = "breadcrumb-nav";
  nav.setAttribute("aria-label", "Fil d'Ariane");

  const list = document.createElement("ol");
  list.className = "breadcrumb-list";

  items.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "breadcrumb-item";
    if (idx < items.length - 1 && item.path) {
      const a = document.createElement("a");
      a.href = "#" + item.path;
      a.textContent = item.label;
      li.appendChild(a);
      const sep = document.createElement("span");
      sep.className = "breadcrumb-sep";
      sep.textContent = " / ";
      li.appendChild(sep);
    } else {
      const span = document.createElement("span");
      span.textContent = item.label;
      span.setAttribute("aria-current", "page");
      li.appendChild(span);
    }
    list.appendChild(li);
  });

  nav.appendChild(list);
  return nav;
}

function makeCard(title, desc, onClick, icon, badge = "") {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.innerHTML = `
    <div class="card-icon" aria-hidden="true">${icon || "•"}</div>
    <div class="card-body">
      <div class="card-title-row">
        <span class="card-title">${title}</span>
        ${badge ? `<span class="badge info">${badge}</span>` : ""}
      </div>
      ${desc ? `<div class="card-desc">${desc}</div>` : ""}
    </div>
    <div class="card-arrow" aria-hidden="true">›</div>`;
  card.addEventListener("click", onClick);
  return card;
}

function safeBack(fallbackPath = "/") {
  if (window.history.length > 2) {
    history.back();
  } else {
    navigate(fallbackPath);
  }
}

function renderLevels(container) {
  const hero = document.createElement("div");
  hero.className = "hero-banner";
  hero.innerHTML = `
    <h1>${t("app.title")} — ${t("app.subtitle")}</h1>
    <p>${t("ui.chooseLevel")}</p>
  `;
  container.appendChild(hero);

  const grid = document.createElement("div");
  grid.className = "cards-grid";

  grid.appendChild(makeCard(
    t("level.terminale"),
    t("level.terminale.desc"),
    () => navigate("/level/terminale"),
    "T",
    "2 TPs complets"
  ));

  grid.appendChild(makeCard(
    t("level.premiere"),
    t("level.premiere.desc"),
    () => navigate("/level/premiere"),
    "1ʳᵉ",
    "2 TPs complets"
  ));

  grid.appendChild(makeCard(
    t("level.seconde"),
    t("level.seconde.desc"),
    () => navigate("/level/seconde"),
    "2ⁿᵈ",
    "En cours"
  ));

  container.appendChild(grid);

  // Bouton d'accès direct à toutes les manipulations
  const allBtnWrap = document.createElement("div");
  allBtnWrap.style.marginTop = "24px";
  allBtnWrap.style.textAlign = "center";
  const allBtn = document.createElement("button");
  allBtn.className = "btn-secondary";
  allBtn.textContent = "🔍 " + t("nav.all");
  allBtn.addEventListener("click", () => navigate("/all"));
  allBtnWrap.appendChild(allBtn);
  container.appendChild(allBtnWrap);
}

function renderSubjects(container, level) {
  container.appendChild(makeBreadcrumb([
    { label: t("nav.home"), path: "/" },
    { label: t("level." + level) }
  ]));

  const h1 = document.createElement("h1");
  h1.textContent = t("ui.chooseSubject");
  container.appendChild(h1);

  const grid = document.createElement("div");
  grid.className = "cards-grid";

  const actsChimie = listActivities().filter(a => a.level === level && a.domain === "chimie");
  const actsPhysique = listActivities().filter(a => a.level === level && a.domain === "physique");

  grid.appendChild(makeCard(
    t("subject.chimie"),
    t("subject.chimie.desc"),
    () => navigate(`/level/${level}/chimie`),
    "⚗️",
    `${actsChimie.length} TP`
  ));

  grid.appendChild(makeCard(
    t("subject.physique"),
    t("subject.physique.desc"),
    () => navigate(`/level/${level}/physique`),
    "⚛️",
    `${actsPhysique.length} TP`
  ));

  container.appendChild(grid);
}

function renderThemes(container, level, subject) {
  container.appendChild(makeBreadcrumb([
    { label: t("nav.home"), path: "/" },
    { label: t("level." + level), path: `/level/${level}` },
    { label: t("subject." + subject) }
  ]));

  const h1 = document.createElement("h1");
  h1.textContent = t("ui.chooseTheme");
  container.appendChild(h1);

  const acts = listActivities().filter(a => a.level === level && a.domain === subject);
  const themes = [...new Set(acts.map(a => a.theme))];

  if (themes.length === 0) {
    const emptyCard = makeCard("En cours d'enrichissement", "De nouvelles manipulations sont ajoutées prochainement.", () => safeBack(`/level/${level}`), "⏳");
    container.appendChild(emptyCard);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "cards-grid";

  themes.forEach(th => {
    const count = acts.filter(a => a.theme === th).length;
    grid.appendChild(makeCard(
      t("theme." + th),
      `${count} manipulation(s) de laboratoire`,
      () => navigate(`/level/${level}/${subject}/${th}`),
      "🔬"
    ));
  });

  container.appendChild(grid);
}

function renderActivities(container, level, subject, theme) {
  container.appendChild(makeBreadcrumb([
    { label: t("nav.home"), path: "/" },
    { label: t("level." + level), path: `/level/${level}` },
    { label: t("subject." + subject), path: `/level/${level}/${subject}` },
    { label: t("theme." + theme) }
  ]));

  const h1 = document.createElement("h1");
  h1.textContent = t("theme." + theme);
  container.appendChild(h1);

  const acts = listActivities().filter(a => a.level === level && a.domain === subject && a.theme === theme);
  const grid = document.createElement("div");
  grid.className = "cards-grid";

  acts.forEach(a => {
    grid.appendChild(makeCard(
      t(a.titleKey),
      t(a.descKey),
      () => navigate(`/activity/${a.id}`),
      "▶️",
      t("level." + a.level)
    ));
  });

  container.appendChild(grid);
}

function renderAllActivities(container) {
  container.appendChild(makeBreadcrumb([
    { label: t("nav.home"), path: "/" },
    { label: t("nav.all") }
  ]));

  const h1 = document.createElement("h1");
  h1.textContent = t("nav.all");
  container.appendChild(h1);

  const searchBox = document.createElement("div");
  searchBox.className = "search-box";
  searchBox.innerHTML = `
    <input type="text" id="all-search-inp" placeholder="${t("nav.search")}" class="search-input">
  `;
  container.appendChild(searchBox);

  const grid = document.createElement("div");
  grid.className = "cards-grid";
  grid.id = "all-cards-grid";
  container.appendChild(grid);

  const all = listActivities();

  function updateList(filterText = "") {
    grid.innerHTML = "";
    const filtered = all.filter(a => {
      const fullText = (t(a.titleKey) + " " + t(a.descKey) + " " + a.level + " " + a.domain).toLowerCase();
      return fullText.includes(filterText.toLowerCase());
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state">Aucune manipulation trouvée pour "${filterText}".</div>`;
      return;
    }

    filtered.forEach(a => {
      grid.appendChild(makeCard(
        t(a.titleKey),
        t(a.descKey),
        () => navigate(`/activity/${a.id}`),
        a.domain === "chimie" ? "⚗️" : "⚛️",
        t("level." + a.level)
      ));
    });
  }

  updateList();
  const inp = document.getElementById("all-search-inp");
  if (inp) inp.addEventListener("input", (e) => updateList(e.target.value));
}

export function renderActivity(container, id) {
  const act = getActivity(id);
  if (!act) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Activité introuvable : ${id}</h2>
        <button class="btn" onclick="location.hash='#/'">${t("nav.home")}</button>
      </div>
    `;
    return;
  }

  container.appendChild(makeBreadcrumb([
    { label: t("nav.home"), path: "/" },
    { label: t("level." + act.level), path: `/level/${act.level}` },
    { label: t("subject." + act.domain), path: `/level/${act.level}/${act.domain}` },
    { label: t(act.titleKey) }
  ]));

  const mountPoint = document.createElement("div");
  mountPoint.className = "activity-container";
  container.appendChild(mountPoint);

  const cleanup = act.mount(mountPoint);
  currentCleanup = typeof cleanup === "function" ? cleanup : null;
}
