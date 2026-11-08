import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise } from "../../measure.js";

const KA_ACETIC = 10 ** -4.75;
const KE = 1.0e-14;

export function pHExact(Ca, Va, Cb, Vb) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 7;
  const cNa = Cb * Vb / Vtot;
  const cAtot = Ca * Va / Vtot;
  const f = h => cNa + h - KE / h - cAtot * KA_ACETIC / (KA_ACETIC + h);
  let lo = 1e-14, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    let prev = lo, fprev = flo;
    for (let i = 1; i <= 200; i++) {
      const x = lo * Math.pow(hi / lo, i / 200);
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; fhi = fx; break; }
      prev = x; fprev = fx;
    }
  }
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

const KA_NH4 = 10 ** -9.25;
export function pHExactBaseFaible(Cb, Vb, Ca, Va) {
  const Vtot = Va + Vb;
  const cCl = Ca * Va / Vtot;
  const cBtot = Cb * Vb / Vtot;
  const f = h => cCl + KE / h - h - cBtot * h / (KA_NH4 + h);
  let lo = 1e-14, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    let prev = lo, fprev = flo;
    for (let i = 1; i <= 200; i++) {
      const x = lo * Math.pow(hi / lo, i / 200);
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; fhi = fx; break; }
      prev = x; fprev = fx;
    }
  }
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

export function findEquivalence(Ca, Va, Cb) { return Ca * Va / Cb; }

export const id = "pmat04";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat04.title";

export function mount(container) {
  const state = { Ca: 0.070, Va: 10.0, Cb: 0.050, indicator: "none", validated: false, seed: Date.now() & 0xffffff, series: [] };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat04.title")}</div>
    <p>${t("pmat04.desc")}</p>
    <div class="field"><label for="pmat04-ca">${t("pmat04.input.cacid")}</label><input id="pmat04-ca" type="number" step="0.001" min="0.001" max="1" value="${state.Ca}"></div>
    <div class="field"><label for="pmat04-va">${t("pmat04.input.vacid")}</label><input id="pmat04-va" type="number" step="0.01" min="1" max="50" value="${state.Va}"></div>
    <div class="field"><label for="pmat04-cb">${t("pmat04.input.cbase")}</label><input id="pmat04-cb" type="number" step="0.001" min="0.001" max="1" value="${state.Cb}"></div>
    <div class="field"><label for="pmat04-ind">${t("pmat04.input.indicator")}</label>
      <select id="pmat04-ind"><option value="none">${t("pmat04.indicator.none")}</option><option value="helianthine">${t("pmat04.indicator.helianthine")}</option><option value="bbt">${t("pmat04.indicator.bbt")}</option><option value="phenolphtaleine">${t("pmat04.indicator.phenolphtaleine")}</option></select></div>
    <div class="actions"><button class="btn" id="pmat04-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pmat04-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat04.answer.ve")}</div>
    <div class="field"><label for="pmat04-ve">${t("pmat04.answer.ve")}</label><input id="pmat04-ve" type="number" step="0.01" min="0" max="200"></div>
    <div class="actions"><button class="btn-check" id="pmat04-check">${t("action.check")}</button></div>
    <div id="pmat04-status" class="status" role="status"></div>
    <div id="pmat04-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 14, xlabel: "V (mL)", ylabel: "pH", series: [] });
  function buildSeries() {
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const pts = [];
    const n = 80;
    const Vmax = Math.max(VE * 2.2, 1);
    for (let i = 0; i <= n; i++) { const V = Vmax * i / n; pts.push({ x: V, y: pHExact(state.Ca, state.Va, state.Cb, V) }); }
    for (let k = -5; k <= 5; k++) { const V = VE + k * 0.02; if (V >= 0) pts.push({ x: V, y: pHExact(state.Ca, state.Va, state.Cb, V) }); }
    pts.sort((a, b) => a.x - b.x);
    return { VE, pts };
  }
  function renderGraph() {
    const { VE, pts } = buildSeries();
    const series = [];
    if (state.validated) {
      series.push({ points: pts, color: "#1565C0", width: 2 });
      series.push({ points: [{ x: VE, y: 0 }, { x: VE, y: 14 }], color: "#F57C00", width: 1, dash: [4, 4] });
    } else {
      const meas = pts.filter((p, i) => i % 4 === 0).map(p => ({ x: p.x, y: Math.max(0, Math.min(14, addNoise(p.y, 0.02, rng, 1))) }));
      series.push({ points: meas, color: "#90A4AE", width: 1.5 });
    }
    graph.setSeries(series);
    graph.setBounds({ xmin: 0, xmax: Math.max(VE * 2.2, 1), ymin: 0, ymax: 14 });
    state.series = pts;
  }
  function readInputs() {
    const Ca = parseFloat(document.getElementById("pmat04-ca").value);
    const Va = parseFloat(document.getElementById("pmat04-va").value);
    const Cb = parseFloat(document.getElementById("pmat04-cb").value);
    if (isFinite(Ca)) state.Ca = Ca; if (isFinite(Va)) state.Va = Va; if (isFinite(Cb)) state.Cb = Cb;
    state.indicator = document.getElementById("pmat04-ind").value;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.Ca = Number((0.020 + rng() * 0.180).toFixed(3));
    state.Va = Number((5 + rng() * 15).toFixed(1));
    state.Cb = Number((0.010 + rng() * 0.190).toFixed(3));
    document.getElementById("pmat04-ca").value = state.Ca;
    document.getElementById("pmat04-va").value = state.Va;
    document.getElementById("pmat04-cb").value = state.Cb;
    state.validated = false;
    document.getElementById("pmat04-status").className = "status"; document.getElementById("pmat04-status").textContent = "";
    document.getElementById("pmat04-corr").style.display = "none"; refresh();
  }
  function check() {
    const val = parseFloat(document.getElementById("pmat04-ve").value);
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const status = document.getElementById("pmat04-status");
    if (!isFinite(val)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(val - VE) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (" + formatSigFigs(VE, 3) + " mL)"; }
    else { status.className = "status status-err"; let msg = t("status.incorrect") + " - V_E = " + formatSigFigs(VE, 3) + " mL"; if (Math.abs(val - VE) > 10) msg += " - " + t("status.powerError"); status.textContent = msg; }
    const corr = document.getElementById("pmat04-corr");
    corr.style.display = "block";
    corr.innerHTML = "<strong>" + t("report.correction") + " :</strong> V_E = C_a*V_a/C_b = " + formatSigFigs(VE, 3) + " mL.";
    renderGraph();
  }
  document.getElementById("pmat04-rand").addEventListener("click", randomize);
  document.getElementById("pmat04-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pmat04-ve").value = "";
    document.getElementById("pmat04-status").className = "status"; document.getElementById("pmat04-status").textContent = "";
    document.getElementById("pmat04-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat04-check").addEventListener("click", check);
  ["pmat04-ca", "pmat04-va", "pmat04-cb", "pmat04-ind"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pmat04-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
