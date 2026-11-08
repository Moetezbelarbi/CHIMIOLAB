import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function interfrange(lambdaNm, bMm, Dm) {
  return lambdaNm * 1e-9 * Dm / (bMm * 1e-3);
}
export function intensityYoung(xM, lambdaNm, bMm, Dm) {
  const i = interfrange(lambdaNm, bMm, Dm);
  return Math.pow(Math.cos(Math.PI * xM / i), 2);
}

export const id = "pond02";
export const level = "premiere";
export const domain = "ondes";
export const theme = "ondes";
export const titleKey = "pond02.title";

export function mount(container) {
  const state = { lambda: 600, b: 0.5, D: 1.0, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pond02.title")}</div>
    <p>${t("pond02.desc")}</p>
    <div class="field"><label for="pond02-l">${t("pond01.input.lambda")}</label><input id="pond02-l" type="number" step="1" min="400" max="700" value="${state.lambda}"></div>
    <div class="field"><label for="pond02-b">${t("pond02.input.b")}</label><input id="pond02-b" type="number" step="0.01" min="0.05" max="2" value="${state.b}"></div>
    <div class="field"><label for="pond02-d">${t("pond01.input.D")}</label><input id="pond02-d" type="number" step="0.1" min="0.5" max="5" value="${state.D}"></div>
    <div class="actions"><button class="btn" id="pond02-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pond02-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pond02.answer.title")}</div>
    <div class="field"><label for="pond02-i">${t("pond02.answer.i")}</label><input id="pond02-i" type="number" step="0.01" min="0" max="100"></div>
    <div class="actions"><button class="btn-check" id="pond02-check">${t("action.check")}</button></div>
    <div id="pond02-status" class="status" role="status"></div>
    <div id="pond02-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: -0.01, xmax: 0.01, ymin: 0, ymax: 1.1, xlabel: "x (m)", ylabel: "I/I0", series: [] });
  function renderGraph() {
    const i = interfrange(state.lambda, state.b, state.D);
    const xmax = i * 6;
    const pts = [];
    for (let k = 0; k <= 300; k++) { const x = -xmax + 2 * xmax * k / 300; pts.push({ x, y: intensityYoung(x, state.lambda, state.b, state.D) }); }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: -xmax, xmax, ymin: 0, ymax: 1.1 });
  }
  function readInputs() {
    const l = parseFloat(document.getElementById("pond02-l").value);
    const b = parseFloat(document.getElementById("pond02-b").value);
    const d = parseFloat(document.getElementById("pond02-d").value);
    if (isFinite(l)) state.lambda = l; if (isFinite(b)) state.b = b; if (isFinite(d)) state.D = d;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    state.lambda = [450, 532, 600, 633][Math.floor(rng() * 4)];
    state.b = Number((0.1 + rng() * 1.5).toFixed(2));
    state.D = Number((0.5 + rng() * 4).toFixed(1));
    document.getElementById("pond02-l").value = state.lambda;
    document.getElementById("pond02-b").value = state.b;
    document.getElementById("pond02-d").value = state.D;
    state.validated = false;
    document.getElementById("pond02-status").className = "status"; document.getElementById("pond02-status").textContent = "";
    document.getElementById("pond02-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pond02-i").value);
    const imm = interfrange(state.lambda, state.b, state.D) * 1000;
    const status = document.getElementById("pond02-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - imm) / Math.max(1e-6, imm);
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (i = " + formatSigFigs(imm, 3) + " mm)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - i = " + formatSigFigs(imm, 3) + " mm"; }
    document.getElementById("pond02-corr").style.display = "block";
    document.getElementById("pond02-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> i = lambda*D/b = " + formatSigFigs(imm, 3) + " mm.";
  }
  document.getElementById("pond02-rand").addEventListener("click", randomize);
  document.getElementById("pond02-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pond02-i").value = "";
    document.getElementById("pond02-status").className = "status"; document.getElementById("pond02-status").textContent = "";
    document.getElementById("pond02-corr").style.display = "none"; refresh();
  });
  document.getElementById("pond02-check").addEventListener("click", check);
  ["pond02-l", "pond02-b", "pond02-d"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pond02-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
