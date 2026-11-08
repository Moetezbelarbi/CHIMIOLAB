import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";
import { E_CHARGE } from "../../config.js";

export function acceleration(q, E, m) { return q * E / m; }
export function deviation(q, E, m, L, v0) {
  const a = acceleration(q, E, m);
  const tFlight = L / v0;
  return 0.5 * a * tFlight * tFlight;
}
export const id = "tmou02";
export const level = "terminale";
export const domain = "mouvement";
export const theme = "champ_uniforme";
export const titleKey = "tmou02.title";

export function mount(container) {
  const state = { q: E_CHARGE, E: 1e4, m: 9.11e-31, L: 0.05, v0: 1e7, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmou02.title")}</div>
    <p>${t("tmou02.desc")}</p>
    <div class="field"><label for="tmou02-q">${t("tmou02.input.q")}</label><input id="tmou02-q" type="number" step="1e-19" min="1e-19" max="1e-18" value="${state.q}"></div>
    <div class="field"><label for="tmou02-e">${t("tmou02.input.E")}</label><input id="tmou02-e" type="number" step="100" min="100" max="1e7" value="${state.E}"></div>
    <div class="field"><label for="tmou02-m">${t("tmou02.input.m")}</label><input id="tmou02-m" type="number" step="1e-31" min="1e-31" max="1e-26" value="${state.m}"></div>
    <div class="field"><label for="tmou02-l">${t("tmou02.input.L")}</label><input id="tmou02-l" type="number" step="0.01" min="0.01" max="1" value="${state.L}"></div>
    <div class="field"><label for="tmou02-v0">${t("tmou02.input.v0")}</label><input id="tmou02-v0" type="number" step="1e6" min="1e6" max="1e8" value="${state.v0}"></div>
    <div class="actions"><button class="btn" id="tmou02-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmou02-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmou02.answer.title")}</div>
    <div class="field"><label for="tmou02-y">${t("tmou02.answer.y")}</label><input id="tmou02-y" type="number" step="1e-6" min="0" max="1"></div>
    <div class="actions"><button class="btn-check" id="tmou02-check">${t("action.check")}</button></div>
    <div id="tmou02-status" class="status" role="status"></div>
    <div id="tmou02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const q = parseFloat(document.getElementById("tmou02-q").value);
    const E = parseFloat(document.getElementById("tmou02-e").value);
    const m = parseFloat(document.getElementById("tmou02-m").value);
    const L = parseFloat(document.getElementById("tmou02-l").value);
    const v0 = parseFloat(document.getElementById("tmou02-v0").value);
    if (isFinite(q)) state.q = q; if (isFinite(E)) state.E = E; if (isFinite(m) && m > 0) state.m = m; if (isFinite(L)) state.L = L; if (isFinite(v0) && v0 > 0) state.v0 = v0;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.q = E_CHARGE;
    state.E = Number((1e3 + rng() * 9e4).toExponential(2));
    state.m = 9.11e-31;
    state.L = Number((0.02 + rng() * 0.2).toFixed(2));
    state.v0 = Number((5e6 + rng() * 5e7).toExponential(2));
    document.getElementById("tmou02-q").value = state.q;
    document.getElementById("tmou02-e").value = state.E;
    document.getElementById("tmou02-m").value = state.m;
    document.getElementById("tmou02-l").value = state.L;
    document.getElementById("tmou02-v0").value = state.v0;
    state.validated = false;
    document.getElementById("tmou02-status").className = "status"; document.getElementById("tmou02-status").textContent = "";
    document.getElementById("tmou02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmou02-y").value);
    const y = deviation(state.q, state.E, state.m, state.L, state.v0);
    const status = document.getElementById("tmou02-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - y) / Math.max(1e-12, y) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (y = " + formatSigFigs(y, 3) + " m)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - y = " + formatSigFigs(y, 3) + " m"; }
    document.getElementById("tmou02-corr").style.display = "block";
    document.getElementById("tmou02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> y = 0.5*a*(L/v0)^2 = " + formatSigFigs(y, 3) + " m.";
  }
  document.getElementById("tmou02-rand").addEventListener("click", randomize);
  document.getElementById("tmou02-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmou02-y").value = "";
    document.getElementById("tmou02-status").className = "status"; document.getElementById("tmou02-status").textContent = "";
    document.getElementById("tmou02-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmou02-check").addEventListener("click", check);
  ["tmou02-q", "tmou02-e", "tmou02-m", "tmou02-l", "tmou02-v0"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmou02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
