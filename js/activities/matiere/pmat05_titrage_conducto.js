import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise } from "../../measure.js";

const LAMBDA = { "H+": 0.03496, "OH-": 0.0198, "Na+": 0.00501, "Cl-": 0.00763 };

export function sigmaExact(Ca, Va, Cb, Vb, kCell) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 0;
  const nH = Math.max(0, Ca * Va - Cb * Vb) * 1e-3;
  const nOH = Math.max(0, Cb * Vb - Ca * Va) * 1e-3;
  const nNa = Cb * Vb * 1e-3;
  const nCl = Ca * Va * 1e-3;
  const Vm3 = Vtot * 1e-6;
  const cH = nH / Vm3, cOH = nOH / Vm3, cNa = nNa / Vm3, cCl = nCl / Vm3;
  return LAMBDA["H+"] * cH + LAMBDA["OH-"] * cOH + LAMBDA["Na+"] * cNa + LAMBDA["Cl-"] * cCl;
}
export function findEquivalence(Ca, Va, Cb) { return Ca * Va / Cb; }

export const id = "pmat05";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat05.title";

export function mount(container) {
  const state = { Ca: 0.10, Va: 10.0, Cb: 0.10, kCell: 1.0, validated: false, seed: Date.now() & 0xffffff, series: [] };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat05.title")}</div>
    <p>${t("pmat05.desc")}</p>
    <div class="field"><label for="pmat05-ca">${t("pmat05.input.cacid")}</label><input id="pmat05-ca" type="number" step="0.001" min="0.001" max="1" value="${state.Ca}"></div>
    <div class="field"><label for="pmat05-va">${t("pmat05.input.vacid")}</label><input id="pmat05-va" type="number" step="0.01" min="1" max="50" value="${state.Va}"></div>
    <div class="field"><label for="pmat05-cb">${t("pmat05.input.cbase")}</label><input id="pmat05-cb" type="number" step="0.001" min="0.001" max="1" value="${state.Cb}"></div>
    <div class="field"><label for="pmat05-kcell">${t("pmat05.input.kcell")}</label><input id="pmat05-kcell" type="number" step="0.01" min="0.1" max="10" value="${state.kCell}"></div>
    <div class="actions"><button class="btn" id="pmat05-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pmat05-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat05.answer.ve")}</div>
    <div class="field"><label for="pmat05-ve">${t("pmat05.answer.ve")}</label><input id="pmat05-ve" type="number" step="0.01" min="0" max="200"></div>
    <div class="actions"><button class="btn-check" id="pmat05-check">${t("action.check")}</button></div>
    <div id="pmat05-status" class="status" role="status"></div>
    <div id="pmat05-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 50, xlabel: "V (mL)", ylabel: "sigma (mS/cm)", series: [] });
  function buildSeries() {
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const Vmax = Math.max(VE * 2.2, 1);
    const pts = [];
    const n = 100;
    for (let i = 0; i <= n; i++) { const V = Vmax * i / n; const s = sigmaExact(state.Ca, state.Va, state.Cb, V, state.kCell); pts.push({ x: V, y: s * 10 }); }
    return { VE, pts };
  }
  function renderGraph() {
    const { VE, pts } = buildSeries();
    const series = [];
    if (state.validated) {
      series.push({ points: pts, color: "#1565C0", width: 2 });
      series.push({ points: [{ x: VE, y: 0 }, { x: VE, y: 60 }], color: "#F57C00", width: 1, dash: [4, 4] });
    } else {
      const meas = pts.filter((p, i) => i % 4 === 0).map(p => ({ x: p.x, y: Math.max(0, addNoise(p.y, 0.05, rng, 1)) }));
      series.push({ points: meas, color: "#90A4AE", width: 1.5 });
    }
    graph.setSeries(series);
    const ymax = Math.max(...pts.map(p => p.y)) * 1.1 || 10;
    graph.setBounds({ xmin: 0, xmax: VE * 2.2, ymin: 0, ymax });
    state.series = pts;
  }
  function readInputs() {
    const Ca = parseFloat(document.getElementById("pmat05-ca").value);
    const Va = parseFloat(document.getElementById("pmat05-va").value);
    const Cb = parseFloat(document.getElementById("pmat05-cb").value);
    const k = parseFloat(document.getElementById("pmat05-kcell").value);
    if (isFinite(Ca)) state.Ca = Ca; if (isFinite(Va)) state.Va = Va; if (isFinite(Cb)) state.Cb = Cb; if (isFinite(k)) state.kCell = k;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.Ca = Number((0.020 + rng() * 0.180).toFixed(3));
    state.Va = Number((5 + rng() * 15).toFixed(1));
    state.Cb = Number((0.020 + rng() * 0.180).toFixed(3));
    state.kCell = Number((0.5 + rng() * 2).toFixed(2));
    document.getElementById("pmat05-ca").value = state.Ca;
    document.getElementById("pmat05-va").value = state.Va;
    document.getElementById("pmat05-cb").value = state.Cb;
    document.getElementById("pmat05-kcell").value = state.kCell;
    state.validated = false;
    document.getElementById("pmat05-status").className = "status"; document.getElementById("pmat05-status").textContent = "";
    document.getElementById("pmat05-corr").style.display = "none"; refresh();
  }
  function check() {
    const val = parseFloat(document.getElementById("pmat05-ve").value);
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const status = document.getElementById("pmat05-status");
    if (!isFinite(val)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(val - VE) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (" + formatSigFigs(VE, 3) + " mL)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - V_E = " + formatSigFigs(VE, 3) + " mL"; }
    document.getElementById("pmat05-corr").style.display = "block";
    document.getElementById("pmat05-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> V_E = " + formatSigFigs(VE, 3) + " mL.";
    renderGraph();
  }
  document.getElementById("pmat05-rand").addEventListener("click", randomize);
  document.getElementById("pmat05-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pmat05-ve").value = "";
    document.getElementById("pmat05-status").className = "status"; document.getElementById("pmat05-status").textContent = "";
    document.getElementById("pmat05-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat05-check").addEventListener("click", check);
  ["pmat05-ca", "pmat05-va", "pmat05-cb", "pmat05-kcell"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pmat05-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
