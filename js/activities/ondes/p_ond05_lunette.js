import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function grossissement(f1, f2) { return f1 / f2; }

export const id = "pond05";
export const level = "premiere";
export const domain = "ondes";
export const theme = "optique";
export const titleKey = "pond05.title";

export function mount(container) {
  const state = { f1: 100, f2: 10, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pond05.title")}</div>
    <p>${t("pond05.desc")}</p>
    <div class="field"><label for="pond05-f1">${t("pond05.input.f1")}</label><input id="pond05-f1" type="number" step="1" min="50" max="2000" value="${state.f1}"></div>
    <div class="field"><label for="pond05-f2">${t("pond05.input.f2")}</label><input id="pond05-f2" type="number" step="1" min="5" max="100" value="${state.f2}"></div>
    <div class="actions"><button class="btn" id="pond05-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pond05-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pond05.answer.title")}</div>
    <div class="field"><label for="pond05-g">${t("pond05.answer.G")}</label><input id="pond05-g" type="number" step="0.1" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="pond05-check">${t("action.check")}</button></div>
    <div id="pond05-status" class="status" role="status"></div>
    <div id="pond05-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const f1 = parseFloat(document.getElementById("pond05-f1").value);
    const f2 = parseFloat(document.getElementById("pond05-f2").value);
    if (isFinite(f1)) state.f1 = f1; if (isFinite(f2)) state.f2 = f2;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.f1 = Number((80 + rng() * 800).toFixed(0));
    state.f2 = Number((5 + rng() * 30).toFixed(0));
    document.getElementById("pond05-f1").value = state.f1;
    document.getElementById("pond05-f2").value = state.f2;
    state.validated = false;
    document.getElementById("pond05-status").className = "status"; document.getElementById("pond05-status").textContent = "";
    document.getElementById("pond05-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pond05-g").value);
    const G = grossissement(state.f1, state.f2);
    const status = document.getElementById("pond05-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - G) / G;
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (G = " + formatSigFigs(G, 3) + ")"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - G = " + formatSigFigs(G, 3); }
    document.getElementById("pond05-corr").style.display = "block";
    document.getElementById("pond05-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> G = f1'/f2' = " + formatSigFigs(G, 3) + ".";
  }
  document.getElementById("pond05-rand").addEventListener("click", randomize);
  document.getElementById("pond05-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pond05-g").value = "";
    document.getElementById("pond05-status").className = "status"; document.getElementById("pond05-status").textContent = "";
    document.getElementById("pond05-corr").style.display = "none"; refresh();
  });
  document.getElementById("pond05-check").addEventListener("click", check);
  ["pond05-f1", "pond05-f2"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pond05-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
