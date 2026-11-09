import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { makeRng, addNoise, roundToResolution } from "../../measure.js";

export function A_of_t(A0, k, time) { return A0 * Math.exp(-k * time); }
export function halfLife(k) { return Math.LN2 / k; }

export const id = "tmat04";
export const level = "terminale";
export const domain = "matiere";
export const theme = "cinetique";
export const titleKey = "tmat04.title";

export function mount(container) {
  const state = { A0: 1.0, k: 0.05, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tmat04-k">${t("tmat04.input.k")}</label>
      <input id="tmat04-k" type="range" min="0.005" max="0.200" step="0.001" value="${state.k}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,005</span><span id="tmat04-k-val">${state.k.toFixed(3)} s⁻¹</span><span>0,200</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmat04-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmat04-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 240");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 60, ymin: 0, ymax: 1.1,
    xlabel: "t (s)", ylabel: "A", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tmat04-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmat04-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmat04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmat04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(th) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "40", y: "90", width: "60", height: "60", rx: "6", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("circle", { cx: "70", cy: "120", r: "12", fill: "#FFEB3B", stroke: "#F57F17", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "70", y: "170", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "source"));
    svg.appendChild(mk("rect", { x: "120", y: "100", width: "50", height: "40", rx: "4", fill: "#B0BEC5", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "100", y1: "120", x2: "120", y2: "120", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "200", y: "80", width: "40", height: "80", rx: "4", fill: "#CE93D8", opacity: "0.6", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "220", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "cuve"));
    svg.appendChild(mk("line", { x1: "240", y1: "120", x2: "270", y2: "120", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "270", y: "90", width: "40", height: "60", rx: "4", fill: "#546E7A", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "290", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "détecteur"));
    svg.appendChild(mk("rect", { x: "340", y: "70", width: "260", height: "100", rx: "8", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "470", y: "110", "text-anchor": "middle", fill: "#00E676", "font-size": "18", "font-family": "monospace", "font-weight": "bold" }, "t½ = " + th.toFixed(2) + " s"));
    svg.appendChild(mk("text", { x: "470", y: "140", "text-anchor": "middle", fill: "#B0BEC5", "font-size": "12" }, "suivi spectrophotométrique"));
  }

  function runMeasurement() {
    state.k = parseFloat(document.getElementById("tmat04-k").value);
    document.getElementById("tmat04-k-val").textContent = state.k.toFixed(3) + " s⁻¹";
    const th = halfLife(state.k);
    drawSchema(th);
    // mesures
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const time = i * 3;
      const A = roundToResolution(addNoise(A_of_t(state.A0, state.k, time), 0.005, rng, 1), 0.001);
      pts.push({ x: time, y: Math.max(0, A) });
    }
    graph.setSeries([{ points: pts, color: "#C62828", width: 0 }]);
    graph.setBounds({ xmin: 0, xmax: 60, ymin: 0, ymax: 1.1 });
    const grid = document.getElementById("tmat04-measures");
    grid.innerHTML = "";
    [
      { label: "k", value: state.k.toFixed(3), unit: "s⁻¹" },
      { label: "t½", value: th.toFixed(2), unit: "s" },
      { label: "A(0)", value: state.A0.toFixed(2), unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmat04-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Temps de demi-réaction</div>
      <div class="measure-value" style="font-size:26px">${th.toFixed(2)} s</div>
    </div>`;
    const steps = document.getElementById("tmat04-steps");
    steps.innerHTML = "";
    [
      { title: "Loi cinétique d'ordre 1", body: `<span class="step-formula">A(t) = A₀ · e^(−k·t)</span>` },
      { title: "Temps de demi-réaction", body: `<span class="step-formula">t½ = ln 2 / k</span>` },
      { title: "Calcul", body: `<span class="step-formula">t½ = ln 2 / ${state.k.toFixed(3)} = ${th.toFixed(2)} s</span>` },
      { title: "Interprétation", body: `Au bout de ${th.toFixed(1)} s, l'absorbance est divisée par 2.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmat04-k").addEventListener("input", (e) => {
    document.getElementById("tmat04-k-val").textContent = parseFloat(e.target.value).toFixed(3) + " s⁻¹";
  });
  document.getElementById("tmat04-run").addEventListener("click", runMeasurement);
  document.getElementById("tmat04-rand").addEventListener("click", () => {
    const k = Number((0.01 + rng() * 0.15).toFixed(3));
    document.getElementById("tmat04-k").value = k;
    document.getElementById("tmat04-k-val").textContent = k.toFixed(3) + " s⁻¹";
    runMeasurement();
  });
  document.getElementById("tmat04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmat04-steps");
    const btn = document.getElementById("tmat04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
