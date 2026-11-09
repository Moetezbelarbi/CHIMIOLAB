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
  const f = (y, v) => { if (y >= h0) return { dy: 0, dv: 0 }; return { dy: -v, dv: g - k * v * Math.abs(v) }; };
  while (t < tMax && y < h0) {
    const s1 = f(y, v);
    const s2 = f(y + dt / 2 * s1.dy, v + dt / 2 * s1.dv);
    const s3 = f(y + dt / 2 * s2.dy, v + dt / 2 * s2.dv);
    const s4 = f(y + dt * s3.dy, v + dt * s3.dv);
    y += dt / 6 * (s1.dy + 2 * s2.dy + 2 * s3.dy + s4.dy);
    v += dt / 6 * (s1.dv + 2 * s2.dv + 2 * s3.dv + s4.dv);
    t += dt;
    trace.push({ t, y, v });
  }
  return { trace, tFall: t, vFall: v };
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
  const state = { h0: 1.5, m: 0.010, r: 0.020 };

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmou04-h">${t("pmou04.input.h")}</label>
      <input id="pmou04-h" type="range" min="0.5" max="5" step="0.1" value="${state.h0}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,5 m</span><span id="pmou04-h-val">${state.h0.toFixed(1)} m</span><span>5,0 m</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmou04-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmou04-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 320");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 1, ymin: 0, ymax: 20,
    xlabel: "t (s)", ylabel: "v (m/s)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmou04-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmou04-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmou04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmou04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(h, v) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("line", { x1: "80", y1: "30", x2: "80", y2: "280", stroke: "#455A64", "stroke-width": "2" }));
    for (let i = 0; i <= 5; i++) {
      svg.appendChild(mk("line", { x1: "80", y1: 30 + i * 50, x2: "100", y2: 30 + i * 50, stroke: "#455A64", "stroke-width": "1" }));
    }
    svg.appendChild(mk("text", { x: "40", y: "40", fill: "#455A64", "font-size": "11" }, h.toFixed(1) + " m"));
    svg.appendChild(mk("circle", { cx: "80", cy: "280", r: "8", fill: "#455A64" }));
    svg.appendChild(mk("text", { x: "80", y: "305", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "sol"));
    // chronophotographie
    const sim = simulateFall({ h0: h, m: state.m, r: state.r });
    const chrono = [];
    const dt = 0.05;
    for (let i = 0; i < sim.trace.length; i += Math.floor(dt / 0.001)) {
      chrono.push(sim.trace[i]);
    }
    chrono.forEach((p, i) => {
      const y = 30 + (p.y / h) * 250;
      svg.appendChild(mk("circle", { cx: "180", cy: y, r: "6", fill: "#1565C0", opacity: String(0.3 + 0.7 * i / chrono.length) }));
    });
    svg.appendChild(mk("text", { x: "180", y: "305", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "chronophotographie"));
    // vitesses
    svg.appendChild(mk("rect", { x: "380", y: "80", width: "220", height: "140", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "490", y: "120", "text-anchor": "middle", fill: "#1565C0", "font-size": "16", "font-weight": "bold" }, "v(t)"));
    svg.appendChild(mk("text", { x: "490", y: "150", "text-anchor": "middle", fill: "#263238", "font-size": "14", "font-family": "monospace" }, "v = " + v.toFixed(2) + " m/s"));
    svg.appendChild(mk("text", { x: "490", y: "180", "text-anchor": "middle", fill: "#263238", "font-size": "14", "font-family": "monospace" }, "t = " + sim.tFall.toFixed(3) + " s"));
  }

  function runMeasurement() {
    state.h0 = parseFloat(document.getElementById("pmou04-h").value);
    document.getElementById("pmou04-h-val").textContent = state.h0.toFixed(1) + " m";
    const sim = simulateFall({ h0: state.h0, m: state.m, r: state.r });
    const pts = sim.trace.filter((_, i) => i % 10 === 0).map(p => ({ x: p.t, y: p.v }));
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: Math.max(0.1, sim.tFall * 1.1), ymin: 0, ymax: Math.max(...pts.map(p => p.y), 0.1) * 1.2 });
    drawSchema(state.h0, sim.vFall);
    const vlim = terminalVelocity(state.m, state.r);
    const grid = document.getElementById("pmou04-measures");
    grid.innerHTML = "";
    [
      { label: "Temps de chute", value: sim.tFall.toFixed(3), unit: "s" },
      { label: "Vitesse finale", value: sim.vFall.toFixed(2), unit: "m/s" },
      { label: "Vitesse limite", value: vlim.toFixed(2), unit: "m/s" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmou04-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Vitesse finale</div>
      <div class="measure-value" style="font-size:26px">${sim.vFall.toFixed(2)} m/s</div>
    </div>`;
    const steps = document.getElementById("pmou04-steps");
    steps.innerHTML = "";
    [
      { title: "Deuxième loi de Newton", body: `<span class="step-formula">m · dv/dt = m·g − ½·ρ·Cx·S·v²</span>` },
      { title: "Vitesse limite", body: `<span class="step-formula">v_lim = √(2mg / (ρ·Cx·S)) = ${vlim.toFixed(2)} m/s</span>` },
      { title: "Intégration numérique", body: `Méthode RK4 · dt = 1 ms · ${sim.trace.length} pas de calcul` },
      { title: "Résultat", body: `Chute de ${state.h0.toFixed(1)} m en ${sim.tFall.toFixed(3)} s, vitesse finale ${sim.vFall.toFixed(2)} m/s.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmou04-h").addEventListener("input", (e) => {
    document.getElementById("pmou04-h-val").textContent = parseFloat(e.target.value).toFixed(1) + " m";
  });
  document.getElementById("pmou04-run").addEventListener("click", runMeasurement);
  document.getElementById("pmou04-rand").addEventListener("click", () => {
    const h = Number((0.5 + Math.random() * 4.5).toFixed(1));
    document.getElementById("pmou04-h").value = h;
    document.getElementById("pmou04-h-val").textContent = h.toFixed(1) + " m";
    runMeasurement();
  });
  document.getElementById("pmou04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmou04-steps");
    const btn = document.getElementById("pmou04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
