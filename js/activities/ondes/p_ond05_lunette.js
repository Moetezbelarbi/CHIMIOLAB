import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function grossissement(f1, f2) { return f1 / f2; }

export const id = "pond05";
export const level = "premiere";
export const domain = "ondes";
export const theme = "optique";
export const titleKey = "pond05.title";

export function mount(container) {
  const state = { f1: 100, f2: 10, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pond05-f2">${t("pond05.input.f2")}</label>
      <input id="pond05-f2" type="range" min="5" max="50" step="1" value="${state.f2}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>5 mm</span><span id="pond05-f2-val">${state.f2} mm</span><span>50 mm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pond05-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pond05-rand">${t("ui.randomize")}</button>
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

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pond05-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pond05-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pond05-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pond05-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema() {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("line", { x1: "20", y1: "130", x2: "620", y2: "130", stroke: "#455A64", "stroke-width": "1" }));
    // objectif
    svg.appendChild(mk("ellipse", { cx: "180", cy: "130", rx: "10", ry: "60", fill: "#90CAF9", stroke: "#1565C0", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "180", y: "220", "text-anchor": "middle", fill: "#1565C0", "font-size": "11" }, "objectif f'₁ = " + state.f1 + " mm"));
    // oculaire
    svg.appendChild(mk("ellipse", { cx: "460", cy: "130", rx: "10", ry: "40", fill: "#90CAF9", stroke: "#1565C0", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "460", y: "220", "text-anchor": "middle", fill: "#1565C0", "font-size": "11" }, "oculaire f'₂ = " + state.f2 + " mm"));
    // rayons
    svg.appendChild(mk("line", { x1: "40", y1: "100", x2: "620", y2: "100", stroke: "#F57C00", "stroke-width": "1" }));
    svg.appendChild(mk("line", { x1: "40", y1: "160", x2: "620", y2: "160", stroke: "#F57C00", "stroke-width": "1" }));
    svg.appendChild(mk("text", { x: "320", y: "40", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "G = " + (state.f1 / state.f2).toFixed(1)));
  }

  function runMeasurement() {
    state.f2 = parseFloat(document.getElementById("pond05-f2").value);
    document.getElementById("pond05-f2-val").textContent = state.f2 + " mm";
    const G = grossissement(state.f1, state.f2);
    drawSchema();
    const grid = document.getElementById("pond05-measures");
    grid.innerHTML = "";
    [
      { label: "f'₁ objectif", value: state.f1.toFixed(0), unit: "mm" },
      { label: "f'₂ oculaire", value: state.f2.toFixed(0), unit: "mm" },
      { label: "Grossissement", value: G.toFixed(1), unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pond05-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Grossissement</div>
      <div class="measure-value" style="font-size:26px">G = ${G.toFixed(1)}</div>
    </div>`;
    const steps = document.getElementById("pond05-steps");
    steps.innerHTML = "";
    [
      { title: "Lunette afocale", body: `L'objectif forme une image au foyer, l'oculaire la renvoie à l'infini.` },
      { title: "Formule", body: `<span class="step-formula">G = f'₁ / f'₂</span>` },
      { title: "Calcul", body: `<span class="step-formula">G = ${state.f1} / ${state.f2} = ${G.toFixed(2)}</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pond05-f2").addEventListener("input", (e) => {
    document.getElementById("pond05-f2-val").textContent = e.target.value + " mm";
  });
  document.getElementById("pond05-run").addEventListener("click", runMeasurement);
  document.getElementById("pond05-rand").addEventListener("click", () => {
    const v = Number((5 + rng() * 40).toFixed(0));
    document.getElementById("pond05-f2").value = v;
    document.getElementById("pond05-f2-val").textContent = v + " mm";
    runMeasurement();
  });
  document.getElementById("pond05-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pond05-steps");
    const btn = document.getElementById("pond05-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
