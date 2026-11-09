import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";
import { pHExact, findEquivalence } from "./pmat04_titrage_ph.js";

const INDICATEURS = {
  helianthine: { low: 3.1, high: 4.4, colorLow: "#C62828", colorHigh: "#F9A825", label: "Hélianthine" },
  bbt: { low: 6.0, high: 7.6, colorLow: "#F9A825", colorHigh: "#1565C0", label: "BBT" },
  phenolphtaleine: { low: 8.2, high: 10.0, colorLow: "#FAFAFA", colorHigh: "#E91E63", label: "Phénolphtaléine" }
};
export function colorAt(pH, key) {
  const ind = INDICATEURS[key];
  if (!ind) return "#FAFAFA";
  if (pH < ind.low) return ind.colorLow;
  if (pH > ind.high) return ind.colorHigh;
  return "#BFBFBF";
}

export const id = "pmat03";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat03.title";

export function mount(container) {
  const state = { Ca: 0.070, Va: 10.0, Cb: 0.050, indicator: "phenolphtaleine", seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);

  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field"><label for="pmat03-ind">${t("pmat04.input.indicator")}</label>
      <select id="pmat03-ind">
        <option value="helianthine">${t("pmat04.indicator.helianthine")}</option>
        <option value="bbt">${t("pmat04.indicator.bbt")}</option>
        <option value="phenolphtaleine">${t("pmat04.indicator.phenolphtaleine")}</option>
      </select></div>
    <div class="actions">
      <button class="btn" id="pmat03-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat03-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 320");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 14,
    xlabel: "V (mL)", ylabel: "pH", series: [] });

  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat03-measures"></div>`;
  container.appendChild(measures);

  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat03-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat03-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat03-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(V, color, VE) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // support + burette
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "8", height: "280", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "120", height: "8", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "150", y: "30", width: "26", height: "190", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    const fill = Math.max(0, 190 * (1 - V / 25));
    svg.appendChild(mk("rect", { x: "152", y: "32", width: "22", height: fill, fill: "#90CAF9", opacity: "0.6" }));
    svg.appendChild(mk("path", { d: `M152 ${32 + fill} Q163 ${36 + fill} 174 ${32 + fill}`, stroke: "#0D47A1", "stroke-width": "2", fill: "none" }));
    svg.appendChild(mk("rect", { x: "157", y: "220", width: "12", height: "12", fill: "#546E7A" }));
    // bécher avec couleur indicateur
    svg.appendChild(mk("rect", { x: "120", y: "250", width: "90", height: "60", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "122", y: "270", width: "86", height: "38", fill: color, opacity: "0.7" }));
    // agitateur
    svg.appendChild(mk("rect", { x: "100", y: "312", width: "130", height: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1" }));
    // étiquettes
    svg.appendChild(mk("text", { x: "163", y: "18", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "burette"));
    svg.appendChild(mk("text", { x: "165", y: "340", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "bécher + indicateur"));
    // indicateur coloré
    svg.appendChild(mk("text", { x: "400", y: "100", fill: "#1565C0", "font-size": "16", "font-weight": "bold" }, INDICATEURS[state.indicator].label));
    svg.appendChild(mk("rect", { x: "400", y: "120", width: "140", height: "40", rx: "6", fill: color, stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "470", y: "180", "text-anchor": "middle", fill: "#455A64", "font-size": "12" }, "couleur observée"));
    // équivalence
    svg.appendChild(mk("text", { x: "470", y: "220", "text-anchor": "middle", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "V_E = " + VE.toFixed(2) + " mL"));
  }

  function runMeasurement() {
    state.indicator = document.getElementById("pmat03-ind").value;
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const Vmax = VE * 1.8;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const V = Vmax * i / 40;
      pts.push({ x: V, y: pHExact(state.Ca, state.Va, state.Cb, V) });
    }
    const pHatVE = pHExact(state.Ca, state.Va, state.Cb, VE);
    const color = colorAt(pHatVE, state.indicator);
    graph.setSeries([{ points: pts, color: "#1565C0", width: 2 },
      { points: [{ x: VE, y: 0 }, { x: VE, y: 14 }], color: "#F57C00", width: 1, dash: [4, 4] }]);
    graph.setBounds({ xmin: 0, xmax: Vmax, ymin: 0, ymax: 14 });
    drawSchema(VE, color, VE);
    const grid = document.getElementById("pmat03-measures");
    grid.innerHTML = "";
    [
      { label: "V_E", value: VE.toFixed(2), unit: "mL" },
      { label: "pH à V_E", value: pHatVE.toFixed(2), unit: "" },
      { label: "Indicateur", value: INDICATEURS[state.indicator].label, unit: "" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    const result = document.getElementById("pmat03-result");
    result.innerHTML = `<div class="measure-card" style="text-align:left">
      <div class="measure-label">Volume équivalent</div>
      <div class="measure-value" style="font-size:28px">${VE.toFixed(2)} mL</div>
    </div>`;
    const steps = document.getElementById("pmat03-steps");
    steps.innerHTML = "";
    [
      { title: "Réaction support", body: `CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O` },
      { title: "Relation à l'équivalence", body: `<span class="step-formula">C_a · V_a = C_b · V_E</span>` },
      { title: "Calcul", body: `<span class="step-formula">V_E = (${state.Ca.toFixed(3)} × ${state.Va.toFixed(2)}) / ${state.Cb.toFixed(3)} = ${VE.toFixed(2)} mL</span>` },
      { title: "Virage de l'indicateur", body: `${INDICATEURS[state.indicator].label} vire entre pH ${INDICATEURS[state.indicator].low} et ${INDICATEURS[state.indicator].high}. À V_E, pH = ${pHatVE.toFixed(2)} : le virage est ${pHatVE >= INDICATEURS[state.indicator].low && pHatVE <= INDICATEURS[state.indicator].high ? "observé" : "non observé"} à l'équivalence.` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  document.getElementById("pmat03-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat03-rand").addEventListener("click", () => {
    state.Ca = Number((0.020 + rng() * 0.180).toFixed(3));
    state.Cb = Number((0.020 + rng() * 0.180).toFixed(3));
    const inds = ["helianthine", "bbt", "phenolphtaleine"];
    document.getElementById("pmat03-ind").value = inds[Math.floor(rng() * 3)];
    runMeasurement();
  });
  document.getElementById("pmat03-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat03-steps");
    const btn = document.getElementById("pmat03-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  runMeasurement();
  return function cleanup() { graph.destroy(); };
}
