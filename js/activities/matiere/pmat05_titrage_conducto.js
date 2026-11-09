import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

const LAMBDA = { "H+": 0.03496, "OH-": 0.0198, "Na+": 0.00501, "Cl-": 0.00763 };

export function sigmaExact(Ca, Va, Cb, Vb) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 0;
  const nH = Math.max(0, Ca * Va - Cb * Vb) * 1e-3;
  const nOH = Math.max(0, Cb * Vb - Ca * Va) * 1e-3;
  const nNa = Cb * Vb * 1e-3;
  const nCl = Ca * Va * 1e-3;
  const Vm3 = Vtot * 1e-6;
  return LAMBDA["H+"] * (nH / Vm3) + LAMBDA["OH-"] * (nOH / Vm3) + LAMBDA["Na+"] * (nNa / Vm3) + LAMBDA["Cl-"] * (nCl / Vm3);
}
export function findEquivalence(Ca, Va, Cb) { return Ca * Va / Cb; }

export const id = "pmat05";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat05.title";

export function mount(container) {
  const state = { Ca: 0.10, Va: 10.0, Cb: 0.10, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmat05-ca">${t("pmat05.input.cacid")}</label>
      <input id="pmat05-ca" type="range" min="0.020" max="0.200" step="0.001" value="${state.Ca}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,020</span><span id="pmat05-ca-val">${state.Ca.toFixed(3)} mol/L</span><span>0,200</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmat05-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat05-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 300");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 50,
    xlabel: "V (mL)", ylabel: "σ (mS/cm)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat05-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat05-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat05-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat05-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(V, sigma) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "8", height: "260", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "120", height: "8", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "150", y: "30", width: "26", height: "190", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    const fill = Math.max(0, 190 * (1 - V / 25));
    svg.appendChild(mk("rect", { x: "152", y: "32", width: "22", height: fill, fill: "#90CAF9", opacity: "0.6" }));
    svg.appendChild(mk("rect", { x: "157", y: "220", width: "12", height: "12", fill: "#546E7A" }));
    svg.appendChild(mk("rect", { x: "120", y: "250", width: "90", height: "50", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "122", y: "270", width: "86", height: "28", fill: "#90CAF9", opacity: "0.6" }));
    svg.appendChild(mk("rect", { x: "145", y: "255", width: "8", height: "40", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("rect", { x: "175", y: "255", width: "8", height: "40", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("rect", { x: "100", y: "300", width: "130", height: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1" }));
    svg.appendChild(mk("rect", { x: "400", y: "60", width: "180", height: "100", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "412", y: "72", width: "156", height: "60", rx: "4", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "490", y: "110", "text-anchor": "middle", fill: "#00E676", "font-size": "20", "font-family": "monospace", "font-weight": "bold" }, sigma.toFixed(2) + " mS/cm"));
    svg.appendChild(mk("text", { x: "490", y: "145", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "conductimètre"));
    svg.appendChild(mk("line", { x1: "400", y1: "110", x2: "190", y2: "270", stroke: "#455A64", "stroke-width": "3" }));
  }

  function runMeasurement() {
    state.Ca = parseFloat(document.getElementById("pmat05-ca").value);
    document.getElementById("pmat05-ca-val").textContent = state.Ca.toFixed(3) + " mol/L";
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const Vmax = VE * 1.8;
    const pts = [];
    for (let i = 0; i <= 50; i++) {
      const V = Vmax * i / 50;
      const s = sigmaExact(state.Ca, state.Va, state.Cb, V) * 10;
      pts.push({ x: V, y: roundToResolution(addNoise(s, 0.05, rng, 1), 0.01) });
    }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 },
      { points: [{ x: VE, y: 0 }, { x: VE, y: 60 }], color: "#F57C00", width: 1, dash: [4, 4] }]);
    graph.setBounds({ xmin: 0, xmax: Vmax, ymin: 0, ymax: Math.max(60, ...pts.map(p => p.y)) });
    drawSchema(VE, pts[Math.floor(pts.length / 2)].y);
    const sigma0 = sigmaExact(state.Ca, state.Va, state.Cb, 0) * 10;
    const sigmaE = sigmaExact(state.Ca, state.Va, state.Cb, VE) * 10;
    const grid = document.getElementById("pmat05-measures");
    grid.innerHTML = "";
    [
      { label: "σ(0)", value: sigma0.toFixed(2), unit: "mS/cm" },
      { label: "σ(V_E)", value: sigmaE.toFixed(2), unit: "mS/cm" },
      { label: "V_E", value: VE.toFixed(2), unit: "mL" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmat05-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Volume équivalent</div>
      <div class="measure-value" style="font-size:28px">${VE.toFixed(2)} mL</div>
    </div>`;
    const steps = document.getElementById("pmat05-steps");
    steps.innerHTML = "";
    [
      { title: "Loi de Kohlrausch", body: `<span class="step-formula">σ = Σ λᵢ · Cᵢ</span>` },
      { title: "Avant l'équivalence", body: `H⁺ (λ = 0,03496) est consommé, Na⁺ (λ = 0,00501) ajouté : σ diminue.` },
      { title: "Après l'équivalence", body: `OH⁻ (λ = 0,0198) est ajouté : σ augmente. Le minimum marque V_E.` },
      { title: "Calcul", body: `<span class="step-formula">V_E = (C_a · V_a) / C_b = (${state.Ca.toFixed(3)} × ${state.Va.toFixed(2)}) / ${state.Cb.toFixed(3)} = ${VE.toFixed(2)} mL</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmat05-ca").addEventListener("input", (e) => {
    document.getElementById("pmat05-ca-val").textContent = parseFloat(e.target.value).toFixed(3) + " mol/L";
  });
  document.getElementById("pmat05-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat05-rand").addEventListener("click", () => {
    const v = Number((0.020 + rng() * 0.180).toFixed(3));
    document.getElementById("pmat05-ca").value = v;
    document.getElementById("pmat05-ca-val").textContent = v.toFixed(3) + " mol/L";
    runMeasurement();
  });
  document.getElementById("pmat05-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat05-steps");
    const btn = document.getElementById("pmat05-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
