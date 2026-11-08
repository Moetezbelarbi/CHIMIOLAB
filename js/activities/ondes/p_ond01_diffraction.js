import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function widthCentral(lambdaNm, aUm, Dm) {
  const lambda = lambdaNm * 1e-9;
  const a = aUm * 1e-6;
  return 2 * lambda * Dm / a;
}
export function sinc(x) { if (Math.abs(x) < 1e-12) return 1; return Math.sin(x) / x; }
export function intensity(xM, lambdaNm, aUm, Dm, I0 = 1) {
  const lambda = lambdaNm * 1e-9;
  const a = aUm * 1e-6;
  const arg = Math.PI * a * xM / (lambda * Dm);
  return I0 * Math.pow(sinc(arg), 2);
}

export const id = "pond01";
export const level = "premiere";
export const domain = "ondes";
export const theme = "ondes";
export const titleKey = "pond01.title";

export function mount(container) {
  const state = { lambda: 650, a: 50, D: 2.0, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pond01.title")}</div>
    <p>${t("pond01.desc")}</p>
    <div class="field"><label for="pond01-l">${t("pond01.input.lambda")}</label><input id="pond01-l" type="number" step="1" min="400" max="700" value="${state.lambda}"></div>
    <div class="field"><label for="pond01-a">${t("pond01.input.a")}</label><input id="pond01-a" type="number" step="1" min="10" max="200" value="${state.a}"></div>
    <div class="field"><label for="pond01-d">${t("pond01.input.D")}</label><input id="pond01-d" type="number" step="0.1" min="0.5" max="5" value="${state.D}"></div>
    <div class="actions"><button class="btn" id="pond01-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pond01-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pond01.answer.title")}</div>
    <div class="field"><label for="pond01-L">${t("pond01.answer.L")}</label><input id="pond01-L" type="number" step="0.1" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="pond01-check">${t("action.check")}</button></div>
    <div id="pond01-status" class="status" role="status"></div>
    <div id="pond01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: -0.1, xmax: 0.1, ymin: 0, ymax: 1.1, xlabel: "x (m)", ylabel: "I/I0", series: [] });
  function renderGraph() {
    const L = widthCentral(state.lambda, state.a, state.D);
    const xmax = L * 3;
    const pts = [];
    for (let i = 0; i <= 200; i++) { const x = -xmax + 2 * xmax * i / 200; pts.push({ x, y: intensity(x, state.lambda, state.a, state.D) }); }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: -xmax, xmax, ymin: 0, ymax: 1.1 });
  }
  function readInputs() {
    const l = parseFloat(document.getElementById("pond01-l").value);
    const a = parseFloat(document.getElementById("pond01-a").value);
    const d = parseFloat(document.getElementById("pond01-d").value);
    if (isFinite(l)) state.lambda = l; if (isFinite(a)) state.a = a; if (isFinite(d)) state.D = d;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.lambda = [532, 633, 650, 450][Math.floor(rng() * 4)];
    state.a = Number((20 + rng() * 100).toFixed(0));
    state.D = Number((0.5 + rng() * 4).toFixed(1));
    document.getElementById("pond01-l").value = state.lambda;
    document.getElementById("pond01-a").value = state.a;
    document.getElementById("pond01-d").value = state.D;
    state.validated = false;
    document.getElementById("pond01-status").className = "status"; document.getElementById("pond01-status").textContent = "";
    document.getElementById("pond01-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pond01-L").value);
    const Lmm = widthCentral(state.lambda, state.a, state.D) * 1000;
    const status = document.getElementById("pond01-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - Lmm) / Math.max(1e-6, Lmm);
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (L = " + formatSigFigs(Lmm, 3) + " mm)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - L = " + formatSigFigs(Lmm, 3) + " mm"; }
    document.getElementById("pond01-corr").style.display = "block";
    document.getElementById("pond01-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> L = 2*lambda*D/a = " + formatSigFigs(Lmm, 3) + " mm.";
  }
  document.getElementById("pond01-rand").addEventListener("click", randomize);
  document.getElementById("pond01-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pond01-L").value = "";
    document.getElementById("pond01-status").className = "status"; document.getElementById("pond01-status").textContent = "";
    document.getElementById("pond01-corr").style.display = "none"; refresh();
  });
  document.getElementById("pond01-check").addEventListener("click", check);
  ["pond01-l", "pond01-a", "pond01-d"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pond01-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
