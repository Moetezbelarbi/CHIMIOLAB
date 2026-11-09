import { t } from "../../i18n.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const KE = 1e-14;
export function pHFaible(C, Ka) {
  const f = h => h * h * h + Ka * h * h - (KE + Ka * C) * h - Ka * KE;
  let lo = 1e-14, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    let prev = lo, fprev = flo;
    for (let i = 1; i <= 300; i++) {
      const x = lo * Math.pow(hi / lo, i / 300);
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; fhi = fx; break; }
      prev = x; fprev = fx;
    }
  }
  for (let i = 0; i < 300; i++) {
    const mid = Math.sqrt(lo * hi);
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return -Math.log10(Math.sqrt(lo * hi));
}
export function tauxAvancement(C, Ka) {
  const pH = pHFaible(C, Ka);
  return Math.pow(10, -pH) / C;
}
export const id = "tmat01";
export const level = "terminale";
export const domain = "matiere";
export const theme = "acide_base";
export const titleKey = "tmat01.title";

export function mount(container) {
  const state = { C: 0.010, Ka: Math.pow(10, -4.75), seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="tmat01-c">${t("tmat01.input.C")}</label>
      <input id="tmat01-c" type="range" min="0.001" max="0.100" step="0.001" value="${state.C}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,001</span><span id="tmat01-c-val">${state.C.toFixed(3)} mol/L</span><span>0,100</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmat01-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmat01-rand">${t("ui.randomize")}</button>
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
    <div class="measure-grid" id="tmat01-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmat01-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmat01-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmat01-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(pH, tau) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "80", y: "100", width: "130", height: "110", rx: "8", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "82", y: "140", width: "126", height: "68", fill: "#90CAF9", opacity: "0.5" }));
    svg.appendChild(mk("text", { x: "145", y: "230", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "bécher · acide faible"));
    svg.appendChild(mk("rect", { x: "115", y: "110", width: "10", height: "60", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("rect", { x: "155", y: "110", width: "10", height: "60", fill: "#B0BEC5", stroke: "#37474F" }));
    svg.appendChild(mk("rect", { x: "400", y: "60", width: "180", height: "100", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": 2 }));
    svg.appendChild(mk("rect", { x: "412", y: "72", width: "156", height: "60", rx: "4", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "490", y: "110", "text-anchor": "middle", fill: "#00E676", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "pH = " + pH.toFixed(2)));
    svg.appendChild(mk("text", { x: "490", y: "145", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "pH-mètre"));
    svg.appendChild(mk("line", { x1: "400", y1: "110", x2: "180", y2: "160", stroke: "#455A64", "stroke-width": "3" }));
    svg.appendChild(mk("text", { x: "490", y: "200", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "τ = " + (tau * 100).toFixed(1) + " %"));
  }

  function runMeasurement() {
    state.C = parseFloat(document.getElementById("tmat01-c").value);
    document.getElementById("tmat01-c-val").textContent = state.C.toFixed(3) + " mol/L";
    const pH = pHFaible(state.C, state.Ka);
    const tau = tauxAvancement(state.C, state.Ka);
    drawSchema(pH, tau);
    const grid = document.getElementById("tmat01-measures");
    grid.innerHTML = "";
    [
      { label: "pH", value: pH.toFixed(2), unit: "" },
      { label: "τ", value: (tau * 100).toFixed(1), unit: "%" },
      { label: "[H₃O⁺]", value: Math.pow(10, -pH).toExponential(2), unit: "mol/L" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmat01-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">pH de la solution</div>
      <div class="measure-value" style="font-size:26px">pH = ${pH.toFixed(2)}</div>
      <div class="measure-unit">τ = ${(tau * 100).toFixed(1)} %</div>
    </div>`;
    const steps = document.getElementById("tmat01-steps");
    steps.innerHTML = "";
    [
      { title: "Réaction de dissociation", body: `<span class="step-formula">CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺</span>` },
      { title: "Constante d'acidité", body: `<span class="step-formula">Ka = [CH₃COO⁻][H₃O⁺]/[CH₃COOH] = 10^-4,75</span>` },
      { title: "Équation exacte", body: `Résolution de <span class="step-formula">h³ + Ka·h² − (Ke + Ka·C)·h − Ka·Ke = 0</span> avec h = [H₃O⁺]` },
      { title: "Résultat", body: `<span class="step-formula">pH = ${pH.toFixed(2)}</span>` },
      { title: "Taux d'avancement", body: `<span class="step-formula">τ = [H₃O⁺]/C = ${(tau * 100).toFixed(1)} %</span> → acide ${tau < 0.1 ? "faiblement dissocié" : "partiellement dissocié"}` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmat01-c").addEventListener("input", (e) => {
    document.getElementById("tmat01-c-val").textContent = parseFloat(e.target.value).toFixed(3) + " mol/L";
  });
  document.getElementById("tmat01-run").addEventListener("click", runMeasurement);
  document.getElementById("tmat01-rand").addEventListener("click", () => {
    const c = Number((0.002 + rng() * 0.08).toFixed(3));
    document.getElementById("tmat01-c").value = c;
    document.getElementById("tmat01-c-val").textContent = c.toFixed(3) + " mol/L";
    runMeasurement();
  });
  document.getElementById("tmat01-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmat01-steps");
    const btn = document.getElementById("tmat01-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
