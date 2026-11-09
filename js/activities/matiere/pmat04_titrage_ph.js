import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise, roundToResolution } from "../../measure.js";

const KA_ACETIC = 10 ** -4.75;
const KE = 1.0e-14;

export function pHExact(Ca, Va, Cb, Vb) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 7;
  const cNa = Cb * Vb / Vtot;
  const cAtot = Ca * Va / Vtot;
  const f = h => cNa + h - KE / h - cAtot * KA_ACETIC / (KA_ACETIC + h);
  let lo = 1e-14, hi = 1.0;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) {
    let prev = lo, fprev = flo;
    for (let i = 1; i <= 200; i++) {
      const x = lo * Math.pow(hi / lo, i / 200);
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; fhi = fx; break; }
      prev = x; fprev = fx;
    }
  }
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

export function findEquivalence(Ca, Va, Cb) { return Ca * Va / Cb; }

export const id = "pmat04";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat04.title";

export function mount(container) {
  const state = {
    Ca: 0.070, Va: 10.0, Cb: 0.050,
    seed: Date.now() & 0xffffff,
    measurements: [],
    showSteps: false,
    validated: false
  };
  const rng = makeRng(state.seed);

  // --- Carte de choix (1 seule grandeur pour l'élève) ---
  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmat04-ca">${t("pmat04.input.cacid")}</label>
      <input id="pmat04-ca" type="range" min="0.020" max="0.200" step="0.001" value="${state.Ca}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,020</span><span id="pmat04-ca-val">${state.Ca.toFixed(3)} mol/L</span><span>0,200</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn" id="pmat04-run">${t("ui.measure")}</button>
      <button class="btn-secondary" id="pmat04-rand">${t("ui.randomize")}</button>
    </div>`;
  container.appendChild(choice);

  // --- Schéma SVG complet (burette, bécher, agitateur, pH-mètre) ---
  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 360");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", t("ui.experience"));
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  // --- Mesures (cartes) ---
  const measures = document.createElement("div");
  measures.className = "panel";
  measures.innerHTML = `<div class="panel-title">${t("ui.measure")}</div>
    <div class="measure-grid" id="pmat04-measures"></div>`;
  container.appendChild(measures);

  // --- Graphe pH = f(V) ---
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 14,
    xlabel: "V (mL)", ylabel: "pH", series: [] });

  // --- Résultat + démarche ---
  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `<div class="panel-title">${t("ui.result")}</div>
    <div id="pmat04-result"></div>
    <div class="actions" style="margin-top:10px">
      <button class="btn-secondary" id="pmat04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  function drawSchema(pH, V) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // support + pince
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "8", height: "300", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "120", height: "8", fill: "#78909C" }));
    // burette graduée
    svg.appendChild(mk("rect", { x: "150", y: "30", width: "26", height: "200", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    const fill = Math.max(0, 200 * (1 - V / 25));
    svg.appendChild(mk("rect", { x: "152", y: "32", width: "22", height: fill, fill: "#90CAF9", opacity: "0.6" }));
    for (let i = 1; i < 10; i++) {
      svg.appendChild(mk("line", { x1: "162", y1: 32 + i * 20, x2: "176", y2: 32 + i * 20, stroke: "#455A64", "stroke-width": "1" }));
    }
    // ménisque
    svg.appendChild(mk("path", { d: `M152 ${32 + fill} Q163 ${36 + fill} 174 ${32 + fill}`, stroke: "#0D47A1", "stroke-width": "2", fill: "none" }));
    // robinet
    svg.appendChild(mk("rect", { x: "157", y: "230", width: "12", height: "14", fill: "#546E7A" }));
    // goutte
    if (V > 0 && V < 25) svg.appendChild(mk("circle", { cx: "163", cy: "255", r: "3", fill: "#90CAF9" }));
    // bécher gradué
    svg.appendChild(mk("rect", { x: "120", y: "260", width: "90", height: "70", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "122", y: "290", width: "86", height: "38", fill: "#90CAF9", opacity: "0.5" }));
    for (let i = 1; i < 5; i++) {
      svg.appendChild(mk("line", { x1: "120", y1: 260 + i * 14, x2: "132", y2: 260 + i * 14, stroke: "#455A64", "stroke-width": "0.8" }));
    }
    // agitateur + barreau
    svg.appendChild(mk("rect", { x: "100", y: "332", width: "130", height: "12", rx: "3", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1.5" }));
    svg.appendChild(mk("rect", { x: "150", y: "318", width: "30", height: "6", rx: "2", fill: "#37474F" }));
    // pH-mètre
    svg.appendChild(mk("rect", { x: "400", y: "40", width: "180", height: "90", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "412", y: "52", width: "156", height: "50", rx: "4", fill: "#263238" }));
    svg.appendChild(mk("text", { x: "490", y: "86", "text-anchor": "middle", fill: "#00E676", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "pH = " + pH.toFixed(2)));
    svg.appendChild(mk("text", { x: "490", y: "118", "text-anchor": "middle", fill: "#78909C", "font-size": "11" }, "pH-mètre étalonné"));
    // sonde
    svg.appendChild(mk("line", { x1: "420", y1: "130", x2: "200", y2: "290", stroke: "#455A64", "stroke-width": "3" }));
    svg.appendChild(mk("circle", { cx: "200", cy: "290", r: "7", fill: "#90A4AE", stroke: "#455A64" }));
    // étiquettes
    svg.appendChild(mk("text", { x: "163", y: "18", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "burette 25 mL"));
    svg.appendChild(mk("text", { x: "165", y: "350", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "agitateur magnétique"));
    // volume versé
    svg.appendChild(mk("text", { x: "600", y: "200", "text-anchor": "end", fill: "#1565C0", "font-size": "13", "font-weight": "bold" }, "V = " + V.toFixed(2) + " mL"));
  }

  function runMeasurement() {
    const Ca = parseFloat(document.getElementById("pmat04-ca").value);
    state.Ca = Ca;
    document.getElementById("pmat04-ca-val").textContent = Ca.toFixed(3) + " mol/L";
    const VE = findEquivalence(Ca, state.Va, state.Cb);
    // Mesures réelles avec bruit capteur pH (résolution 0,01)
    const pts = [];
    const n = 25;
    const Vmax = Math.max(VE * 1.6, 5);
    for (let i = 0; i <= n; i++) {
      const V = Vmax * i / n;
      const pHtrue = pHExact(Ca, state.Va, state.Cb, V);
      const pHmeas = roundToResolution(addNoise(pHtrue, 0.01, rng, 1), 0.01);
      pts.push({ V, pH: pHmeas });
    }
    state.measurements = pts;
    // cartes de mesures
    const grid = document.getElementById("pmat04-measures");
    grid.innerHTML = "";
    const last = pts[pts.length - 1];
    [
      { label: "V versé", value: last.V.toFixed(2), unit: "mL" },
      { label: "pH mesuré", value: last.pH.toFixed(2), unit: "" },
      { label: "V_E attendu", value: VE.toFixed(2), unit: "mL" }
    ].forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value">${m.value}</div>
        <div class="measure-unit">${m.unit}</div>`;
      grid.appendChild(card);
    });
    // graphe
    const curve = pts.map(p => ({ x: p.V, y: p.pH }));
    graph.setSeries([{ points: curve, color: "#1565C0", width: 2 }]);
    graph.setBounds({ xmin: 0, xmax: Vmax, ymin: 0, ymax: 14 });
    // schéma
    drawSchema(last.pH, last.V);
    // résultat + démarche
    renderResult(VE, Ca);
  }

  function renderResult(VE, Ca) {
    const result = document.getElementById("pmat04-result");
    result.innerHTML = `
      <div class="measure-card" style="text-align:left">
        <div class="measure-label">${t("pmat04.answer.ve")}</div>
        <div class="measure-value" style="font-size:28px">${VE.toFixed(2)} mL</div>
      </div>`;
    const steps = document.getElementById("pmat04-steps");
    steps.innerHTML = "";
    const stepData = [
      { title: "Réaction support", body: `CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O` },
      { title: "Relation à l'équivalence", body: `n(acide) = n(base), soit <span class="step-formula">C_a · V_a = C_b · V_E</span>` },
      { title: "Données du problème", body: `C_a = ${Ca.toFixed(3)} mol/L · V_a = ${state.Va.toFixed(2)} mL · C_b = ${state.Cb.toFixed(3)} mol/L` },
      { title: "Calcul", body: `<span class="step-formula">V_E = (C_a · V_a) / C_b = (${Ca.toFixed(3)} × ${state.Va.toFixed(2)}) / ${state.Cb.toFixed(3)} = ${VE.toFixed(2)} mL</span>` },
      { title: "Interprétation", body: `À V = ${VE.toFixed(2)} mL, la courbe pH présente un saut brutal : c'est le volume équivalent.` }
    ];
    stepData.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  // Events
  document.getElementById("pmat04-ca").addEventListener("input", (e) => {
    document.getElementById("pmat04-ca-val").textContent = parseFloat(e.target.value).toFixed(3) + " mol/L";
  });
  document.getElementById("pmat04-run").addEventListener("click", runMeasurement);
  document.getElementById("pmat04-rand").addEventListener("click", () => {
    const v = Number((0.020 + rng() * 0.180).toFixed(3));
    document.getElementById("pmat04-ca").value = v;
    document.getElementById("pmat04-ca-val").textContent = v.toFixed(3) + " mol/L";
    runMeasurement();
  });
  document.getElementById("pmat04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat04-steps");
    const btn = document.getElementById("pmat04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });

  // Lancer une première mesure avec la valeur par défaut
  runMeasurement();

  return function cleanup() { graph.destroy(); };
}
