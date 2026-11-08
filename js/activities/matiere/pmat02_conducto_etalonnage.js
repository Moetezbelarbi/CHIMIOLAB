import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise } from "../../measure.js";

const LAMBDA = { "K+": 0.00735, "Cl-": 0.00763, "Na+": 0.00501 };
export function sigmaKCl(CmolL, thetaC) {
  const sigma25 = (LAMBDA["K+"] + LAMBDA["Cl-"]) * CmolL * 1000;
  return sigma25 * (1 + 0.02 * (thetaC - 25));
}
export function sigmaNaCl(CmolL, thetaC) {
  const sigma25 = (LAMBDA["Na+"] + LAMBDA["Cl-"]) * CmolL * 1000;
  return sigma25 * (1 + 0.02 * (thetaC - 25));
}
export const KCl_REF = { C: 0.0100, sigma_25: 1.413e-1 };
export const id = "pmat02";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat02.title";

export function mount(container) {
  const state = { theta: 25, etalonsKCl: [0.0100, 0.0050, 0.0020], unknownC: 0.050, validated: false, seed: Date.now() & 0xffffff, measured: [] };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat02.title")}</div>
    <p>${t("pmat02.desc")}</p>
    <div class="field"><label for="pmat02-theta">${t("pmat02.input.theta")}</label><input id="pmat02-theta" type="number" step="0.1" min="15" max="35" value="${state.theta}"></div>
    <div class="field"><label for="pmat02-kcl">${t("pmat02.input.kcl")}</label><input id="pmat02-kcl" type="number" step="0.0001" min="0.001" max="0.1" value="${state.etalonsKCl[0]}"></div>
    <div class="field"><label for="pmat02-unk">${t("pmat02.input.unknownC")}</label><input id="pmat02-unk" type="number" step="0.001" min="0.001" max="0.5" value="${state.unknownC}"></div>
    <div class="actions">
      <button class="btn" id="pmat02-rand">${t("action.randomize")}</button>
      <button class="btn-secondary" id="pmat02-measure">${t("pmat02.measureAll")}</button>
      <button class="btn-secondary" id="pmat02-reset">${t("action.reset")}</button>
    </div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat02.answer.kcell")}</div>
    <div class="field"><label for="pmat02-kcell">${t("pmat02.input.kcell")}</label><input id="pmat02-kcell" type="number" step="0.01" min="0.1" max="10"></div>
    <div class="actions"><button class="btn-check" id="pmat02-check">${t("action.check")}</button></div>
    <div id="pmat02-status" class="status" role="status"></div>
    <div id="pmat02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 0.012, ymin: 0, ymax: 0.2, xlabel: "C (mol/L)", ylabel: "sigma (S/m)", series: [] });
  function computeMeasured() {
    return state.etalonsKCl.map(C => { const s = sigmaKCl(C, state.theta); return { C, sigma: Math.max(0, addNoise(s, 0.0005, rng, 1)) }; });
  }
  function renderGraph() {
    const meas = state.measured.length ? state.measured : computeMeasured();
    const series = [];
    if (state.validated) {
      const Cmax = Math.max(...meas.map(m => m.C)) * 1.1;
      const sigmaMax = sigmaKCl(Cmax, state.theta);
      series.push({ points: [{ x: 0, y: 0 }, { x: Cmax, y: sigmaMax }], color: "#1565C0", width: 2 });
    }
    series.push({ points: meas.map(m => ({ x: m.C, y: m.sigma })), color: "#C62828", width: 0 });
    graph.setSeries(series);
    const Cmax = Math.max(...meas.map(m => m.C), 1e-4) * 1.1;
    const smax = Math.max(...meas.map(m => m.sigma), 0.01) * 1.3;
    graph.setBounds({ xmin: 0, xmax: Cmax, ymin: 0, ymax: smax });
  }
  function readInputs() {
    const th = parseFloat(document.getElementById("pmat02-theta").value); if (isFinite(th)) state.theta = th;
    const k = parseFloat(document.getElementById("pmat02-kcl").value); if (isFinite(k)) state.etalonsKCl[0] = k;
    const u = parseFloat(document.getElementById("pmat02-unk").value); if (isFinite(u)) state.unknownC = u;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.theta = Number((18 + rng() * 14).toFixed(1));
    state.etalonsKCl = [Number((0.002 + rng() * 0.008).toFixed(4)), Number((0.001 + rng() * 0.004).toFixed(4)), Number((0.0005 + rng() * 0.002).toFixed(4))];
    state.unknownC = Number((0.01 + rng() * 0.2).toFixed(3));
    document.getElementById("pmat02-theta").value = state.theta;
    document.getElementById("pmat02-kcl").value = state.etalonsKCl[0];
    document.getElementById("pmat02-unk").value = state.unknownC;
    state.validated = false; state.measured = [];
    document.getElementById("pmat02-status").className = "status"; document.getElementById("pmat02-status").textContent = "";
    document.getElementById("pmat02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pmat02-kcell").value);
    const status = document.getElementById("pmat02-status");
    const meas = state.measured.length ? state.measured : computeMeasured();
    const eta = meas[0];
    const sigmaTheo = sigmaKCl(eta.C, state.theta);
    const kTheo = sigmaTheo / eta.sigma;
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - kTheo) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (k = " + formatSigFigs(kTheo, 3) + " m-1)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - k = " + formatSigFigs(kTheo, 3) + " m-1"; }
    document.getElementById("pmat02-corr").style.display = "block";
    document.getElementById("pmat02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> k = sigma_theo(KCl " + eta.C + " mol/L) / sigma_mes = " + formatSigFigs(kTheo, 3) + " m-1.";
    renderGraph();
  }
  document.getElementById("pmat02-rand").addEventListener("click", randomize);
  document.getElementById("pmat02-measure").addEventListener("click", () => { state.measured = computeMeasured(); renderGraph(); });
  document.getElementById("pmat02-reset").addEventListener("click", () => {
    state.validated = false; state.measured = [];
    document.getElementById("pmat02-kcell").value = "";
    document.getElementById("pmat02-status").className = "status"; document.getElementById("pmat02-status").textContent = "";
    document.getElementById("pmat02-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat02-check").addEventListener("click", check);
  ["pmat02-theta", "pmat02-kcl", "pmat02-unk"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; state.measured = [];
      document.getElementById("pmat02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
