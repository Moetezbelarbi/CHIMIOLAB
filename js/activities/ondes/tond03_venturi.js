import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";

const RHO_EAU = 998;
export function vitesse2(D1cm, D2cm, v1) {
  const S1 = Math.PI * Math.pow(D1cm / 200, 2);
  const S2 = Math.PI * Math.pow(D2cm / 200, 2);
  return v1 * S1 / S2;
}
export function deltaP(D1cm, D2cm, v1, rho = RHO_EAU) {
  const v2 = vitesse2(D1cm, D2cm, v1);
  return 0.5 * rho * (v2 * v2 - v1 * v1);
}

export const id = "tond03";
export const level = "terminale";
export const domain = "ondes";
export const theme = "venturi";
export const titleKey = "tond03.title";

export function mount(container) {
  const state = { D1: 10, D2: 5, v1: 1.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tond03-v1">${t("tond03.input.v1")}</label>
      <input id="tond03-v1" type="range" min="0.2" max="5" step="0.1" value="${state.v1}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,2 m/s</span><span id="tond03-v1-val">${state.v1.toFixed(1)} m/s</span><span>5,0 m/s</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tond03-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tond03-rand">${t("ui.randomize")}</button>
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

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tond03-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tond03-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tond03-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tond03-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(h1, h2, dP) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "40", y: "90", width: "180", height: "60", fill: "#E3F2FD", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "220", y: "110", width: "100", height: "20", fill: "#90CAF9", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "320", y: "90", width: "180", height: "60", fill: "#E3F2FD", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "120", y: String(90 - h1), width: "14", height: String(h1), fill: "#1565C0", opacity: "0.7" }));
    svg.appendChild(mk("rect", { x: "280", y: String(110 - h2), width: "14", height: String(h2), fill: "#1565C0", opacity: "0.7" }));
    svg.appendChild(mk("text", { x: "130", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "D₁ = " + state.D1 + " cm"));
    svg.appendChild(mk("text", { x: "285", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "D₂ = " + state.D2 + " cm"));
    svg.appendChild(mk("text", { x: "400", y: "60", "text-anchor": "middle", fill: "#1565C0", "font-size": "14", "font-weight": "bold" }, "ΔP = " + dP.toFixed(0) + " Pa"));
    svg.appendChild(mk("polygon", { points: "40,120 70,110 70,130", fill: "#C62828" }));
    svg.appendChild(mk("text", { x: "20", y: "160", fill: "#C62828", "font-size": "11" }, "v₁"));
  }

  function runMeasurement() {
    state.v1 = parseFloat(document.getElementById("tond03-v1").value);
    document.getElementById("tond03-v1-val").textContent = state.v1.toFixed(1) + " m/s";
    const v2 = vitesse2(state.D1, state.D2, state.v1);
    const dP = deltaP(state.D1, state.D2, state.v1);
    const h1 = Math.min(60, 10 + state.v1 * 8);
    const h2 = Math.min(60, 10 + v2 * 8);
    drawSchema(h1, h2, dP);
    const grid = document.getElementById("tond03-measures");
    grid.innerHTML = "";
    [
      { label: "v₁", value: state.v1.toFixed(2), unit: "m/s" },
      { label: "v₂", value: v2.toFixed(2), unit: "m/s" },
      { label: "ΔP", value: dP.toFixed(0), unit: "Pa" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tond03-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Différence de pression</div>
      <div class="measure-value" style="font-size:26px">ΔP = ${dP.toFixed(0)} Pa</div>
    </div>`;
    const steps = document.getElementById("tond03-steps");
    steps.innerHTML = "";
    [
      { title: "Conservation du débit", body: `<span class="step-formula">v₁ · S₁ = v₂ · S₂</span>` },
      { title: "Vitesse v₂", body: `<span class="step-formula">v₂ = v₁ · (D₁/D₂)² = ${v2.toFixed(2)} m/s</span>` },
      { title: "Bernoulli", body: `<span class="step-formula">ΔP = ½·ρ·(v₂² − v₁²)</span>` },
      { title: "Calcul", body: `<span class="step-formula">ΔP = 0,5 × 998 × (${(v2*v2).toFixed(2)} − ${(state.v1*state.v1).toFixed(2)}) = ${dP.toFixed(0)} Pa</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tond03-v1").addEventListener("input", (e) => {
    document.getElementById("tond03-v1-val").textContent = parseFloat(e.target.value).toFixed(1) + " m/s";
  });
  document.getElementById("tond03-run").addEventListener("click", runMeasurement);
  document.getElementById("tond03-rand").addEventListener("click", () => {
    const v = Number((0.3 + rng() * 4).toFixed(1));
    document.getElementById("tond03-v1").value = v;
    document.getElementById("tond03-v1-val").textContent = v.toFixed(1) + " m/s";
    runMeasurement();
  });
  document.getElementById("tond03-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tond03-steps");
    const btn = document.getElementById("tond03-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
