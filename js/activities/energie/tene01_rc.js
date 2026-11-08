import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function chargeUC(E, R, C, time) { return E * (1 - Math.exp(-time / (R * C))); }
export function tau(R, C) { return R * C; }
export const id = "tene01";
export const level = "terminale";
export const domain = "energie";
export const theme = "circuit_rc";
export const titleKey = "tene01.title";

export function mount(container) {
  const state = { E: 5, R: 1000, C: 1e-3, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tene01.title")}</div>
    <p>${t("tene01.desc")}</p>
    <div class="field"><label for="tene01-e">${t("tene01.input.E")}</label><input id="tene01-e" type="number" step="0.1" min="0.1" max="50" value="${state.E}"></div>
    <div class="field"><label for="tene01-r">${t("tene01.input.R")}</label><input id="tene01-r" type="number" step="10" min="10" max="1e6" value="${state.R}"></div>
    <div class="field"><label for="tene01-c">${t("tene01.input.C")}</label><input id="tene01-c" type="number" step="1e-4" min="1e-6" max="1e-1" value="${state.C}"></div>
    <div class="actions"><button class="btn" id="tene01-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tene01-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tene01.answer.title")}</div>
    <div class="field"><label for="tene01-tau">${t("tene01.answer.tau")}</label><input id="tene01-tau" type="number" step="0.001" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="tene01-check">${t("action.check")}</button></div>
    <div id="tene01-status" class="status" role="status"></div>
    <div id="tene01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 5, ymin: 0, ymax: 6, xlabel: "t/tau", ylabel: "u_C (V)", series: [] });
  function readInputs() {
    const e = parseFloat(document.getElementById("tene01-e").value);
    const r = parseFloat(document.getElementById("tene01-r").value);
    const c = parseFloat(document.getElementById("tene01-c").value);
    if (isFinite(e)) state.E = e; if (isFinite(r) && r > 0) state.R = r; if (isFinite(c) && c > 0) state.C = c;
  }
  function refresh() {
    readInputs();
    const tt = tau(state.R, state.C);
    const pts = [];
    for (let i = 0; i <= 100; i++) { const time = 5 * tt * i / 100; pts.push({ x: time / tt, y: chargeUC(state.E, state.R, state.C, time) }); }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: 5, ymin: 0, ymax: state.E * 1.1 });
  }
  function randomize() {
    state.E = Number((1 + rng() * 20).toFixed(1));
    state.R = Number((100 + rng() * 9000).toFixed(0));
    state.C = Number((1e-5 + rng() * 1e-3).toExponential(2));
    document.getElementById("tene01-e").value = state.E;
    document.getElementById("tene01-r").value = state.R;
    document.getElementById("tene01-c").value = state.C;
    state.validated = false;
    document.getElementById("tene01-status").className = "status"; document.getElementById("tene01-status").textContent = "";
    document.getElementById("tene01-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tene01-tau").value);
    const tt = tau(state.R, state.C);
    const status = document.getElementById("tene01-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - tt) / tt <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (tau = " + formatSigFigs(tt, 3) + " s)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - tau = " + formatSigFigs(tt, 3) + " s"; }
    document.getElementById("tene01-corr").style.display = "block";
    document.getElementById("tene01-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> tau = RC = " + formatSigFigs(tt, 3) + " s.";
  }
  document.getElementById("tene01-rand").addEventListener("click", randomize);
  document.getElementById("tene01-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tene01-tau").value = "";
    document.getElementById("tene01-status").className = "status"; document.getElementById("tene01-status").textContent = "";
    document.getElementById("tene01-corr").style.display = "none"; refresh();
  });
  document.getElementById("tene01-check").addEventListener("click", check);
  ["tene01-e", "tene01-r", "tene01-c"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tene01-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
