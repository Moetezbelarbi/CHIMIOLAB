import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

const ESPECES = {
  kmno4: { label: "KMnO₄", epsL: 2300, lambdaMax: 525, width: 40, color: "#7B1FA2" },
  cuso4: { label: "CuSO₄", epsL: 12.5, lambdaMax: 800, width: 80, color: "#1976D2" },
  betadine: { label: "Bétadine", epsL: 900, lambdaMax: 460, width: 70, color: "#8D6E63" }
};

export function absorbanceAtMax(especeKey, CmolL) {
  const e = ESPECES[especeKey];
  return e ? e.epsL * CmolL : 0;
}
export function absorbance(lambdaNm, especeKey, CmolL) {
  const e = ESPECES[especeKey];
  if (!e) return 0;
  const g = Math.exp(-Math.pow(lambdaNm - e.lambdaMax, 2) / (2 * Math.pow(e.width, 2)));
  return e.epsL * CmolL * g;
}

export const id = "pmat01";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat01.title";

export function mount(container) {
  const state = { espece: "kmno4", stockC: 1.0e-3, seed: Date.now() & 0xffffff, showSteps: false };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field"><label for="pmat01-esp">${t("pmat01.input.species")}</label>
      <select id="pmat01-esp">
        <option value="kmno4">KMnO₄</option>
        <option value="cuso4">CuSO₄</option>
        <option value="betadine">${t("pmat01.species.betadine")}</option>
      </select></div>
    <div class="actions">
      <button class="btn" id="pmat01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat01-rand">${t("ui.randomize")}</button>
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
  const graph = new Graph(canvas, { xmin: 400, xmax: 900, ymin: 0, ymax: 2.5,
    xlabel: "λ (nm)", ylabel: "A", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(A, lambda) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "20", y: "100", width: "60", height: "60", rx: "6", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("circle", { cx: "50", cy: "130", r: "12", fill: "#FFEB3B", stroke: "#F57F17", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "50", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "source"));
    svg.appendChild(mk("rect", { x: "100", y: "110", width: "50", height: "40", rx: "4", fill: "#B0BEC5", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "125", y: "175", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "monochromateur"));
    svg.appendChild(mk("line", { x1: "80", y1: "130", x2: "100", y2: "130", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "150", y1: "130", x2: "200", y2: "130", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "200", y: "90", width: "40", height: "80", rx: "4", fill: ESPECES[state.espece].color, opacity: "0.6", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "220", y: "190", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "cuve ℓ = 1 cm"));
    svg.appendChild(mk("line", { x1: "240", y1: "130", x2: "280", y2: "130", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "280", y: "100", width: "40", height: "60", rx: "4", fill: "#546E7A", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "300", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "détecteur"));
    svg.appendChild(mk("rect", { x: "360", y: "80", width: "160", height: "100", rx: "8", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "440", y: "120", "text-anchor": "middle", fill: "#00E676", "font-size": "20", "font-family": "monospace", "font-weight": "bold" }, "A = " + A.toFixed(3)));
    svg.appendChild(mk("text", { x: "440", y: "150", "text-anchor": "middle", fill: "#B0BEC5", "font-size": "13" }, "λ = " + lambda + " nm"));
    svg.appendChild(mk("text", { x: "440", y: "170", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "spectrophotomètre"));
    svg.appendChild(mk("rect", { x: "540", y: "40", width: "14", height: "160", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "538", y1: "80", x2: "556", y2: "80", stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "547", y: "220", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "pipette jaugée"));
    svg.appendChild(mk("path", { d: "M580 60 L610 90 L610 200 L550 200 L550 90 Z", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "548", y1: "110", x2: "612", y2: "110", stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "580", y: "220", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "fiole jaugée"));
  }

  function runMeasurement() {
    state.espece = document.getElementById("pmat01-esp").value;
    const e = ESPECES[state.espece];
    const C = state.stockC;
    const A = roundToResolution(addNoise(absorbanceAtMax(state.espece, C), 0.002, rng, 1), 0.001);
    const lambda = e.lambdaMax;
    drawSchema(A, lambda);
    // spectre
    const pts = [];
    for (let l = 400; l <= 900; l += 5) {
      pts.push({ x: l, y: Math.max(0, absorbance(l, state.espece, C) + (rng() - 0.5) * 0.01) });
    }
    graph.setSeries([{ points: pts, color: e.color, width: 2 }]);
    graph.setBounds({ xmin: 400, xmax: 900, ymin: 0, ymax: Math.max(2.5, A * 1.3) });
    const grid = document.getElementById("pmat01-measures");
    grid.innerHTML = "";
    [
      { label: "λ max", value: lambda.toFixed(0), unit: "nm" },
      { label: "Absorbance", value: A.toFixed(3), unit: "" },
      { label: "Concentration", value: C.toExponential(2), unit: "mol/L" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    // résultat
    const result = document.getElementById("pmat01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Concentration calculée</div>
      <div class="measure-value" style="font-size:26px">${formatSigFigs(A / e.epsL, 3)} mol/L</div>
    </div>`;
    const steps = document.getElementById("pmat01-steps");
    steps.innerHTML = "";
    [
      { title: "Loi de Beer-Lambert", body: `<span class="step-formula">A = ε · ℓ · C</span>` },
      { title: "Données", body: `ε·ℓ = ${e.epsL} L·mol⁻¹ · A mesurée = ${A.toFixed(3)}` },
      { title: "Calcul", body: `<span class="step-formula">C = A / (ε·ℓ) = ${A.toFixed(3)} / ${e.epsL} = ${formatSigFigs(A / e.epsL, 3)} mol/L</span>` },
      { title: "Vérification", body: `A = ${A.toFixed(3)} < 1,5 : le domaine de linéarité est respecté.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmat01-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat01-rand").addEventListener("click", () => {
    const keys = Object.keys(ESPECES);
    const k = keys[Math.floor(rng() * keys.length)];
    document.getElementById("pmat01-esp").value = k;
    state.stockC = Number((1e-4 + rng() * 8e-4).toExponential(2));
    runMeasurement();
  });
  document.getElementById("pmat01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat01-steps");
    const btn = document.getElementById("pmat01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
