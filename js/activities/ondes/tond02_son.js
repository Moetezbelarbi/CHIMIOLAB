import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export const I0 = 1e-12;
export function niveau(I) { if (I <= 0) return -Infinity; return 10 * Math.log10(I / I0); }
export const id = "tond02";
export const level = "terminale";
export const domain = "ondes";
export const theme = "ondes_sonores";
export const titleKey = "tond02.title";

export function mount(container) {
  const state = { I: 1e-6, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tond02.title")}</div>
    <p>${t("tond02.desc")}</p>
    <div class="field"><label for="tond02-i">${t("tond02.input.I")}</label><input id="tond02-i" type="number" step="1e-12" min="1e-12" max="1" value="${state.I}"></div>
    <div class="actions"><button class="btn" id="tond02-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tond02-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tond02.answer.title")}</div>
    <div class="field"><label for="tond02-l">${t("tond02.answer.L")}</label><input id="tond02-l" type="number" step="0.1" min="-50" max="200"></div>
    <div class="actions"><button class="btn-check" id="tond02-check">${t("action.check")}</button></div>
    <div id="tond02-status" class="status" role="status"></div>
    <div id="tond02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() { const i = parseFloat(document.getElementById("tond02-i").value); if (isFinite(i) && i > 0) state.I = i; }
  function refresh() { readInputs(); }
  function randomize() {
    state.I = Number(Math.pow(10, -10 + rng() * 10).toExponential(2));
    document.getElementById("tond02-i").value = state.I;
    state.validated = false;
    document.getElementById("tond02-status").className = "status"; document.getElementById("tond02-status").textContent = "";
    document.getElementById("tond02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tond02-l").value);
    const L = niveau(state.I);
    const status = document.getElementById("tond02-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - L) <= 1) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (L = " + formatSigFigs(L, 3) + " dB)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - L = " + formatSigFigs(L, 3) + " dB"; }
    document.getElementById("tond02-corr").style.display = "block";
    document.getElementById("tond02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> L = 10*log(I/I0) = " + formatSigFigs(L, 3) + " dB.";
  }
  document.getElementById("tond02-rand").addEventListener("click", randomize);
  document.getElementById("tond02-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tond02-l").value = "";
    document.getElementById("tond02-status").className = "status"; document.getElementById("tond02-status").textContent = "";
    document.getElementById("tond02-corr").style.display = "none"; refresh();
  });
  document.getElementById("tond02-check").addEventListener("click", check);
  ["tond02-i"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tond02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
