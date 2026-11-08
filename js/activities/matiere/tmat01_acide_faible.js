import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const KE = 1e-14;
export function pHFaible(C, Ka) {
  const f = h => h * h * h + Ka * h * h - (KE + Ka * C) * h - Ka * KE;
  let lo = 1e-14, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    let prev = lo, fprev = flo;
    for (let i = 1; i <= 300; i++) {
      const x = lo * Math.pow(hi / lo, i / 300);
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; fhi = fx; break; }
      prev = x; fprev = fx;
    }
  }
  for (let i = 0; i < 300; i++) {
    const mid = Math.sqrt(lo * hi);
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return -Math.log10(Math.sqrt(lo * hi));
}
export function tauxAvancement(C, Ka) {
  const pH = pHFaible(C, Ka);
  const h = Math.pow(10, -pH);
  return h / C;
}
export const id = "tmat01";
export const level = "terminale";
export const domain = "matiere";
export const theme = "acide_base";
export const titleKey = "tmat01.title";

export function mount(container) {
  const state = { C: 0.010, Ka: Math.pow(10, -4.75), validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmat01.title")}</div>
    <p>${t("tmat01.desc")}</p>
    <div class="field"><label for="tmat01-c">${t("tmat01.input.C")}</label><input id="tmat01-c" type="number" step="0.001" min="1e-4" max="1" value="${state.C}"></div>
    <div class="field"><label for="tmat01-ka">${t("tmat01.input.Ka")}</label><input id="tmat01-ka" type="number" step="1e-6" min="1e-12" max="1e-2" value="${state.Ka}"></div>
    <div class="actions"><button class="btn" id="tmat01-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmat01-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmat01.answer.title")}</div>
    <div class="field"><label for="tmat01-ph">${t("tmat01.answer.ph")}</label><input id="tmat01-ph" type="number" step="0.01" min="0" max="14"></div>
    <div class="actions"><button class="btn-check" id="tmat01-check">${t("action.check")}</button></div>
    <div id="tmat01-status" class="status" role="status"></div>
    <div id="tmat01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  function readInputs() {
    const c = parseFloat(document.getElementById("tmat01-c").value);
    const ka = parseFloat(document.getElementById("tmat01-ka").value);
    if (isFinite(c)) state.C = c; if (isFinite(ka) && ka > 0) state.Ka = ka;
  }
  function refresh() { readInputs(); }
  function randomize() {
    state.C = Number((1e-3 + rng() * 0.1).toFixed(4));
    state.Ka = Number((1e-6 + rng() * 1e-4).toExponential(2));
    document.getElementById("tmat01-c").value = state.C;
    document.getElementById("tmat01-ka").value = state.Ka;
    state.validated = false;
    document.getElementById("tmat01-status").className = "status"; document.getElementById("tmat01-status").textContent = "";
    document.getElementById("tmat01-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmat01-ph").value);
    const pH = pHFaible(state.C, state.Ka);
    const tau = tauxAvancement(state.C, state.Ka);
    const status = document.getElementById("tmat01-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - pH) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (pH = " + formatSigFigs(pH, 3) + " ; tau = " + (tau * 100).toFixed(1) + " %)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - pH = " + formatSigFigs(pH, 3); }
    document.getElementById("tmat01-corr").style.display = "block";
    document.getElementById("tmat01-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> pH = " + formatSigFigs(pH, 3) + " ; tau = [H3O+]/C = " + formatSigFigs(tau, 3) + ".";
  }
  document.getElementById("tmat01-rand").addEventListener("click", randomize);
  document.getElementById("tmat01-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmat01-ph").value = "";
    document.getElementById("tmat01-status").className = "status"; document.getElementById("tmat01-status").textContent = "";
    document.getElementById("tmat01-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmat01-check").addEventListener("click", check);
  ["tmat01-c", "tmat01-ka"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmat01-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() {};
}
