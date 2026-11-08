import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export const E0 = { "Cu2+/Cu": 0.34, "Zn2+/Zn": -0.76, "Ag+/Ag": 0.80, "Fe2+/Fe": -0.44, "H+/H2": 0.00 };
export function fem(E0cathode, E0anode) { return E0cathode - E0anode; }
export function nernst(E0, n, Q) { return E0 - (0.0592 / n) * Math.log10(Q); }
export const id = "tmat03";
export const level = "terminale";
export const domain = "matiere";
export const theme = "oxydoreduction";
export const titleKey = "tmat03.title";

export function mount(container) {
  const state = { cat: "Cu2+/Cu", an: "Zn2+/Zn", validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const opts = Object.keys(E0).map(k => `<option value="${k}">${k} (${E0[k]} V)</option>`).join("");
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmat03.title")}</div>
    <p>${t("tmat03.desc")}</p>
    <div class="field"><label for="tmat03-cat">${t("tmat03.input.cathode")}</label><select id="tmat03-cat">${opts}</select></div>
    <div class="field"><label for="tmat03-an">${t("tmat03.input.anode")}</label><select id="tmat03-an">${opts}</select></div>
    <div class="actions"><button class="btn" id="tmat03-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmat03-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmat03.answer.title")}</div>
    <div class="field"><label for="tmat03-e">${t("tmat03.answer.e")}</label><input id="tmat03-e" type="number" step="0.01" min="-5" max="5"></div>
    <div class="actions"><button class="btn-check" id="tmat03-check">${t("action.check")}</button></div>
    <div id="tmat03-status" class="status" role="status"></div>
    <div id="tmat03-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() { state.cat = document.getElementById("tmat03-cat").value; state.an = document.getElementById("tmat03-an").value; }
  function refresh() { readInputs(); }
  function randomize() {
    const keys = Object.keys(E0);
    let a = keys[Math.floor(rng() * keys.length)];
    let b = keys[Math.floor(rng() * keys.length)];
    if (a === b) b = keys[(keys.indexOf(a) + 1) % keys.length];
    if (E0[a] < E0[b]) { const tmp = a; a = b; b = tmp; }
    state.cat = a; state.an = b;
    document.getElementById("tmat03-cat").value = a;
    document.getElementById("tmat03-an").value = b;
    state.validated = false;
    document.getElementById("tmat03-status").className = "status"; document.getElementById("tmat03-status").textContent = "";
    document.getElementById("tmat03-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmat03-e").value);
    const E = fem(E0[state.cat], E0[state.an]);
    const status = document.getElementById("tmat03-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - E) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (E = " + formatSigFigs(E, 3) + " V)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - E = " + formatSigFigs(E, 3) + " V"; }
    document.getElementById("tmat03-corr").style.display = "block";
    document.getElementById("tmat03-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> E = E0(cathode) - E0(anode) = " + formatSigFigs(E, 3) + " V.";
  }
  document.getElementById("tmat03-rand").addEventListener("click", randomize);
  document.getElementById("tmat03-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmat03-e").value = "";
    document.getElementById("tmat03-status").className = "status"; document.getElementById("tmat03-status").textContent = "";
    document.getElementById("tmat03-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmat03-check").addEventListener("click", check);
  ["tmat03-cat", "tmat03-an"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmat03-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
