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
  if (parts.length === 0) return renderHome(container);
  if (parts[0] === "activity" && parts[1]) return renderActivity(container, parts[1]);
  return renderHome(container);
}

function renderHome(container) {
  const wrap = document.createElement("div");
  wrap.className = "home";
  const title = document.createElement("h1");
  title.textContent = t("app.title");
  wrap.appendChild(title);
  const sub = document.createElement("p");
  sub.textContent = t("app.subtitle");
  wrap.appendChild(sub);

  ["premiere", "terminale"].forEach(level => {
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = t("nav.level." + level);
    section.appendChild(h2);
    ["matiere", "mouvement", "energie", "ondes"].forEach(domain => {
      const acts = listActivities().filter(a => a.level === level && a.domain === domain);
      if (acts.length === 0) return;
      const h3 = document.createElement("h3");
      h3.textContent = t("domain." + domain);
      section.appendChild(h3);
      const ul = document.createElement("ul");
      acts.forEach(a => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "link-like";
        btn.textContent = t(a.titleKey);
        btn.addEventListener("click", () => navigate("/activity/" + a.id));
        li.appendChild(btn);
        ul.appendChild(li);
      });
      section.appendChild(ul);
    });
    wrap.appendChild(section);
  });
  container.appendChild(wrap);
}

let currentCleanup = null;

export function renderActivity(container, id) {
  if (currentCleanup) { try { currentCleanup(); } catch (_) {} currentCleanup = null; }
  const act = getActivity(id);
  if (!act) { container.textContent = "Activité inconnue : " + id; return; }
  const wrap = document.createElement("div");
  wrap.className = "activity";
  const h1 = document.createElement("h1");
  h1.textContent = t(act.titleKey);
  wrap.appendChild(h1);
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn-secondary";
  back.textContent = t("nav.back");
  back.addEventListener("click", () => navigate("/"));
  wrap.appendChild(back);
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
