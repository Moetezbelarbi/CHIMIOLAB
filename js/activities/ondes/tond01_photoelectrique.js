import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";
import { H_PLANCK, C_LIGHT, E_CHARGE } from "../../config.js";

export function photonEnergyJ(lambdaNm) { return H_PLANCK * C_LIGHT / (lambdaNm * 1e-9); }
export function photonEnergyEV(lambdaNm) { return photonEnergyJ(lambdaNm) / E_CHARGE; }
export function thresholdWavelength(WeV) { return H_PLANCK * C_LIGHT / (WeV * E_CHARGE) * 1e9; }
export const id = "tond01";
export const level = "terminale";
export const domain = "ondes";
export const theme = "photons";
export const titleKey = "tond01.title";

export function mount(container) {
  const state = { lambda: 500, W: 2.0, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tond01.title")}</div>
    <p>${t("tond01.desc")}</p>
    <div class="field"><label for="tond01-l">${t("tond01.input.lambda")}</label><input id="tond01-l" type="number" step="1" min="100" max="1000" value="${state.lambda}"></div>
    <div class="field"><label for="tond01-w">${t("tond01.input.W")}</label><input id="tond01-w" type="number" step="0.1" min="0.1" max="10" value="${state.W}"></div>
    <div class="actions"><button class="btn" id="tond01-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tond01-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tond01.answer.title")}</div>
    <div class="field"><label for="tond01-e">${t("tond01.answer.E")}</label><input id="tond01-e" type="number" step="0.01" min="0" max="100"></div>
    <div class="actions"><button class="btn-check" id="tond01-check">${t("action.check")}</button></div>
    <div id="tond01-status" class="status" role="status"></div>
    <div id="tond01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const l = parseFloat(document.getElementById("tond01-l").value);
    const w = parseFloat(document.getElementById("tond01-w").value);
    if (isFinite(l)) state.lambda = l; if (isFinite(w)) state.W = w;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.lambda = Number((200 + rng() * 600).toFixed(0));
    state.W = Number((0.5 + rng() * 5).toFixed(1));
    document.getElementById("tond01-l").value = state.lambda;
    document.getElementById("tond01-w").value = state.W;
    state.validated = false;
    document.getElementById("tond01-status").className = "status"; document.getElementById("tond01-status").textContent = "";
    document.getElementById("tond01-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tond01-e").value);
    const EeV = photonEnergyEV(state.lambda);
    const status = document.getElementById("tond01-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - EeV) / EeV <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (E = " + formatSigFigs(EeV, 3) + " eV)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - E = " + formatSigFigs(EeV, 3) + " eV"; }
    document.getElementById("tond01-corr").style.display = "block";
    document.getElementById("tond01-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> E = hc/lambda = " + formatSigFigs(EeV, 3) + " eV.";
  }
  document.getElementById("tond01-rand").addEventListener("click", randomize);
  document.getElementById("tond01-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tond01-e").value = "";
    document.getElementById("tond01-status").className = "status"; document.getElementById("tond01-status").textContent = "";
    document.getElementById("tond01-corr").style.display = "none"; refresh();
  });
  document.getElementById("tond01-check").addEventListener("click", check);
  ["tond01-l", "tond01-w"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tond01-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
