import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

const LAMBDA = { "K+": 0.00735, "Cl-": 0.00763, "Na+": 0.00501 };
export function sigmaKCl(CmolL, thetaC) {
  const sigma25 = (LAMBDA["K+"] + LAMBDA["Cl-"]) * CmolL * 1000;
  return sigma25 * (1 + 0.02 * (thetaC - 25));
}

export const id = "pmat02";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat02.title";

export function mount(container) {
  const state = { theta: 25, etalonC: 0.0100, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmat02-theta">${t("pmat02.input.theta")}</label>
      <input id="pmat02-theta" type="range" min="15" max="35" step="0.5" value="${state.theta}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>15 °C</span><span id="pmat02-theta-val">${state.theta} °C</span><span>35 °C</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmat02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat02-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 260");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 0.012, ymin: 0, ymax: 0.2,
    xlabel: "C (mol/L)", ylabel: "σ (S/m)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(sigma, theta) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // bécher
    svg.appendChild(mk("rect", { x: "80", y: "100", width: "130", height: "110", rx: "8", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "82", y: "140", width: "126", height: "68", fill: "#90CAF9", opacity: "0.5" }));
    for (let i = 1; i < 5; i++) {
      svg.appendChild(mk("line", { x1: "80", y1: 100 + i * 22, x2: "94", y2: 100 + i * 22, stroke: "#455A64", "stroke-width": "0.8" }));
    }
    svg.appendChild(mk("text", { x: "145", y: "230", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "bécher + KCl"));
    // cellule conductimétrique
    svg.appendChild(mk("rect", { x: "115", y: "105", width: "10", height: "70", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("rect", { x: "155", y: "105", width: "10", height: "70", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("text", { x: "145", y: "95", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "cellule"));
    // agitateur
    svg.appendChild(mk("rect", { x: "60", y: "215", width: "170", height: "14", rx: "3", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1.5" }));
    svg.appendChild(mk("rect", { x: "125", y: "200", width: "40", height: "8", rx: "2", fill: "#37474F" }));
    // thermomètre
    svg.appendChild(mk("rect", { x: "210", y: "60", width: "8", height: "130", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "1.5" }));
    svg.appendChild(mk("circle", { cx: "214", cy: "190", r: "8", fill: "#E53935" }));
    svg.appendChild(mk("text", { x: "240", y: "80", fill: "#455A64", "font-size": "11" }, theta + " °C"));
    // conductimètre
    svg.appendChild(mk("rect", { x: "400", y: "70", width: "180", height: "100", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "412", y: "82", width: "156", height: "60", rx: "4", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "490", y: "120", "text-anchor": "middle", fill: "#00E676", "font-size": "20", "font-family": "monospace", "font-weight": "bold" }, sigma.toFixed(4) + " S/m"));
    svg.appendChild(mk("text", { x: "490", y: "155", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "conductimètre"));
    svg.appendChild(mk("line", { x1: "400", y1: "120", x2: "180", y2: "140", stroke: "#455A64", "stroke-width": "3" }));
  }

  function runMeasurement() {
    state.theta = parseFloat(document.getElementById("pmat02-theta").value);
    document.getElementById("pmat02-theta-val").textContent = state.theta + " °C";
    const sigma = roundToResolution(addNoise(sigmaKCl(state.etalonC, state.theta), 0.0005, rng, 1), 0.0001);
    drawSchema(sigma, state.theta);
    const kTheo = sigmaKCl(state.etalonC, state.theta) / sigma;
    // graphe étalonnage : plusieurs concentrations
    const pts = [];
    [0.002, 0.004, 0.006, 0.008, 0.010].forEach(C => {
      pts.push({ x: C, y: sigmaKCl(C, state.theta) });
    });
    graph.setSeries([{ points: pts, color: "#C62828", width: 0 }]);
    graph.setBounds({ xmin: 0, xmax: 0.012, ymin: 0, ymax: 0.2 });
    const grid = document.getElementById("pmat02-measures");
    grid.innerHTML = "";
    [
      { label: "σ mesurée", value: sigma.toFixed(4), unit: "S/m" },
      { label: "Température", value: state.theta.toFixed(1), unit: "°C" },
      { label: "k cellule", value: kTheo.toFixed(3), unit: "m⁻¹" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmat02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Constante de cellule</div>
      <div class="measure-value" style="font-size:26px">${kTheo.toFixed(3)} m⁻¹</div>
    </div>`;
    const steps = document.getElementById("pmat02-steps");
    steps.innerHTML = "";
    [
      { title: "Loi de Kohlrausch", body: `<span class="step-formula">σ = Σ λᵢ · Cᵢ</span>` },
      { title: "Étalon KCl", body: `C = 0,0100 mol/L · λ(K⁺) = 0,00735 · λ(Cl⁻) = 0,00763 S·m²·mol⁻¹` },
      { title: "Correction température", body: `<span class="step-formula">σ(θ) = σ(25°C) × (1 + 0,02·(θ−25))</span> → ${sigma.toFixed(4)} S/m à ${state.theta} °C` },
      { title: "Constante de cellule", body: `<span class="step-formula">k = σ_théorique / σ_mesurée = ${sigmaKCl(state.etalonC, state.theta).toFixed(4)} / ${sigma.toFixed(4)} = ${kTheo.toFixed(3)} m⁻¹</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmat02-theta").addEventListener("input", (e) => {
    document.getElementById("pmat02-theta-val").textContent = e.target.value + " °C";
  });
  document.getElementById("pmat02-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat02-rand").addEventListener("click", () => {
    const t = Number((18 + rng() * 14).toFixed(1));
    document.getElementById("pmat02-theta").value = t;
    document.getElementById("pmat02-theta-val").textContent = t + " °C";
    runMeasurement();
  });
  document.getElementById("pmat02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat02-steps");
    const btn = document.getElementById("pmat02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
