import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function resistanceThermique(e, lambda, S) { return e / (lambda * S); }
export function flux(dT, Rth) { return dT / Rth; }
export const id = "tene02";
export const level = "terminale";
export const domain = "energie";
export const theme = "thermique";
export const titleKey = "tene02.title";

export function mount(container) {
  const state = { e: 0.10, lambda: 0.040, S: 1.0, deltaT: 20, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tene02.title")}</div>
    <p>${t("tene02.desc")}</p>
    <div class="field"><label for="tene02-e">${t("tene02.input.e")}</label><input id="tene02-e" type="number" step="0.01" min="0.001" max="1" value="${state.e}"></div>
    <div class="field"><label for="tene02-l">${t("tene02.input.lambda")}</label><input id="tene02-l" type="number" step="0.001" min="0.001" max="1" value="${state.lambda}"></div>
    <div class="field"><label for="tene02-s">${t("tene02.input.S")}</label><input id="tene02-s" type="number" step="0.1" min="0.1" max="100" value="${state.S}"></div>
    <div class="field"><label for="tene02-dt">${t("tene02.input.dT")}</label><input id="tene02-dt" type="number" step="1" min="-50" max="100" value="${state.deltaT}"></div>
    <div class="actions"><button class="btn" id="tene02-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tene02-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tene02.answer.title")}</div>
    <div class="field"><label for="tene02-rth">${t("tene02.answer.Rth")}</label><input id="tene02-rth" type="number" step="0.001" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="tene02-check">${t("action.check")}</button></div>
    <div id="tene02-status" class="status" role="status"></div>
    <div id="tene02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const e = parseFloat(document.getElementById("tene02-e").value);
    const l = parseFloat(document.getElementById("tene02-l").value);
    const s = parseFloat(document.getElementById("tene02-s").value);
    const dt = parseFloat(document.getElementById("tene02-dt").value);
    if (isFinite(e) && e > 0) state.e = e; if (isFinite(l) && l > 0) state.lambda = l; if (isFinite(s) && s > 0) state.S = s; if (isFinite(dt)) state.deltaT = dt;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.e = Number((0.01 + rng() * 0.3).toFixed(2));
    state.lambda = Number((0.01 + rng() * 0.5).toFixed(3));
    state.S = Number((0.1 + rng() * 10).toFixed(1));
    state.deltaT = Number((-10 + rng() * 50).toFixed(0));
    document.getElementById("tene02-e").value = state.e;
    document.getElementById("tene02-l").value = state.lambda;
    document.getElementById("tene02-s").value = state.S;
    document.getElementById("tene02-dt").value = state.deltaT;
    state.validated = false;
    document.getElementById("tene02-status").className = "status"; document.getElementById("tene02-status").textContent = "";
    document.getElementById("tene02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tene02-rth").value);
    const Rth = resistanceThermique(state.e, state.lambda, state.S);
    const status = document.getElementById("tene02-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - Rth) / Rth <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (Rth = " + formatSigFigs(Rth, 3) + " K/W)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - Rth = " + formatSigFigs(Rth, 3) + " K/W"; }
    document.getElementById("tene02-corr").style.display = "block";
    document.getElementById("tene02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> Rth = e/(lambda*S) = " + formatSigFigs(Rth, 3) + " K/W.";
  }
  document.getElementById("tene02-rand").addEventListener("click", randomize);
  document.getElementById("tene02-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tene02-rth").value = "";
    document.getElementById("tene02-status").className = "status"; document.getElementById("tene02-status").textContent = "";
    document.getElementById("tene02-corr").style.display = "none"; refresh();
  });
  document.getElementById("tene02-check").addEventListener("click", check);
  ["tene02-e", "tene02-l", "tene02-s", "tene02-dt"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tene02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
