import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

export const P_ATM = 101325;
export const R_RESOLUTION = 10;
export const V_RESOLUTION = 0.5;

export function pressureBoyle(VmL, V0mL, P0Pa) { return P0Pa * V0mL / (VmL + V0mL); }

export const id = "pmou02";
export const level = "premiere";
export const domain = "mouvement";
export const theme = "fluide_repos";
export const titleKey = "pmou02.title";

export function mount(container) {
  const state = { V0: 2.0, Vinit: 20.0, P0: P_ATM, measures: [], validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmou02.title")}</div>
    <p>${t("pmou02.desc")}</p>
    <div class="field"><label for="pmou02-v0">${t("pmou02.input.v0")}</label><input id="pmou02-v0" type="number" step="0.1" min="0" max="10" value="${state.V0}"></div>
    <div class="field"><label for="pmou02-vinit">${t("pmou02.input.vinit")}</label><input id="pmou02-vinit" type="number" step="0.1" min="5" max="60" value="${state.Vinit}"></div>
    <div class="actions">
      <button class="btn" id="pmou02-measure">${t("pmou02.measureAll")}</button>
      <button class="btn" id="pmou02-rand">${t("action.randomize")}</button>
      <button class="btn-secondary" id="pmou02-reset">${t("action.reset")}</button>
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
    <div class="panel-title">${t("pmou02.answer.title")}</div>
    <div class="field"><label for="pmou02-k">${t("pmou02.answer.k")}</label><input id="pmou02-k" type="number" step="1" min="0" max="1e7"></div>
    <div class="actions"><button class="btn-check" id="pmou02-check">${t("action.check")}</button></div>
    <div id="pmou02-status" class="status" role="status"></div>
    <div id="pmou02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 25, ymin: 0, ymax: 200000, xlabel: "V (mL)", ylabel: "P (Pa)", series: [] });
  function computeMeasures() {
    const arr = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const V = state.Vinit * (1 - i / (n + 1)) + 1;
      const Ptrue = pressureBoyle(V, state.V0, state.P0);
      const Pmeas = roundToResolution(addNoise(Ptrue, R_RESOLUTION, rng, 1), R_RESOLUTION);
      const Vmeas = roundToResolution(addNoise(V, V_RESOLUTION, rng, 1), V_RESOLUTION);
      arr.push({ V: Vmeas, P: Pmeas });
    }
    return arr;
  }
  function renderGraph() {
    const meas = state.measures.length ? state.measures : computeMeasures();
    const series = [];
    if (state.validated) {
      const pts = [];
      for (let i = 0; i <= 40; i++) { const V = state.Vinit * i / 40 + 0.01; pts.push({ x: V, y: pressureBoyle(V, state.V0, state.P0) }); }
      series.push({ points: pts, color: "#1565C0", width: 2 });
    }
    series.push({ points: meas.map(m => ({ x: m.V, y: m.P })), color: "#C62828", width: 0 });
    graph.setSeries(series);
    graph.setBounds({ xmin: 0, xmax: state.Vinit * 1.1, ymin: 0, ymax: Math.max(...meas.map(m => m.P)) * 1.2 });
  }
  function readInputs() {
    const v0 = parseFloat(document.getElementById("pmou02-v0").value);
    const vi = parseFloat(document.getElementById("pmou02-vinit").value);
    if (isFinite(v0)) state.V0 = v0; if (isFinite(vi)) state.Vinit = vi;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.V0 = Number((0.5 + rng() * 4).toFixed(1));
    state.Vinit = Number((10 + rng() * 40).toFixed(1));
    document.getElementById("pmou02-v0").value = state.V0;
    document.getElementById("pmou02-vinit").value = state.Vinit;
    state.measures = []; state.validated = false;
    document.getElementById("pmou02-status").className = "status"; document.getElementById("pmou02-status").textContent = "";
    document.getElementById("pmou02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pmou02-k").value);
    const status = document.getElementById("pmou02-status");
    const kTheo = state.P0 * state.V0;
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - kTheo) / Math.max(1, kTheo);
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (k = " + formatSigFigs(kTheo, 3) + " Pa.mL)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - k = " + formatSigFigs(kTheo, 3) + " Pa.mL"; }
    document.getElementById("pmou02-corr").style.display = "block";
    document.getElementById("pmou02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> k = P0*V0 = " + formatSigFigs(kTheo, 3) + " Pa.mL.";
    renderGraph();
  }
  document.getElementById("pmou02-measure").addEventListener("click", () => { state.measures = computeMeasures(); renderGraph(); });
  document.getElementById("pmou02-rand").addEventListener("click", randomize);
  document.getElementById("pmou02-reset").addEventListener("click", () => {
    state.validated = false; state.measures = [];
    document.getElementById("pmou02-k").value = "";
    document.getElementById("pmou02-status").className = "status"; document.getElementById("pmou02-status").textContent = "";
    document.getElementById("pmou02-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmou02-check").addEventListener("click", check);
  ["pmou02-v0", "pmou02-vinit"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; state.measures = [];
      document.getElementById("pmou02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
