import { t } from "../../i18n.js";
import { makeRng } from "../../measure.js";

export function pHBuffer(pKa, Cbase, Cacide) {
  if (Cacide <= 0) return 14;
  return pKa + Math.log10(Cbase / Cacide);
}

export const id = "tmat02";
export const level = "terminale";
export const domain = "matiere";
export const theme = "acide_base";
export const titleKey = "tmat02.title";

export function mount(container) {
  const state = { pKa: 4.75, Cb: 0.10, Ca: 0.10, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label>Rapport [base]/[acide]</label>
      <input id="tmat02-ratio" type="range" min="0.1" max="10" step="0.1" value="1">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,1</span><span id="tmat02-ratio-val">1,0</span><span>10</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="tmat02-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="tmat02-rand">${t("ui.randomize")}</button>
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
    <div class="measure-grid" id="tmat02-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="tmat02-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="tmat02-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="tmat02-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(pH) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    svg.appendChild(mk("rect", { x: "80", y: "100", width: "140", height: "120", rx: "8", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "82", y: "140", width: "136", height: "78", fill: "#B39DDB", opacity: "0.5" }));
    svg.appendChild(mk("text", { x: "150", y: "235", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "bécher · solution tampon"));
    svg.appendChild(mk("rect", { x: "400", y: "60", width: "180", height: "100", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "412", y: "72", width: "156", height: "60", rx: "4", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "490", y: "110", "text-anchor": "middle", fill: "#00E676", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "pH = " + pH.toFixed(2)));
    svg.appendChild(mk("text", { x: "490", y: "145", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "pH-mètre"));
    svg.appendChild(mk("line", { x1: "400", y1: "110", x2: "190", y2: "160", stroke: "#455A64", "stroke-width": "3" }));
    svg.appendChild(mk("text", { x: "320", y: "40", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "Effet tampon · pH stable"));
  }

  function runMeasurement() {
    const ratio = parseFloat(document.getElementById("tmat02-ratio").value);
    document.getElementById("tmat02-ratio-val").textContent = ratio.toFixed(1).replace(".", ",");
    state.Cb = 0.10 * ratio;
    state.Ca = 0.10;
    const pH = pHBuffer(state.pKa, state.Cb, state.Ca);
    drawSchema(pH);
    const grid = document.getElementById("tmat02-measures");
    grid.innerHTML = "";
    [
      { label: "pKa", value: state.pKa.toFixed(2), unit: "" },
      { label: "[base]/[acide]", value: ratio.toFixed(1), unit: "" },
      { label: "pH", value: pH.toFixed(2), unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("tmat02-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">pH du tampon</div>
      <div class="measure-value" style="font-size:26px">pH = ${pH.toFixed(2)}</div>
    </div>`;
    const steps = document.getElementById("tmat02-steps");
    steps.innerHTML = "";
    [
      { title: "Relation d'Henderson-Hasselbalch", body: `<span class="step-formula">pH = pKa + log([base]/[acide])</span>` },
      { title: "Données", body: `pKa = ${state.pKa} · [base]/[acide] = ${ratio.toFixed(1)}` },
      { title: "Calcul", body: `<span class="step-formula">pH = ${state.pKa} + log(${ratio.toFixed(1)}) = ${pH.toFixed(2)}</span>` },
      { title: "Effet tampon", body: `Tant que le rapport reste entre 0,1 et 10, le pH varie peu : c'est l'effet tampon.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("tmat02-ratio").addEventListener("input", (e) => {
    document.getElementById("tmat02-ratio-val").textContent = parseFloat(e.target.value).toFixed(1).replace(".", ",");
  });
  document.getElementById("tmat02-run").addEventListener("click", runMeasurement);
  document.getElementById("tmat02-rand").addEventListener("click", () => {
    const r = Number((0.2 + rng() * 5).toFixed(1));
    document.getElementById("tmat02-ratio").value = r;
    document.getElementById("tmat02-ratio-val").textContent = r.toFixed(1).replace(".", ",");
    runMeasurement();
  });
  document.getElementById("tmat02-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("tmat02-steps");
    const btn = document.getElementById("tmat02-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() {};
}
