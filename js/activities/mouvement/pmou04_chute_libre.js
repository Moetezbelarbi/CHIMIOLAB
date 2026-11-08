import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs } from "../../measure.js";
import { G_VALUE } from "../../config.js";

const RHO_AIR = 1.2;
const CX_SPHERE = 0.47;

export function simulateFall(opts) {
  const { h0 = 1.5, m = 0.010, r = 0.020, dt = 1e-3, tMax = 3, g = G_VALUE } = opts;
  const S = Math.PI * r * r;
  const k = 0.5 * RHO_AIR * CX_SPHERE * S / m;
  let y = 0, v = 0, t = 0;
  const trace = [];
  const chrono = [];
  let nextChrono = 0;
  const chronoDt = 0.05;
  const f = (y, v) => { if (y >= h0) return { dy: 0, dv: 0 }; const drag = -k * v * Math.abs(v); return { dy: -v, dv: g + drag }; };
  while (t < tMax && y < h0) {
    const s1 = f(y, v);
    const s2 = f(y + dt / 2 * s1.dy, v + dt / 2 * s1.dv);
    const s3 = f(y + dt / 2 * s2.dy, v + dt / 2 * s2.dv);
    const s4 = f(y + dt * s3.dy, v + dt * s3.dv);
    y += dt / 6 * (s1.dy + 2 * s2.dy + 2 * s3.dy + s4.dy);
    v += dt / 6 * (s1.dv + 2 * s2.dv + 2 * s3.dv + s4.dv);
    t += dt;
    if (t >= nextChrono) { chrono.push({ t, y, v }); nextChrono += chronoDt; }
    trace.push({ t, y, v });
  }
  return { trace, chrono, tFall: t, yFall: y, vFall: v };
}
export function terminalVelocity(m, r, g = G_VALUE) {
  const S = Math.PI * r * r;
  return Math.sqrt(2 * m * g / (RHO_AIR * CX_SPHERE * S));
}

export const id = "pmou04";
export const level = "premiere";
export const domain = "mouvement";
export const theme = "mouvement_systeme";
export const titleKey = "pmou04.title";

export function mount(container) {
  const state = { h0: 1.5, m: 0.010, r: 0.020, validated: false };
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmou04.title")}</div>
    <p>${t("pmou04.desc")}</p>
    <div class="field"><label for="pmou04-h">${t("pmou04.input.h")}</label><input id="pmou04-h" type="number" step="0.1" min="0.5" max="10" value="${state.h0}"></div>
    <div class="field"><label for="pmou04-m">${t("pmou04.input.m")}</label><input id="pmou04-m" type="number" step="0.001" min="0.001" max="1" value="${state.m}"></div>
    <div class="field"><label for="pmou04-r">${t("pmou04.input.r")}</label><input id="pmou04-r" type="number" step="0.001" min="0.001" max="0.2" value="${state.r}"></div>
    <div class="actions"><button class="btn" id="pmou04-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pmou04-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmou04.answer.title")}</div>
    <div class="field"><label for="pmou04-vlim">${t("pmou04.answer.vlim")}</label><input id="pmou04-vlim" type="number" step="0.01" min="0" max="1000"></div>
    <div class="actions"><button class="btn-check" id="pmou04-check">${t("action.check")}</button></div>
    <div id="pmou04-status" class="status" role="status"></div>
    <div id="pmou04-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 1, ymin: 0, ymax: 20, xlabel: "t (s)", ylabel: "v (m/s)", series: [] });
  function readInputs() {
    const h = parseFloat(document.getElementById("pmou04-h").value);
    const m = parseFloat(document.getElementById("pmou04-m").value);
    const r = parseFloat(document.getElementById("pmou04-r").value);
    if (isFinite(h)) state.h0 = h; if (isFinite(m)) state.m = m; if (isFinite(r)) state.r = r;
  }
  function render() {
    const sim = simulateFall({ h0: state.h0, m: state.m, r: state.r });
    const pts = sim.trace.map(p => ({ x: p.t, y: p.v }));
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: Math.max(0.1, sim.tFall * 1.1), ymin: 0, ymax: Math.max(...pts.map(p => p.y), 0.1) * 1.2 });
  }
  function refresh() { readInputs(); render(); }
  function randomize() {
    state.h0 = Number((0.5 + Math.random() * 5).toFixed(1));
    state.m = Number((0.001 + Math.random() * 0.1).toFixed(3));
    state.r = Number((0.005 + Math.random() * 0.05).toFixed(3));
    document.getElementById("pmou04-h").value = state.h0;
    document.getElementById("pmou04-m").value = state.m;
    document.getElementById("pmou04-r").value = state.r;
    state.validated = false;
    document.getElementById("pmou04-status").className = "status"; document.getElementById("pmou04-status").textContent = "";
    document.getElementById("pmou04-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pmou04-vlim").value);
    const status = document.getElementById("pmou04-status");
    const vlim = terminalVelocity(state.m, state.r);
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    const rel = Math.abs(ans - vlim) / vlim;
    if (rel <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (v_lim = " + formatSigFigs(vlim, 3) + " m/s)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - v_lim = " + formatSigFigs(vlim, 3) + " m/s"; }
    document.getElementById("pmou04-corr").style.display = "block";
    document.getElementById("pmou04-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> v_lim = sqrt(2mg/(rho_air*Cx*S)) = " + formatSigFigs(vlim, 3) + " m/s.";
  }
  document.getElementById("pmou04-rand").addEventListener("click", randomize);
  document.getElementById("pmou04-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pmou04-vlim").value = "";
    document.getElementById("pmou04-status").className = "status"; document.getElementById("pmou04-status").textContent = "";
    document.getElementById("pmou04-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmou04-check").addEventListener("click", check);
  ["pmou04-h", "pmou04-m", "pmou04-r"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pmou04-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
