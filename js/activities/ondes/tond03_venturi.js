import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const RHO_EAU = 998;
export function vitesse2(D1cm, D2cm, v1) {
  const S1 = Math.PI * Math.pow(D1cm / 200, 2);
  const S2 = Math.PI * Math.pow(D2cm / 200, 2);
  return v1 * S1 / S2;
}
export function deltaP(D1cm, D2cm, v1, rho = RHO_EAU) {
  const v2 = vitesse2(D1cm, D2cm, v1);
  return 0.5 * rho * (v2 * v2 - v1 * v1);
}
export const id = "tond03";
export const level = "terminale";
export const domain = "ondes";
export const theme = "venturi";
export const titleKey = "tond03.title";

export function mount(container) {
  const state = { D1: 10, D2: 5, v1: 1.0, rho: RHO_EAU, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tond03.title")}</div>
    <p>${t("tond03.desc")}</p>
    <div class="field"><label for="tond03-d1">${t("tond03.input.D1")}</label><input id="tond03-d1" type="number" step="0.5" min="1" max="50" value="${state.D1}"></div>
    <div class="field"><label for="tond03-d2">${t("tond03.input.D2")}</label><input id="tond03-d2" type="number" step="0.5" min="1" max="50" value="${state.D2}"></div>
    <div class="field"><label for="tond03-v1">${t("tond03.input.v1")}</label><input id="tond03-v1" type="number" step="0.1" min="0.1" max="10" value="${state.v1}"></div>
    <div class="actions"><button class="btn" id="tond03-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tond03-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tond03.answer.title")}</div>
    <div class="field"><label for="tond03-dp">${t("tond03.answer.dP")}</label><input id="tond03-dp" type="number" step="1" min="0" max="1e6"></div>
    <div class="actions"><button class="btn-check" id="tond03-check">${t("action.check")}</button></div>
    <div id="tond03-status" class="status" role="status"></div>
    <div id="tond03-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const d1 = parseFloat(document.getElementById("tond03-d1").value);
    const d2 = parseFloat(document.getElementById("tond03-d2").value);
    const v1 = parseFloat(document.getElementById("tond03-v1").value);
    if (isFinite(d1) && d1 > 0) state.D1 = d1; if (isFinite(d2) && d2 > 0) state.D2 = d2; if (isFinite(v1) && v1 > 0) state.v1 = v1;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.D1 = Number((5 + rng() * 15).toFixed(1));
    state.D2 = Number((1 + rng() * (state.D1 - 1)).toFixed(1));
    state.v1 = Number((0.2 + rng() * 3).toFixed(2));
    document.getElementById("tond03-d1").value = state.D1;
    document.getElementById("tond03-d2").value = state.D2;
    document.getElementById("tond03-v1").value = state.v1;
    state.validated = false;
    document.getElementById("tond03-status").className = "status"; document.getElementById("tond03-status").textContent = "";
    document.getElementById("tond03-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tond03-dp").value);
    const dP = deltaP(state.D1, state.D2, state.v1);
    const v2 = vitesse2(state.D1, state.D2, state.v1);
    const status = document.getElementById("tond03-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - dP) / dP <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (v2 = " + formatSigFigs(v2, 3) + " m/s ; dP = " + formatSigFigs(dP, 3) + " Pa)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - dP = " + formatSigFigs(dP, 3) + " Pa"; }
    document.getElementById("tond03-corr").style.display = "block";
    document.getElementById("tond03-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> v2 = " + formatSigFigs(v2, 3) + " m/s ; dP = 0.5*rho*(v2^2-v1^2) = " + formatSigFigs(dP, 3) + " Pa.";
  }
  document.getElementById("tond03-rand").addEventListener("click", randomize);
  document.getElementById("tond03-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tond03-dp").value = "";
    document.getElementById("tond03-status").className = "status"; document.getElementById("tond03-status").textContent = "";
    document.getElementById("tond03-corr").style.display = "none"; refresh();
  });
  document.getElementById("tond03-check").addEventListener("click", check);
  ["tond03-d1", "tond03-d2", "tond03-v1"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tond03-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
