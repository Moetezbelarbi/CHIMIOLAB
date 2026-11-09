import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

export function conjugate(OAcm, fprimeCm) {
  const inv = 1 / fprimeCm + 1 / OAcm;
  if (Math.abs(inv) < 1e-9) return { OAprime: Infinity, gamma: Infinity, infinite: true };
  const OAprime = 1 / inv;
  return { OAprime, gamma: OAprime / OAcm, infinite: false };
}

export const id = "pond04";
export const level = "premiere";
export const domain = "ondes";
export const theme = "optique";
export const titleKey = "pond04.title";

export function mount(container) {
  const state = { fprime: 10, OA: -15, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pond04-oa">${t("pond04.input.OA")}</label>
      <input id="pond04-oa" type="range" min="-60" max="-2" step="0.5" value="${state.OA}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>−60 cm</span><span id="pond04-oa-val">${state.OA} cm</span><span>−2 cm</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pond04-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pond04-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 300");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pond04-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pond04-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pond04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pond04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(OAprime, gamma, infinite) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("line", { x1: "20", y1: "150", x2: "620", y2: "150", stroke: "#455A64", "stroke-width": "1" }));
    svg.appendChild(mk("ellipse", { cx: "300", cy: "150", rx: "10", ry: "70", fill: "#90CAF9", stroke: "#1565C0", "stroke-width": "2" }));
    svg.appendChild(mk("circle", { cx: "300" + state.fprime * 6, cy: "150", r: "4", fill: "#F57C00" }));
    svg.appendChild(mk("circle", { cx: "300" - state.fprime * 6, cy: "150", r: "4", fill: "#F57C00" }));
    svg.appendChild(mk("text", { x: "300" + state.fprime * 6, y: "175", "text-anchor": "middle", fill: "#F57C00", "font-size": "11" }, "F'"));
    svg.appendChild(mk("text", { x: "300" - state.fprime * 6, y: "175", "text-anchor": "middle", fill: "#F57C00", "font-size": "11" }, "F"));
    const objX = 300 + state.OA * 6;
    svg.appendChild(mk("line", { x1: objX, y1: "150", x2: objX, y2: "90", stroke: "#2E7D32", "stroke-width": "3" }));
    svg.appendChild(mk("polygon", { points: `${objX - 5},100 ${objX + 5},100 ${objX},88`, fill: "#2E7D32" }));
    svg.appendChild(mk("text", { x: objX, y: "80", "text-anchor": "middle", fill: "#2E7D32", "font-size": "11" }, "objet"));
    if (!infinite && isFinite(OAprime)) {
      const imgX = 300 + OAprime * 6;
      const h = 60 * Math.abs(gamma);
      const up = gamma > 0;
      svg.appendChild(mk("line", { x1: imgX, y1: "150", x2: imgX, y2: up ? String(150 - h) : String(150 + h), stroke: "#C62828", "stroke-width": "3" }));
      svg.appendChild(mk("text", { x: imgX, y: "270", "text-anchor": "middle", fill: "#C62828", "font-size": "11" }, "image"));
    } else {
      svg.appendChild(mk("text", { x: "550", y: "220", "text-anchor": "middle", fill: "#C62828", "font-size": "13", "font-weight": "bold" }, "image à l'infini"));
    }
  }

  function runMeasurement() {
    state.OA = parseFloat(document.getElementById("pond04-oa").value);
    document.getElementById("pond04-oa-val").textContent = state.OA + " cm";
    const { OAprime, gamma, infinite } = conjugate(state.OA, state.fprime);
    drawSchema(OAprime, gamma, infinite);
    const grid = document.getElementById("pond04-measures");
    grid.innerHTML = "";
    const items = infinite
      ? [{ label: "OA", value: state.OA.toFixed(1), unit: "cm" },
         { label: "Image", value: "∞", unit: "" },
         { label: "γ", value: "∞", unit: "" }]
      : [{ label: "OA", value: state.OA.toFixed(1), unit: "cm" },
         { label: "OA'", value: OAprime.toFixed(1), unit: "cm" },
         { label: "γ", value: gamma.toFixed(2), unit: "" }];
    items.forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pond04-result");
    result.innerHTML = infinite
      ? `<div class="measure-card" style="text-align:left">
          <div class="measure-label">Image</div>
          <div class="measure-value" style="font-size:22px">à l'infini</div>
          <div class="measure-unit">OA = −f'</div>
        </div>`
      : `<div class="measure-card" style="text-align:left">
          <div class="measure-label">Position de l'image</div>
          <div class="measure-value" style="font-size:26px">${OAprime.toFixed(1)} cm</div>
          <div class="measure-unit">γ = ${gamma.toFixed(2)} (${gamma < 0 ? "renversée" : "droite"})</div>
        </div>`;
    const steps = document.getElementById("pond04-steps");
    steps.innerHTML = "";
    const stepData = infinite
      ? [
          { title: "Relation de conjugaison", body: `<span class="step-formula">1/OA' − 1/OA = 1/f'</span>` },
          { title: "Cas particulier", body: `OA = −f' → 1/OA' = 0 → OA' → ∞ : image à l'infini.` }
        ]
      : [
          { title: "Relation de conjugaison", body: `<span class="step-formula">1/OA' − 1/OA = 1/f'</span>` },
          { title: "Données", body: `f' = ${state.fprime} cm · OA = ${state.OA.toFixed(1)} cm` },
          { title: "Calcul OA'", body: `<span class="step-formula">1/OA' = 1/${state.fprime} + 1/(${state.OA.toFixed(1)}) → OA' = ${OAprime.toFixed(2)} cm</span>` },
          { title: "Grandissement", body: `<span class="step-formula">γ = OA'/OA = ${gamma.toFixed(2)}</span>` },
          { title: "Image", body: gamma < 0 ? "L'image est réelle et renversée." : "L'image est virtuelle et droite." }
        ];
    stepData.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pond04-oa").addEventListener("input", (e) => {
    document.getElementById("pond04-oa-val").textContent = e.target.value + " cm";
  });
  document.getElementById("pond04-run").addEventListener("click", runMeasurement);
  document.getElementById("pond04-rand").addEventListener("click", () => {
    const oa = -Number((3 + rng() * 40).toFixed(1));
    document.getElementById("pond04-oa").value = oa;
    document.getElementById("pond04-oa-val").textContent = oa.toFixed(1) + " cm";
    runMeasurement();
  });
  document.getElementById("pond04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pond04-steps");
    const btn = document.getElementById("pond04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
