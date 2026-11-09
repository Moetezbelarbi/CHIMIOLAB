import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";
import { H_PLANCK, C_LIGHT, E_CHARGE } from "../../config.js";

export function photonEnergyEV(lambdaNm) {
  return H_PLANCK * C_LIGHT / (lambdaNm * 1e-9) / E_CHARGE;
}

export const id = "tond01";
export const level = "terminale";
export const domain = "ondes";
export const theme = "photons";
export const titleKey = "tond01.title";

export function mount(container) {
  const state = { lambda: 500, W: 2.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tond01-l">${t("tond01.input.lambda")}</label>
      <input id="tond01-l" type="range" min="200" max="800" step="5" value="${state.lambda}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>200 nm</span><span id="tond01-l-val">${state.lambda} nm</span><span>800 nm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tond01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tond01-rand">${t("ui.randomize")}</button>
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
    <div class="measure-grid" id="tond01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tond01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tond01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tond01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(E, emis) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "80", y: "60", width: "120", height: "100", fill: "#B0BEC5", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "140", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "plaque métallique"));
    svg.appendChild(mk("line", { x1: "20", y1: "110", x2: "80", y2: "110", stroke: "#FF1744", "stroke-width": "2" }));
    svg.appendChild(mk("circle", { cx: "80", cy: "110", r: "4", fill: "#FF1744" }));
    svg.appendChild(mk("text", { x: "40", y: "95", "text-anchor": "middle", fill: "#FF1744", "font-size": "11" }, "photon"));
    if (emis) svg.appendChild(mk("circle", { cx: "240", cy: "110", r: "5", fill: "#1565C0" }));
    svg.appendChild(mk("text", { x: "450", y: "80", "text-anchor": "middle", fill: "#1565C0", "font-size": "18", "font-weight": "bold" }, "E = " + E.toFixed(2) + " eV"));
    svg.appendChild(mk("text", { x: "450", y: "110", "text-anchor": "middle", fill: "#C62828", "font-size": "13" }, "W = " + state.W.toFixed(1) + " eV"));
    svg.appendChild(mk("text", { x: "450", y: "140", "text-anchor": "middle", fill: emis ? "#2E7D32" : "#C62828", "font-size": "13", "font-weight": "bold" }, emis ? "électron émis" : "pas d'émission"));
  }

  function runMeasurement() {
    state.lambda = parseFloat(document.getElementById("tond01-l").value);
    document.getElementById("tond01-l-val").textContent = state.lambda + " nm";
    const E = photonEnergyEV(state.lambda);
    const emis = E > state.W;
    drawSchema(E, emis);
    const grid = document.getElementById("tond01-measures");
    grid.innerHTML = "";
    [
      { label: "λ", value: state.lambda.toFixed(0), unit: "nm" },
      { label: "E photon", value: E.toFixed(2), unit: "eV" },
      { label: "W", value: state.W.toFixed(1), unit: "eV" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tond01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Énergie du photon</div>
      <div class="measure-value" style="font-size:26px">E = ${E.toFixed(2)} eV</div>
      <div class="measure-unit">${emis ? "Émission possible" : "Émission impossible (E < W)"}</div>
    </div>`;
    const steps = document.getElementById("tond01-steps");
    steps.innerHTML = "";
    [
      { title: "Énergie du photon", body: `<span class="step-formula">E = h·c / λ</span>` },
      { title: "Conversion en eV", body: `<span class="step-formula">E(eV) = E(J) / e</span>` },
      { title: "Calcul", body: `<span class="step-formula">E = 6,63e-34 × 3e8 / (${state.lambda}e-9) / 1,60e-19 = ${E.toFixed(2)} eV</span>` },
      { title: "Condition d'émission", body: `E ${emis ? ">" : "<"} W = ${state.W} eV → ${emis ? "électron émis" : "pas d'électron"}` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tond01-l").addEventListener("input", (e) => {
    document.getElementById("tond01-l-val").textContent = e.target.value + " nm";
  });
  document.getElementById("tond01-run").addEventListener("click", runMeasurement);
  document.getElementById("tond01-rand").addEventListener("click", () => {
    const v = Math.round((250 + rng() * 500) / 5) * 5;
    document.getElementById("tond01-l").value = v;
    document.getElementById("tond01-l-val").textContent = v + " nm";
    runMeasurement();
  });
  document.getElementById("tond01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tond01-steps");
    const btn = document.getElementById("tond01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
