import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";

export function resistanceThermique(e, lambda, S) { return e / (lambda * S); }

export const id = "tene02";
export const level = "terminale";
export const domain = "energie";
export const theme = "thermique";
export const titleKey = "tene02.title";

export function mount(container) {
  const state = { e: 0.10, lambda: 0.040, S: 1.0, deltaT: 20, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tene02-e">${t("tene02.input.e")}</label>
      <input id="tene02-e" type="range" min="0.01" max="0.50" step="0.01" value="${state.e}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>1 cm</span><span id="tene02-e-val">${(state.e * 100).toFixed(0)} cm</span><span>50 cm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tene02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tene02-rand">${t("ui.randomize")}</button>
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
    <div class="measure-grid" id="tene02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tene02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tene02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tene02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(Rth) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "120", y: "60", width: "300", height: "100", fill: "#FFCCBC", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "270", y: "115", "text-anchor": "middle", fill: "#BF360C", "font-size": "14", "font-weight": "bold" }, "paroi · e = " + (state.e * 100).toFixed(0) + " cm · λ = " + state.lambda.toFixed(3)));
    svg.appendChild(mk("text", { x: "80", y: "100", "text-anchor": "middle", fill: "#C62828", "font-size": "13", "font-weight": "bold" }, "T₁"));
    svg.appendChild(mk("text", { x: "460", y: "100", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "T₂"));
    svg.appendChild(mk("polygon", { points: "120,100 90,100 100,90 100,110", fill: "#C62828" }));
    svg.appendChild(mk("polygon", { points: "420,100 450,100 440,90 440,110", fill: "#C62828" }));
    svg.appendChild(mk("text", { x: "270", y: "200", "text-anchor": "middle", fill: "#1565C0", "font-size": "14", "font-weight": "bold" }, "Rth = " + Rth.toFixed(3) + " K/W"));
  }

  function runMeasurement() {
    state.e = parseFloat(document.getElementById("tene02-e").value);
    document.getElementById("tene02-e-val").textContent = (state.e * 100).toFixed(0) + " cm";
    const Rth = resistanceThermique(state.e, state.lambda, state.S);
    drawSchema(Rth);
    const grid = document.getElementById("tene02-measures");
    grid.innerHTML = "";
    [
      { label: "Épaisseur e", value: (state.e * 100).toFixed(0), unit: "cm" },
      { label: "Conductivité λ", value: state.lambda.toFixed(3), unit: "W/m/K" },
      { label: "Rth", value: Rth.toFixed(3), unit: "K/W" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tene02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Résistance thermique</div>
      <div class="measure-value" style="font-size:26px">${Rth.toFixed(3)} K/W</div>
    </div>`;
    const steps = document.getElementById("tene02-steps");
    steps.innerHTML = "";
    [
      { title: "Flux thermique", body: `<span class="step-formula">Φ = ΔT / Rth</span>` },
      { title: "Résistance thermique", body: `<span class="step-formula">Rth = e / (λ · S)</span>` },
      { title: "Calcul", body: `<span class="step-formula">Rth = ${state.e} / (${state.lambda} × ${state.S}) = ${Rth.toFixed(3)} K/W</span>` },
      { title: "Interprétation", body: `Plus Rth est grand, plus la paroi est isolante.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tene02-e").addEventListener("input", (e) => {
    document.getElementById("tene02-e-val").textContent = (parseFloat(e.target.value) * 100).toFixed(0) + " cm";
  });
  document.getElementById("tene02-run").addEventListener("click", runMeasurement);
  document.getElementById("tene02-rand").addEventListener("click", () => {
    const v = Number((0.02 + rng() * 0.4).toFixed(2));
    document.getElementById("tene02-e").value = v;
    document.getElementById("tene02-e-val").textContent = (v * 100).toFixed(0) + " cm";
    runMeasurement();
  });
  document.getElementById("tene02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tene02-steps");
    const btn = document.getElementById("tene02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
