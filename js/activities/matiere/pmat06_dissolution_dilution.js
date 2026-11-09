import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const SELS = {
  CuSO4: { label: "CuSO₄ anhydre", M: 159.6 },
  CuSO4_5H2O: { label: "CuSO₄·5H₂O", M: 249.7 },
  NaCl: { label: "NaCl", M: 58.5 }
};
export function concentrationAfterDissolution(massG, M, fioleMl) { return massG / M / (fioleMl * 1e-3); }
export function concentrationAfterDilution(C0, VpipetteMl, VfioleMl) { return C0 * VpipetteMl / VfioleMl; }

export const id = "pmat06";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat06.title";

export function mount(container) {
  const state = { sel: "CuSO4", mass: 2.50, fiole: 100.0, pipette: 20.00, fioleDil: 100.0, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field"><label for="pmat06-sel">${t("pmat06.input.sel")}</label>
      <select id="pmat06-sel">
        <option value="CuSO4">CuSO₄ anhydre (159,6 g/mol)</option>
        <option value="CuSO4_5H2O">CuSO₄·5H₂O (249,7 g/mol)</option>
        <option value="NaCl">NaCl (58,5 g/mol)</option>
      </select></div>
    <div class="field">
      <label for="pmat06-mass">${t("pmat06.input.mass")}</label>
      <input id="pmat06-mass" type="range" min="0.5" max="10" step="0.01" value="${state.mass}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,50 g</span><span id="pmat06-mass-val">${state.mass.toFixed(2)} g</span><span>10,00 g</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmat06-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat06-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 280");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat06-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat06-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat06-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat06-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(mass, C0, C1) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // balance
    svg.appendChild(mk("rect", { x: "40", y: "180", width: "120", height: "50", rx: "6", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "50", y: "190", width: "100", height: "30", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "100", y: "210", "text-anchor": "middle", fill: "#00E676", "font-size": "14", "font-family": "monospace" }, mass.toFixed(2) + " g"));
    svg.appendChild(mk("text", { x: "100", y: "250", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "balance"));
    // spatule + coupelle
    svg.appendChild(mk("rect", { x: "180", y: "180", width: "80", height: "20", rx: "3", fill: "#E0E0E0", stroke: "#455A64" }));
    svg.appendChild(mk("rect", { x: "260", y: "175", width: "8", height: "30", fill: "#78909C" }));
    // fiole jaugée
    svg.appendChild(mk("path", { d: "M360 40 L360 80 L330 130 L330 240 Q330 260 350 260 L420 260 Q440 260 440 240 L440 130 L410 80 L410 40 Z", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "358", y1: "90", x2: "412", y2: "90", stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "332", y: "160", width: "106", height: "98", fill: "#90CAF9", opacity: "0.5" }));
    svg.appendChild(mk("text", { x: "385", y: "275", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "fiole 100 mL"));
    // pipette
    svg.appendChild(mk("rect", { x: "470", y: "60", width: "14", height: "160", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "468", y1: "100", x2: "486", y2: "100", stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "477", y: "240", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "pipette 20 mL"));
    // fiole dilution
    svg.appendChild(mk("path", { d: "M540 80 L540 110 L520 150 L520 250 Q520 265 535 265 L585 265 Q600 265 600 250 L600 150 L580 110 L580 80 Z", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "518", y1: "170", x2: "602", y2: "170", stroke: "#C62828", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "560", y: "280", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "fiole 100 mL"));
    svg.appendChild(mk("text", { x: "320", y: "20", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "C₀ = " + C0.toFixed(4) + " mol/L"));
    svg.appendChild(mk("text", { x: "560", y: "20", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "C₁ = " + C1.toFixed(4) + " mol/L"));
  }

  function runMeasurement() {
    state.sel = document.getElementById("pmat06-sel").value;
    state.mass = parseFloat(document.getElementById("pmat06-mass").value);
    document.getElementById("pmat06-mass-val").textContent = state.mass.toFixed(2) + " g";
    const sel = SELS[state.sel];
    const C0 = concentrationAfterDissolution(state.mass, sel.M, state.fiole);
    const C1 = concentrationAfterDilution(C0, state.pipette, state.fioleDil);
    drawSchema(state.mass, C0, C1);
    const grid = document.getElementById("pmat06-measures");
    grid.innerHTML = "";
    [
      { label: "C₀", value: C0.toFixed(4), unit: "mol/L" },
      { label: "C₁ après dilution", value: C1.toFixed(4), unit: "mol/L" },
      { label: "Facteur de dilution", value: (state.fioleDil / state.pipette).toFixed(0), unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmat06-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Concentration finale</div>
      <div class="measure-value" style="font-size:26px">${C1.toFixed(4)} mol/L</div>
    </div>`;
    const steps = document.getElementById("pmat06-steps");
    steps.innerHTML = "";
    [
      { title: "Dissolution", body: `<span class="step-formula">n = m / M = ${state.mass.toFixed(2)} / ${sel.M} = ${(state.mass / sel.M).toExponential(3)} mol</span>` },
      { title: "Concentration C₀", body: `<span class="step-formula">C₀ = n / V = ${(state.mass / sel.M).toExponential(3)} / ${(state.fiole * 1e-3).toFixed(3)} = ${C0.toFixed(4)} mol/L</span>` },
      { title: "Dilution", body: `<span class="step-formula">C₁ = C₀ × V_pipette / V_fiole = ${C0.toFixed(4)} × ${state.pipette} / ${state.fioleDil} = ${C1.toFixed(4)} mol/L</span>` },
      { title: "Verrerie utilisée", body: `Balance (0,01 g) · fiole jaugée ${state.fiole} mL · pipette jaugée ${state.pipette} mL · fiole ${state.fioleDil} mL` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmat06-mass").addEventListener("input", (e) => {
    document.getElementById("pmat06-mass-val").textContent = parseFloat(e.target.value).toFixed(2) + " g";
  });
  document.getElementById("pmat06-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat06-rand").addEventListener("click", () => {
    const keys = Object.keys(SELS);
    document.getElementById("pmat06-sel").value = keys[Math.floor(rng() * keys.length)];
    const m = Number((0.5 + rng() * 5).toFixed(2));
    document.getElementById("pmat06-mass").value = m;
    document.getElementById("pmat06-mass-val").textContent = m.toFixed(2) + " g";
    runMeasurement();
  });
  document.getElementById("pmat06-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat06-steps");
    const btn = document.getElementById("pmat06-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
