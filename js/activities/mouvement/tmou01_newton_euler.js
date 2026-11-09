import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { makeRng } from "../../measure.js";

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
  const state = { m: 1.0, F: 2.0, v0: 0, dt: 0.01, tMax: 5, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tmou01-f">${t("tmou01.input.F")}</label>
      <input id="tmou01-f" type="range" min="0.5" max="20" step="0.1" value="${state.F}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,5 N</span><span id="tmou01-f-val">${state.F.toFixed(1)} N</span><span>20 N</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmou01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmou01-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 200");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 5, ymin: 0, ymax: 10,
    xlabel: "t (s)", ylabel: "v (m/s)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tmou01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmou01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmou01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmou01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(a) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("line", { x1: "40", y1: "150", x2: "600", y2: "150", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "320", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "rail horizontal · sans frottement"));
    svg.appendChild(mk("rect", { x: "260", y: "110", width: "80", height: "40", rx: "6", fill: "#90CAF9", stroke: "#1565C0", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "300", y: "135", "text-anchor": "middle", fill: "#1565C0", "font-size": "12", "font-weight": "bold" }, "m = " + state.m.toFixed(1) + " kg"));
    svg.appendChild(mk("line", { x1: "340", y1: "130", x2: "440", y2: "130", stroke: "#C62828", "stroke-width": "3" }));
    svg.appendChild(mk("polygon", { points: "440,124 455,130 440,136", fill: "#C62828" }));
    svg.appendChild(mk("text", { x: "400", y: "115", "text-anchor": "middle", fill: "#C62828", "font-size": "13", "font-weight": "bold" }, "F = " + state.F.toFixed(1) + " N"));
    svg.appendChild(mk("text", { x: "200", y: "80", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "a = " + a.toFixed(2) + " m/s²"));
  }

  function runMeasurement() {
    state.F = parseFloat(document.getElementById("tmou01-f").value);
    document.getElementById("tmou01-f-val").textContent = state.F.toFixed(1) + " N";
    const a = state.F / state.m;
    drawSchema(a);
    const tr = simulateConstantForce(state.m, state.F, state.v0, state.dt, state.tMax);
    const pts = tr.map(p => ({ x: p.t, y: p.v }));
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: state.tMax, ymin: Math.min(...pts.map(p => p.y), 0), ymax: Math.max(...pts.map(p => p.y), 1) * 1.2 });
    const grid = document.getElementById("tmou01-measures");
    grid.innerHTML = "";
    [
      { label: "Masse", value: state.m.toFixed(1), unit: "kg" },
      { label: "Force", value: state.F.toFixed(1), unit: "N" },
      { label: "Accélération", value: a.toFixed(2), unit: "m/s²" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmou01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Accélération</div>
      <div class="measure-value" style="font-size:26px">a = ${a.toFixed(2)} m/s²</div>
    </div>`;
    const steps = document.getElementById("tmou01-steps");
    steps.innerHTML = "";
    [
      { title: "Deuxième loi de Newton", body: `<span class="step-formula">ΣF = m · a</span>` },
      { title: "Projection", body: `Sur l'axe du mouvement : <span class="step-formula">F = m · a</span>` },
      { title: "Calcul", body: `<span class="step-formula">a = F/m = ${state.F.toFixed(1)} / ${state.m.toFixed(1)} = ${a.toFixed(2)} m/s²</span>` },
      { title: "Vitesse", body: `<span class="step-formula">v(t) = v₀ + a·t</span> → droite de pente a` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmou01-f").addEventListener("input", (e) => {
    document.getElementById("tmou01-f-val").textContent = parseFloat(e.target.value).toFixed(1) + " N";
  });
  document.getElementById("tmou01-run").addEventListener("click", runMeasurement);
  document.getElementById("tmou01-rand").addEventListener("click", () => {
    const f = Number((1 + rng() * 15).toFixed(1));
    document.getElementById("tmou01-f").value = f;
    document.getElementById("tmou01-f-val").textContent = f.toFixed(1) + " N";
    runMeasurement();
  });
  document.getElementById("tmou01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmou01-steps");
    const btn = document.getElementById("tmou01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
