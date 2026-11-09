import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";
import { E_CHARGE } from "../../config.js";

export function deviation(q, E, m, L, v0) {
  const a = q * E / m;
  const tFlight = L / v0;
  return 0.5 * a * tFlight * tFlight;
}

export const id = "tmou02";
export const level = "terminale";
export const domain = "mouvement";
export const theme = "champ_uniforme";
export const titleKey = "tmou02.title";

export function mount(container) {
  const state = { q: E_CHARGE, E: 1e4, m: 9.11e-31, L: 0.05, v0: 1e7, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tmou02-e">${t("tmou02.input.E")}</label>
      <input id="tmou02-e" type="range" min="1000" max="100000" step="1000" value="${state.E}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>1 kV/m</span><span id="tmou02-e-val">${(state.E / 1000).toFixed(0)} kV/m</span><span>100 kV/m</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmou02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmou02-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 200");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tmou02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmou02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmou02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmou02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(y) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "100", y: "40", width: "300", height: "120", fill: "none", stroke: "#455A64", "stroke-width": "2", "stroke-dasharray": "6 4" }));
    for (let x = 110; x < 400; x += 30) {
      svg.appendChild(mk("line", { x1: String(x), y1: "45", x2: String(x), y2: "155", stroke: "#90CAF9", "stroke-width": "1" }));
    }
    svg.appendChild(mk("text", { x: "250", y: "30", "text-anchor": "middle", fill: "#1565C0", "font-size": "12" }, "champ E = " + (state.E / 1000).toFixed(0) + " kV/m"));
    svg.appendChild(mk("circle", { cx: "100", cy: "100", r: "5", fill: "#FF1744" }));
    svg.appendChild(mk("line", { x1: "100", y1: "100", x2: "400", y2: String(100 + y * 800), stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "400", y: String(100 + y * 800), fill: "#C62828", "font-size": "13", "font-weight": "bold" }, "y = " + y.toExponential(2) + " m"));
  }

  function runMeasurement() {
    state.E = parseFloat(document.getElementById("tmou02-e").value);
    document.getElementById("tmou02-e-val").textContent = (state.E / 1000).toFixed(0) + " kV/m";
    const y = deviation(state.q, state.E, state.m, state.L, state.v0);
    drawSchema(y);
    const grid = document.getElementById("tmou02-measures");
    grid.innerHTML = "";
    [
      { label: "E", value: (state.E / 1000).toFixed(0), unit: "kV/m" },
      { label: "v₀", value: (state.v0 / 1e7).toFixed(1) + "×10⁷", unit: "m/s" },
      { label: "Déviation y", value: y.toExponential(2), unit: "m" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmou02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Déviation</div>
      <div class="measure-value" style="font-size:24px">y = ${y.toExponential(2)} m</div>
    </div>`;
    const steps = document.getElementById("tmou02-steps");
    steps.innerHTML = "";
    [
      { title: "Force électrique", body: `<span class="step-formula">F = q · E</span>` },
      { title: "Accélération", body: `<span class="step-formula">a = q·E/m</span>` },
      { title: "Temps de vol", body: `<span class="step-formula">t = L/v₀</span>` },
      { title: "Déviation", body: `<span class="step-formula">y = ½ · a · t² = ${y.toExponential(2)} m</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmou02-e").addEventListener("input", (e) => {
    document.getElementById("tmou02-e-val").textContent = (parseFloat(e.target.value) / 1000).toFixed(0) + " kV/m";
  });
  document.getElementById("tmou02-run").addEventListener("click", runMeasurement);
  document.getElementById("tmou02-rand").addEventListener("click", () => {
    const v = Math.round((5000 + rng() * 90000) / 1000) * 1000;
    document.getElementById("tmou02-e").value = v;
    document.getElementById("tmou02-e-val").textContent = (v / 1000).toFixed(0) + " kV/m";
    runMeasurement();
  });
  document.getElementById("tmou02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmou02-steps");
    const btn = document.getElementById("tmou02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
