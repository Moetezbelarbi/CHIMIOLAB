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
  const state = { lambda: 600, b: 0.5, D: 1.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pond02-b">${t("pond02.input.b")}</label>
      <input id="pond02-b" type="range" min="0.1" max="2" step="0.01" value="${state.b}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,10 mm</span><span id="pond02-b-val">${state.b.toFixed(2)} mm</span><span>2,00 mm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pond02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pond02-rand">${t("ui.randomize")}</button>
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
  const graph = new Graph(canvas, { xmin: -0.01, xmax: 0.01, ymin: 0, ymax: 1.1,
    xlabel: "x (m)", ylabel: "I/I₀", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pond02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pond02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pond02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pond02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(i) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "20", y: "105", width: "60", height: "24", rx: "4", fill: "#37474F" }));
    svg.appendChild(mk("circle", { cx: "80", cy: "117", r: "5", fill: "#FF1744" }));
    svg.appendChild(mk("line", { x1: "85", y1: "117", x2: "200", y2: "117", stroke: "#FF1744", "stroke-width": "1.5" }));
    // double fente
    svg.appendChild(mk("rect", { x: "200", y: "40", width: "8", height: "160", fill: "#263238" }));
    svg.appendChild(mk("rect", { x: "200", y: "100", width: "8", height: "8", fill: "#FFFFFF" }));
    svg.appendChild(mk("rect", { x: "200", y: "126", width: "8", height: "8", fill: "#FFFFFF" }));
    svg.appendChild(mk("text", { x: "204", y: "220", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "fentes b = " + state.b.toFixed(2) + " mm"));
    // écran avec franges
    svg.appendChild(mk("rect", { x: "520", y: "20", width: "14", height: "200", fill: "#FAFAFA", stroke: "#455A64", "stroke-width": "2" }));
    for (let k = -3; k <= 3; k++) {
      const y = 117 + k * (i * 1000) * 0.3;
      if (y > 25 && y < 215) {
        svg.appendChild(mk("rect", { x: "521", y: String(y - 2), width: "12", height: "4", fill: "#FF1744", opacity: String(k === 0 ? 1 : 0.6) }));
      }
    }
    svg.appendChild(mk("text", { x: "527", y: "235", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "écran"));
    svg.appendChild(mk("line", { x1: "208", y1: "117", x2: "520", y2: "117", stroke: "#FF1744", "stroke-width": "1" }));
  }

  function runMeasurement() {
    state.b = parseFloat(document.getElementById("pond02-b").value);
    document.getElementById("pond02-b-val").textContent = state.b.toFixed(2) + " mm";
    const i = interfrange(state.lambda, state.b, state.D);
    const xmax = i * 6;
    const pts = [];
    for (let k = 0; k <= 300; k++) {
      const x = -xmax + 2 * xmax * k / 300;
      pts.push({ x, y: intensityYoung(x, state.lambda, state.b, state.D) });
    }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: -xmax, xmax, ymin: 0, ymax: 1.1 });
    drawSchema(i);
    const grid = document.getElementById("pond02-measures");
    grid.innerHTML = "";
    [
      { label: "λ", value: state.lambda.toFixed(0), unit: "nm" },
      { label: "Écart fentes", value: state.b.toFixed(2), unit: "mm" },
      { label: "Interfrange", value: (i * 1000).toFixed(2), unit: "mm" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pond02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Interfrange</div>
      <div class="measure-value" style="font-size:26px">${(i * 1000).toFixed(2)} mm</div>
    </div>`;
    const steps = document.getElementById("pond02-steps");
    steps.innerHTML = "";
    [
      { title: "Interférences de Young", body: `Deux fentes cohérentes produisent des franges alternées.` },
      { title: "Relation", body: `<span class="step-formula">i = λ · D / b</span>` },
      { title: "Données", body: `λ = ${state.lambda} nm · D = ${state.D.toFixed(1)} m · b = ${state.b.toFixed(2)} mm` },
      { title: "Calcul", body: `<span class="step-formula">i = ${state.lambda}e-9 × ${state.D.toFixed(1)} / ${state.b}e-3 = ${(i * 1000).toFixed(3)} mm</span>` }
    ].forEach((s, k) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${k + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pond02-b").addEventListener("input", (e) => {
    document.getElementById("pond02-b-val").textContent = parseFloat(e.target.value).toFixed(2) + " mm";
  });
  document.getElementById("pond02-run").addEventListener("click", runMeasurement);
  document.getElementById("pond02-rand").addEventListener("click", () => {
    const b = Number((0.1 + rng() * 1.5).toFixed(2));
    document.getElementById("pond02-b").value = b;
    document.getElementById("pond02-b-val").textContent = b.toFixed(2) + " mm";
    runMeasurement();
  });
  document.getElementById("pond02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pond02-steps");
    const btn = document.getElementById("pond02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
