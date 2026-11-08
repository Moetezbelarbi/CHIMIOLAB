import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function pHBuffer(pKa, Cbase, Cacide) {
  if (Cacide <= 0) return 14;
  return pKa + Math.log10(Cbase / Cacide);
}
export function pouvoirTampon(Ctot, pKa, pH) {
  const Ka = Math.pow(10, -pKa);
  const h = Math.pow(10, -pH);
  return 2.303 * Ctot * Ka * h / Math.pow(Ka + h, 2);
}
export const id = "tmat02";
export const level = "terminale";
export const domain = "matiere";
export const theme = "acide_base";
export const titleKey = "tmat02.title";

export function mount(container) {
  const state = { pKa: 4.75, Cb: 0.10, Ca: 0.10, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmat02.title")}</div>
    <p>${t("tmat02.desc")}</p>
    <div class="field"><label for="tmat02-pka">${t("tmat02.input.pKa")}</label><input id="tmat02-pka" type="number" step="0.01" min="0" max="14" value="${state.pKa}"></div>
    <div class="field"><label for="tmat02-cb">${t("tmat02.input.Cbase")}</label><input id="tmat02-cb" type="number" step="0.01" min="0.001" max="1" value="${state.Cb}"></div>
    <div class="field"><label for="tmat02-ca">${t("tmat02.input.Cacide")}</label><input id="tmat02-ca" type="number" step="0.01" min="0.001" max="1" value="${state.Ca}"></div>
    <div class="actions"><button class="btn" id="tmat02-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmat02-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmat02.answer.title")}</div>
    <div class="field"><label for="tmat02-ph">${t("tmat02.answer.ph")}</label><input id="tmat02-ph" type="number" step="0.01" min="0" max="14"></div>
    <div class="actions"><button class="btn-check" id="tmat02-check">${t("action.check")}</button></div>
    <div id="tmat02-status" class="status" role="status"></div>
    <div id="tmat02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const p = parseFloat(document.getElementById("tmat02-pka").value);
    const cb = parseFloat(document.getElementById("tmat02-cb").value);
    const ca = parseFloat(document.getElementById("tmat02-ca").value);
    if (isFinite(p)) state.pKa = p; if (isFinite(cb)) state.Cb = cb; if (isFinite(ca)) state.Ca = ca;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.pKa = Number((3 + rng() * 7).toFixed(2));
    state.Cb = Number((0.01 + rng() * 0.5).toFixed(2));
    state.Ca = Number((0.01 + rng() * 0.5).toFixed(2));
    document.getElementById("tmat02-pka").value = state.pKa;
    document.getElementById("tmat02-cb").value = state.Cb;
    document.getElementById("tmat02-ca").value = state.Ca;
    state.validated = false;
    document.getElementById("tmat02-status").className = "status"; document.getElementById("tmat02-status").textContent = "";
    document.getElementById("tmat02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmat02-ph").value);
    const pH = pHBuffer(state.pKa, state.Cb, state.Ca);
    const status = document.getElementById("tmat02-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - pH) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (pH = " + formatSigFigs(pH, 3) + ")"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - pH = " + formatSigFigs(pH, 3); }
    document.getElementById("tmat02-corr").style.display = "block";
    document.getElementById("tmat02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> pH = pKa + log([base]/[acide]) = " + formatSigFigs(pH, 3) + ".";
  }
  document.getElementById("tmat02-rand").addEventListener("click", randomize);
  document.getElementById("tmat02-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmat02-ph").value = "";
    document.getElementById("tmat02-status").className = "status"; document.getElementById("tmat02-status").textContent = "";
    document.getElementById("tmat02-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmat02-check").addEventListener("click", check);
  ["tmat02-pka", "tmat02-cb", "tmat02-ca"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmat02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
