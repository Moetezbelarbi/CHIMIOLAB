import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { makeRng } from "../../measure.js";

export function N_of_t(N0, lambda, time) { return N0 * Math.exp(-lambda * time); }
export function demiVie(lambda) { return Math.LN2 / lambda; }

export const id = "tmat05";
export const level = "terminale";
export const domain = "matiere";
export const theme = "radioactivite";
export const titleKey = "tmat05.title";

export function mount(container) {
  const state = { N0: 1e6, lambda: 0.01, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tmat05-l">${t("tmat05.input.lambda")}</label>
      <input id="tmat05-l" type="range" min="0.005" max="0.100" step="0.001" value="${state.lambda}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,005</span><span id="tmat05-l-val">${state.lambda.toFixed(3)}</span><span>0,100</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmat05-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmat05-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 100, ymin: 0, ymax: 1e6,
    xlabel: "t", ylabel: "N", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="tmat05-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmat05-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmat05-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmat05-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function runMeasurement() {
    state.lambda = parseFloat(document.getElementById("tmat05-l").value);
    document.getElementById("tmat05-l-val").textContent = state.lambda.toFixed(3);
    const th = demiVie(state.lambda);
    const tMax = 5 / state.lambda;
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const time = tMax * i / 200;
      pts.push({ x: time, y: N_of_t(state.N0, state.lambda, time) });
    }
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: tMax, ymin: 0, ymax: state.N0 * 1.05 });
    const grid = document.getElementById("tmat05-measures");
    grid.innerHTML = "";
    [
      { label: "λ", value: state.lambda.toFixed(3), unit: "" },
      { label: "t½", value: th.toFixed(2), unit: "" },
      { label: "N₀", value: "1,0×10⁶", unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmat05-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Demi-vie</div>
      <div class="measure-value" style="font-size:26px">t½ = ${th.toFixed(2)}</div>
    </div>`;
    const steps = document.getElementById("tmat05-steps");
    steps.innerHTML = "";
    [
      { title: "Loi de décroissance", body: `<span class="step-formula">N(t) = N₀ · e^(−λ·t)</span>` },
      { title: "Demi-vie", body: `<span class="step-formula">t½ = ln 2 / λ</span>` },
      { title: "Calcul", body: `<span class="step-formula">t½ = 0,693 / ${state.lambda.toFixed(3)} = ${th.toFixed(2)}</span>` },
      { title: "Interprétation", body: `Au bout de ${th.toFixed(1)}, la moitié des noyaux se sont désintégrés.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmat05-l").addEventListener("input", (e) => {
    document.getElementById("tmat05-l-val").textContent = parseFloat(e.target.value).toFixed(3);
  });
  document.getElementById("tmat05-run").addEventListener("click", runMeasurement);
  document.getElementById("tmat05-rand").addEventListener("click", () => {
    const l = Number((0.008 + rng() * 0.09).toFixed(3));
    document.getElementById("tmat05-l").value = l;
    document.getElementById("tmat05-l-val").textContent = l.toFixed(3);
    runMeasurement();
  });
  document.getElementById("tmat05-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmat05-steps");
    const btn = document.getElementById("tmat05-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
