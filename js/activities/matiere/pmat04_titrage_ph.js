import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { makeRng, addNoise, roundToResolution } from "../../measure.js";

const KA = 10 ** -4.75;
const KE = 1e-14;

export function pHExact(Ca, Va, Cb, Vb) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 7;
  const cNa = Cb * Vb / Vtot;
  const cAtot = Ca * Va / Vtot;
  const f = h => cNa + h - KE / h - cAtot * KA / (KA + h);
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
export const domain = "chimie";
export const theme = "suivi";
export const titleKey = "pmat04.title";

export function mount(container) {
  const state = {
    Ca: 0.070, Va: 10.0, Cb: 0.050,
    V: 0,
    tapOpen: false,
    measurements: [],
    seed: Date.now() & 0xffffff,
    finished: false,
    showSteps: false
  };
  const rng = makeRng(state.seed);

  // ===== CHOIX ÉLÈVE =====
  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmat04-ca">${t("pmat04.input.cacid")}</label>
      <input id="pmat04-ca" type="range" min="0.020" max="0.200" step="0.001" value="${state.Ca}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,020 mol/L</span><span id="pmat04-ca-val">${state.Ca.toFixed(3)} mol/L</span><span>0,200 mol/L</span>
      </div>
    </div>
    <div class="field">
      <label for="pmat04-va">${t("pmat04.input.vacid")}</label>
      <input id="pmat04-va" type="range" min="5" max="25" step="0.5" value="${state.Va}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>5,0 mL</span><span id="pmat04-va-val">${state.Va.toFixed(1)} mL</span><span>25,0 mL</span>
      </div>
    </div>
    <div class="field">
      <label for="pmat04-cb">${t("pmat04.input.cbase")}</label>
      <input id="pmat04-cb" type="range" min="0.020" max="0.200" step="0.001" value="${state.Cb}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>0,020 mol/L</span><span id="pmat04-cb-val">${state.Cb.toFixed(3)} mol/L</span><span>0,200 mol/L</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn-secondary" id="pmat04-rand">${t("ui.randomize")}</button>
      <button class="btn-secondary" id="pmat04-reset">${t("pmat04.reset")}</button>
    </div>`;
  container.appendChild(choice);

  // ===== SCHÉMA SVG =====
  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 380");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  // ===== CONTRÔLES BURETTE =====
  const controls = document.createElement("div");
  controls.className = "panel";
  controls.innerHTML = `
    <div class="panel-title">${t("pmat04.robinet")}</div>
    <div class="actions">
      <button class="btn-tap" id="pmat04-tap">${t("pmat04.open")}</button>
      <button class="btn-secondary" id="pmat04-drop">${t("pmat04.addDrop")}</button>
      <button class="btn-secondary" id="pmat04-add1">${t("pmat04.add1mL")}</button>
      <button class="btn-secondary" id="pmat04-add5">${t("pmat04.add5mL")}</button>
    </div>`;
  container.appendChild(controls);

  // ===== GRAPHE =====
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 14,
    xlabel: "V (mL)", ylabel: "pH", series: [] });

  // ===== TABLEAU =====
  const tablePanel = document.createElement("div");
  tablePanel.className = "panel";
  tablePanel.innerHTML = `
    <div class="panel-title">${t("pmat04.table.title")}</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>${t("pmat04.table.volume")}</th>
          <th>${t("pmat04.table.pH")}</th>
        </tr></thead>
        <tbody id="pmat04-tbody"></tbody>
      </table>
    </div>
    <div id="pmat04-table-empty" style="color:var(--muted);font-size:13px;margin-top:8px;">${t("pmat04.table.empty")}</div>
    <div class="actions" style="margin-top:12px">
      <button class="btn" id="pmat04-print">${t("pmat04.print")}</button>
    </div>`;
  container.appendChild(tablePanel);

  // ===== RÉSULTAT =====
  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `
    <div class="panel-title">${t("ui.result")}</div>
    <div class="summary-grid" id="pmat04-summary"></div>
    <div id="pmat04-tangent-msg" style="margin-top:12px;font-weight:700;color:var(--ok);display:none;">${t("pmat04.finished")}</div>
    <div class="actions" style="margin-top:12px">
      <button class="btn-secondary" id="pmat04-steps-btn">${t("ui.showSteps")}</button>
    </div>
    <div id="pmat04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  // ===== FONCTIONS =====
  function readInputs() {
    state.Ca = parseFloat(document.getElementById("pmat04-ca").value);
    state.Va = parseFloat(document.getElementById("pmat04-va").value);
    state.Cb = parseFloat(document.getElementById("pmat04-cb").value);
    document.getElementById("pmat04-ca-val").textContent = state.Ca.toFixed(3) + " mol/L";
    document.getElementById("pmat04-va-val").textContent = state.Va.toFixed(1) + " mL";
    document.getElementById("pmat04-cb-val").textContent = state.Cb.toFixed(3) + " mol/L";
  }

  function drawSchema() {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const e = document.createElementNS(ns, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };
    // support
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "8", height: "320", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "80", y: "20", width: "120", height: "8", fill: "#78909C" }));
    // burette
    svg.appendChild(mk("rect", { x: "150", y: "30", width: "26", height: "220", rx: "4", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    const fill = Math.max(0, 220 * (1 - state.V / 25));
    svg.appendChild(mk("rect", { x: "152", y: "32", width: "22", height: fill, fill: "#90CAF9", opacity: "0.6" }));
    for (let i = 1; i < 10; i++) {
      svg.appendChild(mk("line", { x1: "162", y1: 32 + i * 22, x2: "176", y2: 32 + i * 22, stroke: "#455A64", "stroke-width": "1" }));
    }
    // ménisque
    svg.appendChild(mk("path", { d: `M152 ${32 + fill} Q163 ${36 + fill} 174 ${32 + fill}`, stroke: "#0D47A1", "stroke-width": "2", fill: "none" }));
    // robinet (visible : ouvert = vert, fermé = rouge)
    svg.appendChild(mk("rect", { x: "157", y: "250", width: "12", height: "14", fill: state.tapOpen ? "#2E7D32" : "#C62828" }));
    svg.appendChild(mk("text", { x: "200", y: "262", fill: "#455A64", "font-size": "11" }, state.tapOpen ? "ouvert" : "fermé"));
    // gouttes si robinet ouvert
    if (state.tapOpen) {
      const last = state.measurements[state.measurements.length - 1];
      if (last) svg.appendChild(mk("circle", { cx: "163", cy: "285", r: "3", fill: "#90CAF9" }));
    }
    // bécher
    svg.appendChild(mk("rect", { x: "120", y: "290", width: "90", height: "70", rx: "6", fill: "#fff", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "122", y: "315", width: "86", height: "43", fill: "#90CAF9", opacity: "0.5" }));
    for (let i = 1; i < 5; i++) {
      svg.appendChild(mk("line", { x1: "120", y1: 290 + i * 14, x2: "132", y2: 290 + i * 14, stroke: "#455A64", "stroke-width": "0.8" }));
    }
    // agitateur
    svg.appendChild(mk("rect", { x: "100", y: "362", width: "130", height: "10", rx: "3", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1.5" }));
    svg.appendChild(mk("rect", { x: "150", y: "348", width: "30", height: "6", rx: "2", fill: "#37474F" }));
    // pH-mètre
    svg.appendChild(mk("rect", { x: "400", y: "40", width: "180", height: "90", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "412", y: "52", width: "156", height: "50", rx: "4", fill: "#263238" }));
    const last = state.measurements[state.measurements.length - 1];
    const pHshow = last ? last.pH : pHExact(state.Ca, state.Va, state.Cb, 0);
    svg.appendChild(mk("text", { x: "490", y: "86", "text-anchor": "middle", fill: "#00E676", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "pH = " + pHshow.toFixed(2)));
    // sonde
    svg.appendChild(mk("line", { x1: "420", y1: "130", x2: "200", y2: "325", stroke: "#455A64", "stroke-width": "3" }));
    svg.appendChild(mk("circle", { cx: "200", cy: "325", r: "7", fill: "#90A4AE", stroke: "#455A64" }));
    // étiquettes
    svg.appendChild(mk("text", { x: "163", y: "18", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "burette 25 mL"));
    svg.appendChild(mk("text", { x: "165", y: "378", "text-anchor": "middle", fill: "#455A64", "font-size": "11" }, "agitateur magnétique"));
    // volume versé
    svg.appendChild(mk("text", { x: "620", y: "200", "text-anchor": "end", fill: "#1565C0", "font-size": "14", "font-weight": "bold" }, "V versé = " + state.V.toFixed(2) + " mL"));
  }

  function redrawGraph() {
    const pts = state.measurements.map(m => ({ x: m.V, y: m.pH }));
    const series = [{ points: pts, color: "#1565C0", width: 2 }];
    // méthode des tangentes si terminé
    if (state.finished && pts.length > 3) {
      const VE = findEquivalence(state.Ca, state.Va, state.Cb);
      // tangente avant : au point V = VE/2 (approximation)
      const Vhalf = VE / 2;
      const pHhalf = pHExact(state.Ca, state.Va, state.Cb, Vhalf);
      // tangente après : au point V = VE + (VE/2)
      const Vafter = VE + VE / 2;
      const pHafter = pHExact(state.Ca, state.Va, state.Cb, Vafter);
      // pente approximative par différence finie
      const dV = 0.5;
      const slopeBefore = (pHExact(state.Ca, state.Va, state.Cb, Vhalf + dV) - pHExact(state.Ca, state.Va, state.Cb, Vhalf - dV)) / (2 * dV);
      const slopeAfter = (pHExact(state.Ca, state.Va, state.Cb, Vafter + dV) - pHExact(state.Ca, state.Va, state.Cb, Vafter - dV)) / (2 * dV);
      // tangentes tracées sur ±5 mL autour des points
      const t1 = [
        { x: Vhalf - 5, y: pHhalf - 5 * slopeBefore },
        { x: Vhalf + 5, y: pHhalf + 5 * slopeBefore }
      ];
      const t2 = [
        { x: Vafter - 5, y: pHafter - 5 * slopeAfter },
        { x: Vafter + 5, y: pHafter + 5 * slopeAfter }
      ];
      series.push({ points: t1, color: "#F57C00", width: 1.5, dash: [5, 3] });
      series.push({ points: t2, color: "#F57C00", width: 1.5, dash: [5, 3] });
      series.push({ points: [{ x: VE, y: 0 }, { x: VE, y: 14 }], color: "#C62828", width: 1.5, dash: [3, 3] });
    }
    graph.setSeries(series);
    const Vmax = Math.max(15, ...state.measurements.map(m => m.V) * 1.1);
    graph.setBounds({ xmin: 0, xmax: Vmax, ymin: 0, ymax: 14 });
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat04-tbody");
    tbody.innerHTML = "";
    state.measurements.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${m.V.toFixed(2)}</td><td>${m.pH.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById("pmat04-table-empty").style.display = state.measurements.length ? "none" : "block";
  }

  function redrawResult() {
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    // concentration trouvée par l'élève : C_a = C_b × V_E / V_a
    const last = state.measurements[state.measurements.length - 1];
    const summary = document.getElementById("pmat04-summary");
    summary.innerHTML = "";
    const items = [
      { label: t("pmat04.answer.ve"), value: VE.toFixed(2) + " mL" },
      { label: t("pmat04.answer.conc"), value: state.Ca.toFixed(3) + " mol/L" },
      { label: "pH à V_E", value: pHExact(state.Ca, state.Va, state.Cb, VE).toFixed(2) }
    ];
    items.forEach(m => {
      const card = document.createElement("div");
      card.className = "measure-card";
      card.innerHTML = `<div class="measure-label">${m.label}</div>
        <div class="measure-value" style="font-size:18px">${m.value}</div>`;
      summary.appendChild(card);
    });
    // démarche
    const steps = document.getElementById("pmat04-steps");
    steps.innerHTML = "";
    [
      { title: "Réaction support", body: `CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O` },
      { title: "Relation à l'équivalence", body: `<span class="step-formula">n(acide) = n(base) → C_a · V_a = C_b · V_E</span>` },
      { title: "Données", body: `C_b = ${state.Cb.toFixed(3)} mol/L · V_a = ${state.Va.toFixed(1)} mL` },
      { title: "Volume équivalent (tangentes)", body: `V_E = <span class="highlight">${VE.toFixed(2)} mL</span>` },
      { title: "Calcul de C_a", body: `<span class="step-formula">C_a = C_b · V_E / V_a = ${state.Cb.toFixed(3)} × ${VE.toFixed(2)} / ${state.Va.toFixed(1)} = ${state.Ca.toFixed(3)} mol/L</span>` }
    ].forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "step";
      div.innerHTML = `<div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${s.title}</strong><br>${s.body}</div>`;
      steps.appendChild(div);
    });
  }

  function addMeasurement(dV) {
    if (state.V >= 25) return;
    const newV = Math.min(25, state.V + dV);
    state.V = newV;
    const pHtrue = pHExact(state.Ca, state.Va, state.Cb, state.V);
    const pHmeas = roundToResolution(addNoise(pHtrue, 0.01, rng, 1), 0.01);
    state.measurements.push({ V: state.V, pH: pHmeas });
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    if (state.V >= VE * 1.5) state.finished = true;
    drawSchema();
    redrawGraph();
    redrawTable();
    redrawResult();
    if (state.finished) {
      document.getElementById("pmat04-tangent-msg").style.display = "block";
    }
  }

  function resetAll() {
    state.V = 0;
    state.measurements = [];
    state.finished = false;
    state.tapOpen = false;
    document.getElementById("pmat04-tangent-msg").style.display = "none";
    document.getElementById("pmat04-tap").textContent = t("pmat04.open");
    document.getElementById("pmat04-tap").classList.remove("active");
    drawSchema();
    redrawGraph();
    redrawTable();
    redrawResult();
  }

  function randomize() {
    state.Ca = Number((0.020 + rng() * 0.180).toFixed(3));
    state.Va = Number((5 + rng() * 20).toFixed(1));
    state.Cb = Number((0.020 + rng() * 0.180).toFixed(3));
    document.getElementById("pmat04-ca").value = state.Ca;
    document.getElementById("pmat04-va").value = state.Va;
    document.getElementById("pmat04-cb").value = state.Cb;
    readInputs();
    resetAll();
  }

  // ===== ÉVÉNEMENTS =====
  ["pmat04-ca", "pmat04-va", "pmat04-cb"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      readInputs();
      resetAll();
    });
  });
  document.getElementById("pmat04-rand").addEventListener("click", randomize);
  document.getElementById("pmat04-reset").addEventListener("click", resetAll);
  document.getElementById("pmat04-tap").addEventListener("click", () => {
    state.tapOpen = !state.tapOpen;
    const btn = document.getElementById("pmat04-tap");
    btn.textContent = state.tapOpen ? t("pmat04.close") : t("pmat04.open");
    btn.classList.toggle("active", state.tapOpen);
    drawSchema();
  });
  document.getElementById("pmat04-drop").addEventListener("click", () => addMeasurement(0.05));
  document.getElementById("pmat04-add1").addEventListener("click", () => addMeasurement(1));
  document.getElementById("pmat04-add5").addEventListener("click", () => addMeasurement(5));
  document.getElementById("pmat04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat04-steps");
    const btn = document.getElementById("pmat04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = t("ui.hideSteps"); }
    else { s.style.display = "none"; btn.textContent = t("ui.showSteps"); }
  });
  document.getElementById("pmat04-print").addEventListener("click", () => {
    // Crée une fenêtre d'impression avec la courbe + tableau
    const w = window.open("", "_blank");
    if (!w) return;
    const doc = w.document;
    doc.open();
    doc.write("<!doctype html><html><head><meta charset='utf-8'><title>Titrage pH-métrique</title>");
    doc.write("<style>body{font-family:system-ui,sans-serif;margin:2em;color:#222}h1{color:#1565C0}table{border-collapse:collapse;width:60%;margin-top:1em}th,td{border:1px solid #ccc;padding:6px;text-align:center}th{background:#E3F2FD}.info{margin:1em 0}</style>");
    doc.write("</head><body>");
    doc.write("<h1>Compte rendu — Titrage pH-métrique</h1>");
    doc.write("<div class='info'><strong>C_a = " + state.Ca.toFixed(3) + " mol/L · V_a = " + state.Va.toFixed(1) + " mL · C_b = " + state.Cb.toFixed(3) + " mol/L</strong></div>");
    doc.write("<div class='info'>V_E = " + findEquivalence(state.Ca, state.Va, state.Cb).toFixed(2) + " mL</div>");
    // graphique
    const dataURL = canvas.toDataURL("image/png");
    doc.write("<h2>Courbe pH = f(V)</h2>");
    doc.write("<img src='" + dataURL + "' style='max-width:100%;border:1px solid #ccc;border-radius:8px'>");
    // tableau
    doc.write("<h2>Tableau de valeurs</h2>");
    doc.write("<table><tr><th>V versé (mL)</th><th>pH</th></tr>");
    state.measurements.forEach(m => {
      doc.write("<tr><td>" + m.V.toFixed(2) + "</td><td>" + m.pH.toFixed(2) + "</td></tr>");
    });
    doc.write("</table>");
    doc.write("</body></html>");
    doc.close();
    w.print();
  });

  // ===== INITIALISATION =====
  readInputs();
  drawSchema();
  redrawGraph();
  redrawTable();
  redrawResult();

  return function cleanup() { graph.destroy(); };
}
