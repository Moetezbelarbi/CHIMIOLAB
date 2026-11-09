import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

export function widthCentral(lambdaNm, aUm, Dm) {
  return 2 * lambdaNm * 1e-9 * Dm / (aUm * 1e-6);
}
export function sinc(x) { if (Math.abs(x) < 1e-12) return 1; return Math.sin(x) / x; }
export function intensity(xM, lambdaNm, aUm, Dm) {
  const arg = Math.PI * aUm * 1e-6 * xM / (lambdaNm * 1e-9 * Dm);
  return Math.pow(sinc(arg), 2);
}

export const id = "pond01";
export const level = "premiere";
export const domain = "ondes";
export const theme = "ondes";
export const titleKey = "pond01.title";

export function mount(container) {
  const state = { lambda: 650, a: 50, D: 2.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pond01-a">${t("pond01.input.a")}</label>
      <input id="pond01-a" type="range" min="10" max="200" step="1" value="${state.a}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>10 µm</span><span id="pond01-a-val">${state.a} µm</span><span>200 µm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pond01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pond01-rand">${t("ui.randomize")}</button>
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
  const graph = new Graph(canvas, { xmin: -0.1, xmax: 0.1, ymin: 0, ymax: 1.1,
    xlabel: "x (m)", ylabel: "I/I₀", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pond01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pond01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pond01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pond01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(L) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "20", y: "105", width: "70", height: "24", rx: "4", fill: "#37474F" }));
    svg.appendChild(mk("circle", { cx: "90", cy: "117", r: "5", fill: "#FF1744" }));
    svg.appendChild(mk("line", { x1: "95", y1: "117", x2: "220", y2: "117", stroke: "#FF1744", "stroke-width": "1.5" }));
    svg.appendChild(mk("rect", { x: "220", y: "40", width: "8", height: "160", fill: "#263238" }));
    svg.appendChild(mk("rect", { x: "220", y: "111", width: "8", height: "12", fill: "#FFFFFF" }));
    svg.appendChild(mk("text", { x: "224", y: "220", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "fente " + state.a + " µm"));
    svg.appendChild(mk("line", { x1: "228", y1: "117", x2: "520", y2: "117", stroke: "#FF1744", "stroke-width": "1" }));
    svg.appendChild(mk("rect", { x: "520", y: "20", width: "14", height: "200", fill: "#FAFAFA", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("ellipse", { cx: "527", cy: "117", rx: "4", ry: String(Math.min(80, L * 20)), fill: "#FF1744", opacity: "0.85" }));
    svg.appendChild(mk("text", { x: "527", y: "235", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "écran"));
  }

  function runMeasurement() {
    state.a = parseFloat(document.getElementById("pond01-a").value);
    document.getElementById("pond01-a-val").textContent = state.a + " µm";
    const L = widthCentral(state.lambda, state.a, state.D);
    const xmax = L * 3;
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const x = -xmax + 2 * xmax * i / 300;
      pts.push({ x, y: intensity(x, state.lambda, state.a, state.D) });
    }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: -xmax, xmax, ymin: 0, ymax: 1.1 });
    drawSchema(L);
    const grid = document.getElementById("pond01-measures");
    grid.innerHTML = "";
    [
      { label: "λ", value: state.lambda.toFixed(0), unit: "nm" },
      { label: "Largeur fente", value: state.a.toFixed(0), unit: "µm" },
      { label: "Tache centrale", value: (L * 1000).toFixed(1), unit: "mm" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pond01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Largeur de la tache centrale</div>
      <div class="measure-value" style="font-size:26px">${(L * 1000).toFixed(1)} mm</div>
    </div>`;
    const steps = document.getElementById("pond01-steps");
    steps.innerHTML = "";
    [
      { title: "Diffraction par une fente", body: `La lumière diffractée forme une tache centrale de largeur L.` },
      { title: "Relation", body: `<span class="step-formula">L = 2 · λ · D / a</span>` },
      { title: "Données", body: `λ = ${state.lambda} nm · D = ${state.D.toFixed(1)} m · a = ${state.a} µm` },
      { title: "Calcul", body: `<span class="step-formula">L = 2 × ${state.lambda}e-9 × ${state.D.toFixed(1)} / ${state.a}e-6 = ${(L * 1000).toFixed(2)} mm</span>` },
      { title: "Interprétation", body: `Plus la fente est étroite, plus la tache est large.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pond01-a").addEventListener("input", (e) => {
    document.getElementById("pond01-a-val").textContent = e.target.value + " µm";
  });
  document.getElementById("pond01-run").addEventListener("click", runMeasurement);
  document.getElementById("pond01-rand").addEventListener("click", () => {
    const a = Number((20 + rng() * 100).toFixed(0));
    document.getElementById("pond01-a").value = a;
    document.getElementById("pond01-a-val").textContent = a + " µm";
    runMeasurement();
  });
  document.getElementById("pond01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pond01-steps");
    const btn = document.getElementById("pond01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
