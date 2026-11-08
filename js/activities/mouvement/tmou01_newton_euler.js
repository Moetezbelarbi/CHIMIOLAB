import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function simulateConstantForce(m, F, v0, dt, tMax) {
  const a = F / m;
  let v = v0, x = 0, time = 0;
  const trace = [{ t: 0, v, x }];
  while (time < tMax) { v = v + a * dt; x += v * dt; time += dt; trace.push({ t: time, v, x }); }
  return trace;
}
export const id = "tmou01";
export const level = "terminale";
export const domain = "mouvement";
export const theme = "lois_newton";
export const titleKey = "tmou01.title";

export function mount(container) {
  const state = { m: 1.0, F: 2.0, v0: 0, dt: 0.01, tMax: 5, validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("tmou01.title")}</div>
    <p>${t("tmou01.desc")}</p>
    <div class="field"><label for="tmou01-m">${t("tmou01.input.m")}</label><input id="tmou01-m" type="number" step="0.1" min="0.1" max="100" value="${state.m}"></div>
    <div class="field"><label for="tmou01-f">${t("tmou01.input.F")}</label><input id="tmou01-f" type="number" step="0.1" min="-100" max="100" value="${state.F}"></div>
    <div class="field"><label for="tmou01-v0">${t("tmou01.input.v0")}</label><input id="tmou01-v0" type="number" step="0.1" min="-100" max="100" value="${state.v0}"></div>
    <div class="actions"><button class="btn" id="tmou01-rand">${t("action.randomize")}</button><button class="btn-secondary" id="tmou01-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("tmou01.answer.title")}</div>
    <div class="field"><label for="tmou01-a">${t("tmou01.answer.a")}</label><input id="tmou01-a" type="number" step="0.01" min="-1000" max="1000"></div>
    <div class="actions"><button class="btn-check" id="tmou01-check">${t("action.check")}</button></div>
    <div id="tmou01-status" class="status" role="status"></div>
    <div id="tmou01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 5, ymin: 0, ymax: 10, xlabel: "t (s)", ylabel: "v (m/s)", series: [] });
  function readInputs() {
    const m = parseFloat(document.getElementById("tmou01-m").value);
    const F = parseFloat(document.getElementById("tmou01-f").value);
    const v0 = parseFloat(document.getElementById("tmou01-v0").value);
    if (isFinite(m) && m > 0) state.m = m; if (isFinite(F)) state.F = F; if (isFinite(v0)) state.v0 = v0;
  }
  function refresh() {
    readInputs();
    const tr = simulateConstantForce(state.m, state.F, state.v0, state.dt, state.tMax);
    const pts = tr.map(p => ({ x: p.t, y: p.v }));
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: state.tMax, ymin: Math.min(...pts.map(p => p.y), 0), ymax: Math.max(...pts.map(p => p.y), 1) * 1.2 });
  }
  function randomize() {
    state.m = Number((0.5 + rng() * 10).toFixed(1));
    state.F = Number((-20 + rng() * 40).toFixed(1));
    state.v0 = Number((-10 + rng() * 20).toFixed(1));
    document.getElementById("tmou01-m").value = state.m;
    document.getElementById("tmou01-f").value = state.F;
    document.getElementById("tmou01-v0").value = state.v0;
    state.validated = false;
    document.getElementById("tmou01-status").className = "status"; document.getElementById("tmou01-status").textContent = "";
    document.getElementById("tmou01-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("tmou01-a").value);
    const a = state.F / state.m;
    const status = document.getElementById("tmou01-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - a) <= 0.05 * Math.max(1, Math.abs(a))) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (a = " + formatSigFigs(a, 3) + " m/s2)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - a = " + formatSigFigs(a, 3) + " m/s2"; }
    document.getElementById("tmou01-corr").style.display = "block";
    document.getElementById("tmou01-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> a = F/m = " + formatSigFigs(a, 3) + " m/s2.";
  }
  document.getElementById("tmou01-rand").addEventListener("click", randomize);
  document.getElementById("tmou01-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("tmou01-a").value = "";
    document.getElementById("tmou01-status").className = "status"; document.getElementById("tmou01-status").textContent = "";
    document.getElementById("tmou01-corr").style.display = "none"; refresh();
  });
  document.getElementById("tmou01-check").addEventListener("click", check);
  ["tmou01-m", "tmou01-f", "tmou01-v0"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("tmou01-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
