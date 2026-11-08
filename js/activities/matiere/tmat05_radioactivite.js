import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function N_of_t(N0, lambda, time) { return N0 * Math.exp(-lambda * time); }
export function demiVie(lambda) { return Math.LN2 / lambda; }
export const id = "tmat05";
export const level = "terminale";
export const domain = "matiere";
export const theme = "radioactivite";
export const titleKey = "tmat05.title";

export function mount(container) {
  const state = { N0: 1e6, lambda: 0.01, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmat05.title")}</div>
    <p>${t("tmat05.desc")}</p>
    <div class="field"><label for="tmat05-n0">${t("tmat05.input.N0")}</label><input id="tmat05-n0" type="number" step="1000" min="100" max="1e9" value="${state.N0}"></div>
    <div class="field"><label for="tmat05-l">${t("tmat05.input.lambda")}</label><input id="tmat05-l" type="number" step="0.001" min="0.0001" max="1" value="${state.lambda}"></div>
    <div class="actions"><button class="btn" id="tmat05-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmat05-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmat05.answer.title")}</div>
    <div class="field"><label for="tmat05-th">${t("tmat05.answer.thalf")}</label><input id="tmat05-th" type="number" step="0.01" min="0" max="10000"></div>
    <div class="actions"><button class="btn-check" id="tmat05-check">${t("action.check")}</button></div>
    <div id="tmat05-status" class="status" role="status"></div>
    <div id="tmat05-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 100, ymin: 0, ymax: 1e6, xlabel: "t", ylabel: "N", series: [] });
  function renderGraph() {
    const tMax = 5 / state.lambda;
    const pts = [];
    for (let i = 0; i <= 200; i++) { const time = tMax * i / 200; pts.push({ x: time, y: N_of_t(state.N0, state.lambda, time) }); }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: tMax, ymin: 0, ymax: state.N0 * 1.05 });
  }
  function readInputs() {
    const n0 = parseFloat(document.getElementById("tmat05-n0").value);
    const l = parseFloat(document.getElementById("tmat05-l").value);
    if (isFinite(n0)) state.N0 = n0; if (isFinite(l) && l > 0) state.lambda = l;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.N0 = Number((1e5 + rng() * 9e6).toExponential(2));
    state.lambda = Number((0.005 + rng() * 0.05).toExponential(2));
    document.getElementById("tmat05-n0").value = state.N0;
    document.getElementById("tmat05-l").value = state.lambda;
    state.validated = false;
    document.getElementById("tmat05-status").className = "status"; document.getElementById("tmat05-status").textContent = "";
    document.getElementById("tmat05-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmat05-th").value);
    const th = demiVie(state.lambda);
    const status = document.getElementById("tmat05-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - th) / th <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (t1/2 = " + formatSigFigs(th, 3) + ")"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - t1/2 = " + formatSigFigs(th, 3); }
    document.getElementById("tmat05-corr").style.display = "block";
    document.getElementById("tmat05-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> t1/2 = ln2/lambda = " + formatSigFigs(th, 3) + ".";
  }
  document.getElementById("tmat05-rand").addEventListener("click", randomize);
  document.getElementById("tmat05-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmat05-th").value = "";
    document.getElementById("tmat05-status").className = "status"; document.getElementById("tmat05-status").textContent = "";
    document.getElementById("tmat05-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmat05-check").addEventListener("click", check);
  ["tmat05-n0", "tmat05-l"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmat05-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
