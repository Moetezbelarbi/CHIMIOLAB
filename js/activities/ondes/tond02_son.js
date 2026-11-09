import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";

export const I0 = 1e-12;
export function niveau(I) { if (I <= 0) return -Infinity; return 10 * Math.log10(I / I0); }

export const id = "tond02";
export const level = "terminale";
export const domain = "ondes";
export const theme = "ondes_sonores";
export const titleKey = "tond02.title";

export function mount(container) {
  const state = { I: 1e-6, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tond02-i">${t("tond02.input.I")}</label>
      <input id="tond02-i" type="range" min="-12" max="0" step="0.5" value="-6">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>10⁻¹² W/m²</span><span id="tond02-i-val">10⁻⁶ W/m²</span><span>1 W/m²</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tond02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tond02-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 180");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tond02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tond02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tond02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tond02-steps" class="steps" style="display:none"></div>`;
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
    svg.appendChild(mk("circle", { cx: "80", cy: "90", r: "20", fill: "#FFEB3B", stroke: "#F57F17", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "80", y: "140", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "source"));
    for (let k = 1; k <= 5; k++) {
      svg.appendChild(mk("circle", { cx: "80", cy: "90", r: String(20 + k * 20), fill: "none", stroke: "#1565C0", "stroke-width": "1.5", opacity: String(1 - k * 0.15) }));
    }
    svg.appendChild(mk("text", { x: "480", y: "70", "text-anchor": "middle", fill: "#1565C0", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "L = " + L.toFixed(1) + " dB"));
    svg.appendChild(mk("text", { x: "480", y: "100", "text-anchor": "middle", fill: "#455A64", "font-size": "12" }, "niveau d'intensité"));
    const bars = Math.max(0, Math.min(10, Math.round(L / 12)));
    for (let i = 0; i < 10; i++) {
      svg.appendChild(mk("rect", { x: String(380 + i * 16), y: "130", width: "12", height: "20", fill: i < bars ? "#1565C0" : "#E0E0E0", rx: "2" }));
    }
  }

  function runMeasurement() {
    const expo = parseFloat(document.getElementById("tond02-i").value);
    state.I = Math.pow(10, expo);
    document.getElementById("tond02-i-val").textContent = "10^" + expo.toFixed(1) + " W/m²";
    const L = niveau(state.I);
    drawSchema(L);
    const grid = document.getElementById("tond02-measures");
    grid.innerHTML = "";
    [
      { label: "I", value: state.I.toExponential(2), unit: "W/m²" },
      { label: "I₀", value: "1,0×10⁻¹²", unit: "W/m²" },
      { label: "L", value: L.toFixed(1), unit: "dB" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tond02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Niveau d'intensité</div>
      <div class="measure-value" style="font-size:26px">L = ${L.toFixed(1)} dB</div>
    </div>`;
    const steps = document.getElementById("tond02-steps");
    steps.innerHTML = "";
    [
      { title: "Définition du niveau", body: `<span class="step-formula">L = 10 · log(I / I₀)</span>` },
      { title: "Données", body: `I = ${state.I.toExponential(2)} W/m² · I₀ = 1,0×10⁻¹² W/m²` },
      { title: "Calcul", body: `<span class="step-formula">L = 10 × log(${state.I.toExponential(2)} / 1e-12) = ${L.toFixed(1)} dB</span>` },
      { title: "Repères", body: `0 dB : seuil d'audition · 60 dB : conversation · 85 dB : danger.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tond02-i").addEventListener("input", (e) => {
    document.getElementById("tond02-i-val").textContent = "10^" + parseFloat(e.target.value).toFixed(1) + " W/m²";
  });
  document.getElementById("tond02-run").addEventListener("click", runMeasurement);
  document.getElementById("tond02-rand").addEventListener("click", () => {
    const v = Number((-11 + rng() * 10).toFixed(1));
    document.getElementById("tond02-i").value = v;
    document.getElementById("tond02-i-val").textContent = "10^" + v.toFixed(1) + " W/m²";
    runMeasurement();
  });
  document.getElementById("tond02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tond02-steps");
    const btn = document.getElementById("tond02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
