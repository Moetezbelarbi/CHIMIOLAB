import { t } from "../i18n.js";
import { Graph } from "../graph.js";
import { makeRng, addNoise, roundToResolution } from "../measure.js";

const KE = 1e-14;

const EXEMPLES = {
  acetique: { label: "Acide acétique (vinaigre)", Ca: 0.070, Ka: 10 ** -4.75 },
  chlorhydrique: { label: "Acide chlorhydrique (fort)", Ca: 0.050, Ka: 1e6 },
  lactique: { label: "Acide lactique", Ca: 0.050, Ka: 10 ** -3.86 }
};

export function pHExact(Ca, Va, Cb, Vb, Ka) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 7;
  const cNa = Cb * Vb / Vtot;
  const cAtot = Ca * Va / Vtot;
  const f = h => cNa + h - KE / h - cAtot * Ka / (Ka + h);
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
    exempleKey: "acetique",
    Ca: 0.070, Ka: 10 ** -4.75,
    Va: 10.0, Cb: 0.100,
    V: 0,
    tapOpen: false,
    measurements: [],
    seed: Date.now() & 0xffffff,
    finished: false,
    interval: null,
    indicator: "none" // "none" | "phenolphtaleine" | "bbt"
  };
  const rng = makeRng(state.seed);

  // ===== CHOIX ÉLÈVE =====
  const choice = document.createElement("div");
  choice.className = "panel";
  choice.innerHTML = `
    <div class="panel-title">${t("ui.yourChoice")}</div>
    <div class="field">
      <label for="pmat04-exemple">Exemple de titrage</label>
      <select id="pmat04-exemple">
        ${Object.entries(EXEMPLES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <label>Volume de solution titrée</label>
      <div style="display:flex; gap:15px;">
        <label><input type="radio" name="pmat04-va" value="10" checked> 10 mL</label>
        <label><input type="radio" name="pmat04-va" value="20"> 20 mL</label>
      </div>
    </div>
    <div class="field">
      <label for="pmat04-cb">${t("pmat04.input.cbase")} (mol/L)</label>
      <input id="pmat04-cb" type="number" step="0.001" min="0.010" max="0.500" value="${state.Cb}">
    </div>
    <div class="field">
      <label for="pmat04-ind">Indicateur coloré (optionnel)</label>
      <select id="pmat04-ind">
        <option value="none">Aucun (pH-métrie seule)</option>
        <option value="phenolphtaleine">Phénolphtaléine (virage à pH 8,2 - 10)</option>
        <option value="bbt">BBT (virage à pH 6,0 - 7,6)</option>
      </select>
    </div>
    <div class="actions">
      <button class="btn-secondary" id="pmat04-reset">Recommencer</button>
    </div>`;
  container.appendChild(choice);

  // ===== SCHÉMA SVG =====
  const svgWrap = document.createElement("div");
  svgWrap.className = "svg-wrap";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 420");
  svg.setAttribute("width", "100%");
  svg.setAttribute("role", "img");
  svgWrap.appendChild(svg);
  container.appendChild(svgWrap);

  // ===== CONTRÔLES =====
  const controls = document.createElement("div");
  controls.className = "panel";
  controls.innerHTML = `
    <div class="panel-title">Contrôle du versement</div>
    <div class="actions">
      <button class="btn" id="pmat04-drop">Verser une goutte</button>
      <button class="btn" id="pmat04-add1">Verser 1 mL</button>
      <button class="btn-secondary" id="pmat04-tap">Ouvrir le robinet</button>
      <button class="btn" id="pmat04-finish" style="background:#F57C00; margin-left:auto;">Terminer et tracer les tangentes</button>
    </div>`;
  container.appendChild(controls);

  // ===== TABLEAU =====
  const tablePanel = document.createElement("div");
  tablePanel.className = "panel";
  tablePanel.innerHTML = `
    <div class="panel-title">${t("pmat04.table.title")}</div>
    <div class="table-wrap" id="pmat04-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>${t("pmat04.table.volume")}</th>
          <th>${t("pmat04.table.pH")}</th>
          <th>${t("pmat04.table.deriv")}</th>
        </tr></thead>
        <tbody id="pmat04-tbody"></tbody>
      </table>
    </div>
    <div id="pmat04-table-empty" style="color:var(--muted);font-size:13px;margin-top:8px;">${t("pmat04.table.empty")}</div>
    <div class="actions" style="margin-top:12px">
      <button class="btn" id="pmat04-print">${t("pmat04.print")}</button>
    </div>`;
  container.appendChild(tablePanel);

  // ===== GRAPHE =====
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const graph = new Graph(canvas, { xmin: 0, xmax: 25, ymin: 0, ymax: 14,
    xlabel: "V (mL)", ylabel: "pH", series: [] });

  // ===== RÉSULTAT & DÉMARCHE =====
  const resultPanel = document.createElement("div");
  resultPanel.className = "panel";
  resultPanel.innerHTML = `
    <div class="panel-title">${t("ui.result")} & ${t("ui.showSteps")}</div>
    <div class="actions">
      <button class="btn-secondary" id="pmat04-steps-btn">Afficher la démarche complète</button>
    </div>
    <div id="pmat04-steps" class="steps" style="display:none"></div>`;
  container.appendChild(resultPanel);

  // ===== FONCTIONS =====
  function readInputs() {
    state.exempleKey = document.getElementById("pmat04-exemple").value;
    state.Ca = EXEMPLES[state.exempleKey].Ca;
    state.Ka = EXEMPLES[state.exempleKey].Ka;
    state.indicator = document.getElementById("pmat04-ind").value;
    
    const vas = document.getElementsByName("pmat04-va");
    for (let r of vas) { if (r.checked) state.Va = parseFloat(r.value); }
    
    const cbVal = parseFloat(document.getElementById("pmat04-cb").value);
    if (isFinite(cbVal) && cbVal > 0) state.Cb = cbVal;
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

    // Support
    svg.appendChild(mk("rect", { x: "60", y: "390", width: "120", height: "15", rx: "5", fill: "#607D8B" }));
    svg.appendChild(mk("rect", { x: "110", y: "20", width: "10", height: "370", fill: "#78909C" }));
    svg.appendChild(mk("rect", { x: "100", y: "80", width: "20", height: "12", fill: "#546E7A" }));
    svg.appendChild(mk("rect", { x: "120", y: "70", width: "20", height: "32", fill: "#455A64" }));

    // Burette
    svg.appendChild(mk("rect", { x: "180", y: "30", width: "20", height: "250", rx: "3", fill: "rgba(255,255,255,0.9)", stroke: "#455A64", "stroke-width": "2" }));
    
    // Robinet
    const tapColor = state.tapOpen ? "#2E7D32" : "#C62828";
    const tapGroup = mk("g", { style: "cursor: pointer;" });
    tapGroup.addEventListener("click", toggleTap);
    tapGroup.appendChild(mk("rect", { x: "185", y: "280", width: "10", height: "12", fill: "#78909C" }));
    tapGroup.appendChild(mk("rect", { x: state.tapOpen ? "175" : "190", y: "282", width: "12", height: "8", fill: tapColor, rx: "2" }));
    tapGroup.appendChild(mk("rect", { x: "188", y: "292", width: "4", height: "10", fill: "#90A4AE" }));
    svg.appendChild(tapGroup);
    
    // Graduations (0 en haut, 25 en bas)
    for (let i = 0; i <= 10; i++) {
      const y = 40 + (230 * i / 10);
      const w = (i % 5 === 0) ? 10 : 5;
      svg.appendChild(mk("line", { x1: "180", y1: y, x2: 180 + w, y2: y, stroke: "#455A64", "stroke-width": "1" }));
      if (i % 5 === 0) svg.appendChild(mk("text", { x: "165", y: y + 4, "font-size": "10", fill: "#455A64", "text-anchor": "end" }, (i * 2.5).toFixed(1)));
    }

    // Liquide
    const fillHeight = Math.max(0, 230 * (1 - state.V / 25));
    svg.appendChild(mk("rect", { x: "182", y: "40", width: "16", height: fillHeight, fill: "#90CAF9", opacity: "0.6" }));
    if (fillHeight > 5) {
      svg.appendChild(mk("path", { d: `M182 ${40 + fillHeight} Q190 ${46 + fillHeight} 198 ${40 + fillHeight}`, stroke: "#0D47A1", "stroke-width": "2", fill: "none" }));
    }

    // Erlenmeyer
    svg.appendChild(mk("path", { 
      d: "M170 360 L210 360 L210 370 L235 400 L145 400 L170 370 Z", 
      fill: "rgba(255,255,255,0.8)", stroke: "#455A64", "stroke-width": "2" 
    }));
    
    // Couleur de la solution (indicateur)
    let liquidColor = "#90CAF9";
    let liquidOpacity = 0.5;
    if (state.indicator === "phenolphtaleine") {
       const currentPH = state.measurements.length ? state.measurements[state.measurements.length-1].pH : pHExact(state.Ca, state.Va, state.Cb, 0, state.Ka);
       if (currentPH > 8.2) { liquidColor = "#E91E63"; liquidOpacity = 0.8; }
    } else if (state.indicator === "bbt") {
       const currentPH = state.measurements.length ? state.measurements[state.measurements.length-1].pH : pHExact(state.Ca, state.Va, state.Cb, 0, state.Ka);
       if (currentPH > 7.6) { liquidColor = "#1565C0"; liquidOpacity = 0.8; }
       else if (currentPH > 6.0) { liquidColor = "#8BC34A"; liquidOpacity = 0.8; }
    }
    svg.appendChild(mk("path", { 
      d: "M155 385 L225 385 L235 400 L145 400 Z", 
      fill: liquidColor, opacity: liquidOpacity 
    }));

    // Agitateur
    svg.appendChild(mk("rect", { x: "130", y: "400", width: "120", height: "12", rx: "3", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "1.5" }));
    svg.appendChild(mk("rect", { x: "180", y: "394", width: "20", height: "6", fill: "#37474F", rx: "3" }));

    // pH-mètre
    svg.appendChild(mk("rect", { x: "420", y: "40", width: "160", height: "90", rx: "8", fill: "#ECEFF1", stroke: "#455A64", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "430", y: "50", width: "140", height: "50", rx: "4", fill: "#263238" }));
    
    const last = state.measurements[state.measurements.length - 1];
    const pHshow = last ? last.pH : pHExact(state.Ca, state.Va, state.Cb, 0, state.Ka);
    svg.appendChild(mk("text", { x: "500", y: "83", "text-anchor": "middle", fill: "#00E676", "font-size": "22", "font-family": "monospace", "font-weight": "bold" }, "pH = " + pHshow.toFixed(2)));
    
    // Sonde
    svg.appendChild(mk("path", { d: "M440 130 C 380 200, 300 300, 200 385", fill: "none", stroke: "#455A64", "stroke-width": "3" }));
    svg.appendChild(mk("circle", { cx: "200", cy: "385", r: "6", fill: "#546E7A" }));

    // Volume
    svg.appendChild(mk("text", { x: "500", y: "200", "text-anchor": "middle", fill: "#1565C0", "font-size": "16", "font-weight": "bold" }, "V versé = " + state.V.toFixed(2) + " mL"));
  }

  function redrawGraph() {
    const pts = state.measurements.map(m => ({ x: m.V, y: m.pH }));
    const series = [{ points: pts, color: "#1565C0", width: 2 }];
    
    if (state.finished && pts.length > 3) {
      const VE = findEquivalence(state.Ca, state.Va, state.Cb);
      const Vhalf = VE * 0.5;
      const Vafter = VE * 1.5;
      
      const dV = 0.1;
      const slopeBefore = (pHExact(state.Ca, state.Va, state.Cb, Vhalf + dV, state.Ka) - pHExact(state.Ca, state.Va, state.Cb, Vhalf - dV, state.Ka)) / (2 * dV);
      const slopeAfter = (pHExact(state.Ca, state.Va, state.Cb, Vafter + dV, state.Ka) - pHExact(state.Ca, state.Va, state.Cb, Vafter - dV, state.Ka)) / (2 * dV);
      
      const pHhalf = pHExact(state.Ca, state.Va, state.Cb, Vhalf, state.Ka);
      const pHafter = pHExact(state.Ca, state.Va, state.Cb, Vafter, state.Ka);
      
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
    graph.setBounds({ xmin: 0, xmax: 25, ymin: 0, ymax: 14 });
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat04-tbody");
    tbody.innerHTML = "";
    state.measurements.forEach((m, i) => {
      let deriv = "";
      if (i > 0) {
        const prev = state.measurements[i - 1];
        if (m.V !== prev.V) {
          deriv = ((m.pH - prev.pH) / (m.V - prev.V)).toFixed(2);
        }
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${m.V.toFixed(2)}</td><td>${m.pH.toFixed(2)}</td><td>${deriv}</td>`;
      tbody.appendChild(tr);
    });
    
    const wrap = document.getElementById("pmat04-table-wrap");
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
    
    document.getElementById("pmat04-table-empty").style.display = state.measurements.length ? "none" : "block";
  }

  function redrawSteps() {
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const steps = document.getElementById("pmat04-steps");
    steps.innerHTML = "";
    [
      { title: "1. Réaction support", body: `L'acide réagit avec la soude (OH⁻) pour former de l'eau.` },
      { title: "2. Relation à l'équivalence", body: `<span class="step-formula">C_a · V_a = C_b · V_E</span>` },
      { title: "3. Lecture graphique", body: `La méthode des tangentes donne <strong>V_E = ${VE.toFixed(2)} mL</strong>` },
      { title: "4. Calcul de C_a", body: `<span class="step-formula">C_a = C_b · V_E / V_a = ${state.Cb.toFixed(3)} × ${VE.toFixed(2)} / ${state.Va.toFixed(1)} = ${state.Ca.toFixed(3)} mol/L</span>` }
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
    
    if (state.measurements.length === 0) {
        const pH0 = pHExact(state.Ca, state.Va, state.Cb, 0, state.Ka);
        state.measurements.push({ V: 0, pH: roundToResolution(addNoise(pH0, 0.01, rng, 1), 0.01) });
    }

    const newV = Math.min(25, state.V + dV);
    state.V = newV;
    const pHtrue = pHExact(state.Ca, state.Va, state.Cb, state.V, state.Ka);
    const pHmeas = roundToResolution(addNoise(pHtrue, 0.01, rng, 1), 0.01);
    state.measurements.push({ V: state.V, pH: pHmeas });
    
    drawSchema();
    redrawGraph();
    redrawTable();
  }

  function toggleTap() {
    state.tapOpen = !state.tapOpen;
    const btn = document.getElementById("pmat04-tap");
    btn.textContent = state.tapOpen ? "Fermer le robinet" : "Ouvrir le robinet";
    btn.className = state.tapOpen ? "btn-tap active" : "btn-secondary";
    drawSchema();
    if (state.tapOpen) {
      clearInterval(state.interval);
      state.interval = setInterval(() => {
        if (state.V >= 25) { toggleTap(); return; }
        addMeasurement(0.05);
      }, 600);
    } else {
      clearInterval(state.interval);
    }
  }

  function resetAll() {
    state.V = 0;
    state.measurements = [];
    state.finished = false;
    state.tapOpen = false;
    clearInterval(state.interval);
    const btn = document.getElementById("pmat04-tap");
    if (btn) { btn.textContent = "Ouvrir le robinet"; btn.className = "btn-secondary"; }
    document.getElementById("pmat04-steps").style.display = "none";
    document.getElementById("pmat04-steps-btn").textContent = "Afficher la démarche complète";
    readInputs();
    drawSchema();
    redrawGraph();
    redrawTable();
  }

  // ===== ÉVÉNEMENTS =====
  document.getElementById("pmat04-exemple").addEventListener("change", resetAll);
  document.getElementById("pmat04-ind").addEventListener("change", resetAll);
  document.getElementsByName("pmat04-va").forEach(r => r.addEventListener("change", resetAll));
  document.getElementById("pmat04-cb").addEventListener("change", resetAll);
  document.getElementById("pmat04-reset").addEventListener("click", resetAll);
  
  document.getElementById("pmat04-tap").addEventListener("click", toggleTap);
  document.getElementById("pmat04-drop").addEventListener("click", () => addMeasurement(0.05));
  document.getElementById("pmat04-add1").addEventListener("click", () => addMeasurement(1));
  
  document.getElementById("pmat04-finish").addEventListener("click", () => {
    state.finished = true;
    redrawGraph();
    document.getElementById("pmat04-steps").style.display = "flex";
    document.getElementById("pmat04-steps-btn").textContent = "Masquer la démarche";
    redrawSteps();
  });

  document.getElementById("pmat04-steps-btn").addEventListener("click", () => {
    const s = document.getElementById("pmat04-steps");
    const btn = document.getElementById("pmat04-steps-btn");
    if (s.style.display === "none") { s.style.display = "flex"; btn.textContent = "Masquer la démarche"; redrawSteps(); }
    else { s.style.display = "none"; btn.textContent = "Afficher la démarche complète"; }
  });

  document.getElementById("pmat04-print").addEventListener("click", () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const doc = w.document;
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    
    doc.open();
    doc.write("<!doctype html><html><head><meta charset='utf-8'><title>" + t("pmat04.print.title") + "</title>");
    doc.write("<style>body{font-family:system-ui;margin:2em;color:#222}h1{color:#1565C0}table{border-collapse:collapse;width:80%;margin-top:1em}th,td{border:1px solid #ccc;padding:6px;text-align:center}th{background:#E3F2FD}.info{margin:1em 0;background:#F5F5F5;padding:10px;border-radius:8px}.calc{background:#FFF3E0;padding:10px;border-radius:8px;margin-top:10px}</style></head><body>");
    doc.write("<h1>" + t("pmat04.print.title") + "</h1>");
    doc.write("<div class='info'><strong>" + EXEMPLES[state.exempleKey].label + "</strong><br>Solution titrée : V_a = " + state.Va + " mL · Solution titrante : C_b = " + state.Cb.toFixed(3) + " mol/L</div>");
    
    const dataURL = canvas.toDataURL("image/png");
    doc.write("<h2>Courbe pH = f(V)</h2>");
    doc.write("<img src='" + dataURL + "' style='max-width:100%;border:1px solid #ccc;border-radius:8px;'>");
    
    doc.write("<h2>Tableau de valeurs</h2><table><tr><th>V (mL)</th><th>pH</th></tr>");
    state.measurements.forEach(m => {
      doc.write("<tr><td>" + m.V.toFixed(2) + "</td><td>" + m.pH.toFixed(2) + "</td></tr>");
    });
    doc.write("</table>");

    doc.write("<div class='calc'><h3>" + t("pmat04.print.calc") + "</h3>");
    doc.write("<p>À l'équivalence, on a : C_a · V_a = C_b · V_E</p>");
    doc.write("<p>Le volume équivalent lu par la méthode des tangentes est V_E = " + VE.toFixed(2) + " mL.</p>");
    doc.write("<p><strong>Donc C_a = (C_b · V_E) / V_a = (" + state.Cb.toFixed(3) + " × " + VE.toFixed(2) + ") / " + state.Va + " = " + state.Ca.toFixed(3) + " mol/L</strong></p>");
    doc.write("</div>");
    
    doc.write("</body></html>");
    doc.close();
    w.print();
  });

  // ===== INITIALISATION =====
  readInputs();
  drawSchema();
  redrawGraph();
  redrawTable();

  return function cleanup() { 
    graph.destroy(); 
    clearInterval(state.interval);
  };
}
