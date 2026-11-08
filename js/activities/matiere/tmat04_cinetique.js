import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise } from "../../measure.js";

export function A_of_t(A0, k, time) { return A0 * Math.exp(-k * time); }
export function halfLife(k) { return Math.LN2 / k; }
export const id = "tmat04";
export const level = "terminale";
export const domain = "matiere";
export const theme = "cinetique";
export const titleKey = "tmat04.title";

export function mount(container) {
  const state = { A0: 1.0, k: 0.05, measures: [], validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmat04.title")}</div>
    <p>${t("tmat04.desc")}</p>
    <div class="field"><label for="tmat04-a0">${t("tmat04.input.A0")}</label><input id="tmat04-a0" type="number" step="0.01" min="0.1" max="2" value="${state.A0}"></div>
    <div class="field"><label for="tmat04-k">${t("tmat04.input.k")}</label><input id="tmat04-k" type="number" step="0.001" min="0.001" max="1" value="${state.k}"></div>
    <div class="actions">
      <button class="btn" id="tmat04-measure">${t("pmou02.measureAll")}</button>
      <button class="btn" id="tmat04-rand">${t("action.randomize")}</button>
      <button class="btn-secondary" id="tmat04-reset">${t("action.reset")}</button>
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
    <div class="panel-title">${t("tmat04.answer.title")}</div>
    <div class="field"><label for="tmat04-th">${t("tmat04.answer.thalf")}</label><input id="tmat04-th" type="number" step="0.1" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="tmat04-check">${t("action.check")}</button></div>
    <div id="tmat04-status" class="status" role="status"></div>
    <div id="tmat04-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 60, ymin: 0, ymax: 1.1, xlabel: "t (s)", ylabel: "A", series: [] });
  function computeMeasures() {
    const arr = [];
    for (let i = 0; i <= 10; i++) { const time = i * 5; const A = addNoise(A_of_t(state.A0, state.k, time), 0.005, rng, 1); arr.push({ t: time, A: Math.max(0, A) }); }
    return arr;
  }
  function renderGraph() {
    const meas = state.measures.length ? state.measures : computeMeasures();
    const series = [];
    if (state.validated) {
      const pts = [];
      for (let i = 0; i <= 100; i++) { const time = 60 * i / 100; pts.push({ x: time, y: A_of_t(state.A0, state.k, time) }); }
      series.push({ points: pts, color: "#1565C0", width: 2 });
    }
    series.push({ points: meas.map(m => ({ x: m.t, y: m.A })), color: "#C62828", width: 0 });
    graph.setSeries(series);
    graph.setBounds({ xmin: 0, xmax: 60, ymin: 0, ymax: state.A0 * 1.2 });
  }
  function readInputs() {
    const a0 = parseFloat(document.getElementById("tmat04-a0").value);
    const k = parseFloat(document.getElementById("tmat04-k").value);
    if (isFinite(a0)) state.A0 = a0; if (isFinite(k) && k > 0) state.k = k;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.A0 = Number((0.5 + rng() * 1.0).toFixed(2));
    state.k = Number((0.01 + rng() * 0.2).toFixed(3));
    document.getElementById("tmat04-a0").value = state.A0;
    document.getElementById("tmat04-k").value = state.k;
    state.measures = []; state.validated = false;
    document.getElementById("tmat04-status").className = "status"; document.getElementById("tmat04-status").textContent = "";
    document.getElementById("tmat04-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmat04-th").value);
    const th = halfLife(state.k);
    const status = document.getElementById("tmat04-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - th) <= 0.1 * th) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (t1/2 = " + formatSigFigs(th, 3) + " s)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - t1/2 = " + formatSigFigs(th, 3) + " s"; }
    document.getElementById("tmat04-corr").style.display = "block";
    document.getElementById("tmat04-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> t1/2 = ln2/k = " + formatSigFigs(th, 3) + " s.";
    renderGraph();
  }
  document.getElementById("tmat04-measure").addEventListener("click", () => { state.measures = computeMeasures(); renderGraph(); });
  document.getElementById("tmat04-rand").addEventListener("click", randomize);
  document.getElementById("tmat04-reset").addEventListener("click", () => {
    state.validated = false; state.measures = [];
    document.getElementById("tmat04-th").value = "";
    document.getElementById("tmat04-status").className = "status"; document.getElementById("tmat04-status").textContent = "";
    document.getElementById("tmat04-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmat04-check").addEventListener("click", check);
  ["tmat04-a0", "tmat04-k"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; state.measures = [];
      document.getElementById("tmat04-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
