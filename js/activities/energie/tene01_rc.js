import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { makeRng } from "../../measure.js";

export function chargeUC(E, R, C, time) { return E * (1 - Math.exp(-time / (R * C))); }
export function tau(R, C) { return R * C; }

export const id = "tene01";
export const level = "terminale";
export const domain = "energie";
export const theme = "circuit_rc";
export const titleKey = "tene01.title";

export function mount(container) {
  const state = { E: 5, R: 1000, C: 1e-3, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tene01-c">${t("tene01.input.C")}</label>
      <input id="tene01-c" type="range" min="1e-6" max="1e-2" step="1e-6" value="${state.C}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>1 µF</span><span id="tene01-c-val">${(state.C * 1e6).toFixed(0)} µF</span><span>10 mF</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tene01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tene01-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 220");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 5, ymin: 0, ymax: 6,
    xlabel: "t/τ", ylabel: "u_C (V)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tene01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tene01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tene01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tene01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(tt) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("line", { x1: "80", y1: "60", x2: "500", y2: "60", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "80", y1: "60", x2: "80", y2: "180", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "80", y1: "180", x2: "500", y2: "180", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "500", y1: "180", x2: "500", y2: "60", stroke: "#455A64", "stroke-width": "2" }));
    // générateur
    svg.appendChild(mk("circle", { cx: "80", cy: "120", r: "20", fill: "#FFF3E0", stroke: "#F57C00", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "80", y: "126", "text-anchor": "middle", fill: "#F57C00", "font-size": "14", "font-weight": "bold" }, "E"));
    // résistance
    svg.appendChild(mk("rect", { x: "200", y: "45", width: "80", height: "30", fill: "#fff", stroke: "#1565C0", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "240", y: "35", "text-anchor": "middle", fill: "#1565C0", "font-size": "12" }, "R = " + (state.R / 1000).toFixed(1) + " kΩ"));
    // condensateur
    svg.appendChild(mk("line", { x1: "400", y1: "120", x2: "400", y2: "140", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "420", y1: "120", x2: "420", y2: "140", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "400", y1: "120", x2: "420", y2: "120", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "400", y1: "140", x2: "420", y2: "140", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "410", y: "160", "text-anchor": "middle", fill: "#1565C0", "font-size": "12" }, "C = " + (state.C * 1e6).toFixed(0) + " µF"));
    svg.appendChild(mk("text", { x: "320", y: "200", "text-anchor": "middle", fill: "#1565C0", "font-size": "14", "font-weight": "bold" }, "τ = " + tt.toFixed(3) + " s"));
  }

  function runMeasurement() {
    state.C = parseFloat(document.getElementById("tene01-c").value);
    document.getElementById("tene01-c-val").textContent = (state.C * 1e6).toFixed(0) + " µF";
    const tt = tau(state.R, state.C);
    drawSchema(tt);
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const time = 5 * tt * i / 100;
      pts.push({ x: time / tt, y: chargeUC(state.E, state.R, state.C, time) });
    }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: 5, ymin: 0, ymax: state.E * 1.1 });
    const grid = document.getElementById("tene01-measures");
    grid.innerHTML = "";
    [
      { label: "R", value: (state.R / 1000).toFixed(1), unit: "kΩ" },
      { label: "C", value: (state.C * 1e6).toFixed(0), unit: "µF" },
      { label: "τ = RC", value: tt.toFixed(3), unit: "s" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tene01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Constante de temps</div>
      <div class="measure-value" style="font-size:26px">τ = ${tt.toFixed(3)} s</div>
    </div>`;
    const steps = document.getElementById("tene01-steps");
    steps.innerHTML = "";
    [
      { title: "Équation différentielle", body: `<span class="step-formula">E = R·C·du_C/dt + u_C</span>` },
      { title: "Solution", body: `<span class="step-formula">u_C(t) = E·(1 − e^(−t/τ))</span>` },
      { title: "Constante de temps", body: `<span class="step-formula">τ = R·C = ${state.R} × ${state.C.toExponential(2)} = ${tt.toFixed(3)} s</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tene01-c").addEventListener("input", (e) => {
    document.getElementById("tene01-c-val").textContent = (parseFloat(e.target.value) * 1e6).toFixed(0) + " µF";
  });
  document.getElementById("tene01-run").addEventListener("click", runMeasurement);
  document.getElementById("tene01-rand").addEventListener("click", () => {
    const c = Number((1e-5 + rng() * 1e-3).toExponential(2));
    document.getElementById("tene01-c").value = c;
    document.getElementById("tene01-c-val").textContent = (c * 1e6).toFixed(0) + " µF";
    runMeasurement();
  });
  document.getElementById("tene01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tene01-steps");
    const btn = document.getElementById("tene01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
