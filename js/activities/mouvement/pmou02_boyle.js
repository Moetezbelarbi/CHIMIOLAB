import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

export const P_ATM = 101325;
export function pressureBoyle(VmL, V0mL, P0Pa) { return P0Pa * V0mL / (VmL + V0mL); }

export const id = "pmou02";
export const level = "premiere";
export const domain = "mouvement";
export const theme = "fluide_repos";
export const titleKey = "pmou02.title";

export function mount(container) {
  const state = { V0: 2.0, Vinit: 20.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmou02-vinit">${t("pmou02.input.vinit")}</label>
      <input id="pmou02-vinit" type="range" min="10" max="60" step="1" value="${state.Vinit}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>10 mL</span><span id="pmou02-vinit-val">${state.Vinit} mL</span><span>60 mL</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmou02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmou02-rand">${t("ui.randomize")}</button>
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
  const graph = new Graph(canvas, { xmin: 0, xmax: 25, ymin: 0, ymax: 200000,
    xlabel: "V (mL)", ylabel: "P (Pa)", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmou02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmou02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmou02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmou02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(Vinit, P) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // seringue
    svg.appendChild(mk("rect", { x: "60", y: "100", width: "200", height: "60", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "60", y: "100", width: Math.max(20, 200 * Vinit / 60), height: "60", fill: "#90CAF9", opacity: "0.5" }));
    svg.appendChild(mk("rect", { x: "260", y: "115", width: "60", height: "30", fill: "#90A4AE" }));
    svg.appendChild(mk("rect", { x: "320", y: "100", width: "12", height: "60", fill: "#455A64" }));
    // capteur
    svg.appendChild(mk("rect", { x: "380", y: "90", width: "140", height: "80", rx: "6", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "450", y: "125", "text-anchor": "middle", fill: "#00E676", "font-size": "18", "font-family": "monospace", "font-weight": "bold" }, (P / 100).toFixed(1) + " hPa"));
    svg.appendChild(mk("text", { x: "450", y: "150", "text-anchor": "middle", fill: "#B0BEC5", "font-size": "11" }, "capteur de pression"));
    svg.appendChild(mk("text", { x: "160", y: "190", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "seringue graduée"));
  }

  function runMeasurement() {
    state.Vinit = parseFloat(document.getElementById("pmou02-vinit").value);
    document.getElementById("pmou02-vinit-val").textContent = state.Vinit + " mL";
    const P = pressureBoyle(state.Vinit, state.V0, P_ATM);
    drawSchema(state.Vinit, P);
    const pts = [];
    for (let V = 1; V <= state.Vinit; V += 1) {
      pts.push({ x: V, y: roundToResolution(addNoise(pressureBoyle(V, state.V0, P_ATM), 10, rng, 1), 10) });
    }
    graph.setSeries([{ points: pts, color: "#C62828", width: 0 }]);
    graph.setBounds({ xmin: 0, xmax: state.Vinit * 1.1, ymin: 0, ymax: Math.max(...pts.map(p => p.y)) * 1.2 });
    const k = P_ATM * state.V0;
    const grid = document.getElementById("pmou02-measures");
    grid.innerHTML = "";
    [
      { label: "P mesurée", value: P.toFixed(0), unit: "Pa" },
      { label: "V seringue", value: state.Vinit.toFixed(0), unit: "mL" },
      { label: "k = P·V", value: k.toFixed(0), unit: "Pa·mL" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmou02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Constante de Boyle</div>
      <div class="measure-value" style="font-size:26px">${k.toFixed(0)} Pa·mL</div>
    </div>`;
    const steps = document.getElementById("pmou02-steps");
    steps.innerHTML = "";
    [
      { title: "Loi de Boyle-Mariotte", body: `<span class="step-formula">P · V = constante</span> à température constante` },
      { title: "Volume mort", body: `V₀ = ${state.V0.toFixed(1)} mL · P₀ = 101 325 Pa` },
      { title: "Calcul", body: `<span class="step-formula">k = P₀ · V₀ = 101325 × ${state.V0.toFixed(1)} = ${k.toFixed(0)} Pa·mL</span>` },
      { title: "Vérification", body: `P·(V + V₀) = ${P.toFixed(0)} × (${state.Vinit} + ${state.V0}) ≈ ${(P * (state.Vinit + state.V0)).toFixed(0)} Pa·mL` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmou02-vinit").addEventListener("input", (e) => {
    document.getElementById("pmou02-vinit-val").textContent = e.target.value + " mL";
  });
  document.getElementById("pmou02-run").addEventListener("click", runMeasurement);
  document.getElementById("pmou02-rand").addEventListener("click", () => {
    const v = Number((15 + rng() * 40).toFixed(0));
    document.getElementById("pmou02-vinit").value = v;
    document.getElementById("pmou02-vinit-val").textContent = v + " mL";
    runMeasurement();
  });
  document.getElementById("pmou02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmou02-steps");
    const btn = document.getElementById("pmou02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
