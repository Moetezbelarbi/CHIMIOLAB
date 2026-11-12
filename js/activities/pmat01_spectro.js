import { t } from "../i18n.js";
import { Graph } from "../graph.js";
import { makeRng, addNoise, roundToResolution } from "../measure.js";
import { buildReport } from "../report.js";

const SOLUTES = {
  kmno4: {
    key: "pmat01.solute.kmno4",
    name: "Permanganate de potassium (KMnO₄)",
    lambdaMax: 525,
    sigmaLambda: 40,
    epsMax: 2200, // L/(mol.cm)
    color: "#9C27B0",
    baseColorRgb: [156, 39, 176],
    cStandards: [0.0001, 0.0002, 0.0004, 0.0006, 0.0008], // mol/L
    cUnknown: 0.00048,
    unit: "mol/L"
  },
  e133: {
    key: "pmat01.solute.e133",
    name: "Bleu Brillant FCF (E133)",
    lambdaMax: 630,
    sigmaLambda: 35,
    epsMax: 130000,
    color: "#0288D1",
    baseColorRgb: [2, 136, 209],
    cStandards: [2e-6, 4e-6, 6e-6, 8e-6, 10e-6],
    cUnknown: 5.5e-6,
    unit: "mol/L"
  },
  e102: {
    key: "pmat01.solute.e102",
    name: "Tartrazine jaune (E102)",
    lambdaMax: 427,
    sigmaLambda: 30,
    epsMax: 27000,
    color: "#FBC02D",
    baseColorRgb: [251, 192, 45],
    cStandards: [1e-5, 2e-5, 3e-5, 4e-5, 5e-5],
    cUnknown: 2.8e-5,
    unit: "mol/L"
  }
};

export const id = "pmat01";
export const level = "premiere";
export const domain = "chimie";
export const theme = "suivi";
export const titleKey = "pmat01.title";

export function mount(container) {
  const state = {
    soluteKey: "kmno4",
    wavelength: 525,
    blankSet: false,
    blankLambda: null,
    currentCuvette: "blank", // "blank" | 0..4 (standards) | "unknown"
    measurements: [], // { label, C, A }
    seed: Date.now() & 0xffffff
  };

  const rng = makeRng(state.seed);

  container.innerHTML = `
    <div class="lab-workspace">
      <!-- PAILLASSE : SPECTROPHOTOMÈTRE & CUVES -->
      <section class="lab-bench">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.yourChoice")}</h2>
            <button class="btn-secondary btn-sm" id="pmat01-reset">↺ ${t("ui.reset")}</button>
          </div>

          <div class="controls-grid">
            <div class="field">
              <label for="pmat01-solute-sel">${t("pmat01.solute")}</label>
              <select id="pmat01-solute-sel">
                ${Object.entries(SOLUTES).map(([k, v]) => `<option value="${k}">${t(v.key)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label for="pmat01-lambda-range">${t("pmat01.wavelength")} : <strong><span id="pmat01-lambda-val">525</span> nm</strong></label>
              <input id="pmat01-lambda-range" type="range" min="380" max="780" step="5" value="525">
            </div>

            <div class="field">
              <label for="pmat01-cuvette-sel">${t("pmat01.insertCuvette")}</label>
              <select id="pmat01-cuvette-sel">
                <option value="blank">0. ${t("pmat01.blank")}</option>
                <option value="0">Étalon 1</option>
                <option value="1">Étalon 2</option>
                <option value="2">Étalon 3</option>
                <option value="3">Étalon 4</option>
                <option value="4">Étalon 5</option>
                <option value="unknown">★ ${t("pmat01.unknown")}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SCHÉMA TECHNIQUE DU SPECTROPHOTOMÈTRE -->
        <div class="svg-wrap">
          <svg id="pmat01-svg" viewBox="0 0 640 380" width="100%" role="img" aria-label="Spectrophotomètre de laboratoire"></svg>
        </div>

        <!-- CONTRÔLES D'EXPÉRIENCE -->
        <div class="panel action-bar">
          <button class="btn-secondary" id="pmat01-btn-blank">⚖️ ${t("pmat01.zeroBlank")}</button>
          <button class="btn" id="pmat01-btn-record">💾 ${t("pmat01.measurePoint")}</button>
        </div>
      </section>

      <!-- PUPITRE D'ANALYSE : COURBE D'ÉTALONNAGE & RÉSULTAT -->
      <section class="lab-desk">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("pmat01.curveTitle")}</h2>
          </div>
          <div class="graph-wrap">
            <canvas id="pmat01-canvas" height="300"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.result")} & Exploitation</h2>
            <button class="btn-secondary btn-sm" id="pmat01-btn-report">🖨️ ${t("ui.printReport")}</button>
          </div>

          <div class="investigation-box">
            <div class="input-pair">
              <label for="pmat01-input-cinc">${t("pmat01.eval.askC")}</label>
              <input type="number" step="any" id="pmat01-input-cinc" placeholder="ex: 0.00048">
            </div>
            <button class="btn" id="pmat01-btn-val">✓ Valider la concentration</button>
          </div>
          <div id="pmat01-eval-feedback" class="feedback-msg" style="display:none;"></div>

          <!-- TABLEAU DE MESURES -->
          <details class="table-accordion" open>
            <summary><strong>Tableau des étalons et absorbance</strong></summary>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Échantillon</th>
                    <th>Concentration C</th>
                    <th>Absorbance A</th>
                  </tr>
                </thead>
                <tbody id="pmat01-tbody"></tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </div>
  `;

  const canvas = document.getElementById("pmat01-canvas");
  const graph = new Graph(canvas, {
    xmin: 0, xmax: 0.001,
    ymin: 0, ymax: 2.0,
    xlabel: "Concentration C (mol/L)",
    ylabel: "Absorbance A"
  });

  function getSolute() {
    return SOLUTES[state.soluteKey] || SOLUTES.kmno4;
  }

  function calcAbsorbance(C, lambda) {
    const s = getSolute();
    if (!state.blankSet || state.blankLambda !== lambda) {
      // Sans étalonnage au blanc, la valeur affichée dérive
      return Math.sin(lambda / 100) * 0.4 + 0.3;
    }
    if (C <= 0) return 0.000;

    // Modèle spectral gaussien pour epsilon(lambda)
    const dL = lambda - s.lambdaMax;
    const eps = s.epsMax * Math.exp(-0.5 * (dL / s.sigmaLambda) ** 2);
    const ell = 1.0; // cm
    const A_true = eps * ell * C;
    return Math.max(0, A_true);
  }

  function getCuvetteColor() {
    const s = getSolute();
    if (state.currentCuvette === "blank") {
      return "rgba(227, 242, 253, 0.3)";
    }
    let C = 0;
    if (state.currentCuvette === "unknown") C = s.cUnknown;
    else C = s.cStandards[parseInt(state.currentCuvette, 10)] || 0;

    const maxC = s.cStandards[s.cStandards.length - 1];
    const alpha = Math.min(0.9, Math.max(0.15, (C / maxC) * 0.85));
    const [r, g, b] = s.baseColorRgb;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }

  function drawSchema() {
    const svg = document.getElementById("pmat01-svg");
    if (!svg) return;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const el = document.createElementNS(ns, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text !== undefined) el.textContent = text;
      return el;
    };

    const s = getSolute();
    let currentC = 0;
    let cuvName = t("pmat01.blank");
    if (state.currentCuvette === "unknown") {
      currentC = s.cUnknown;
      cuvName = t("pmat01.unknown");
    } else if (state.currentCuvette !== "blank") {
      const idx = parseInt(state.currentCuvette, 10);
      currentC = s.cStandards[idx];
      cuvName = `Étalon ${idx + 1} (${currentC.toExponential(2)} mol/L)`;
    }

    const A_raw = calcAbsorbance(currentC, state.wavelength);
    const A_disp = state.blankSet ? roundToResolution(addNoise(A_raw, 0.004, rng), 0.001) : A_raw;

    // Corps du spectrophotomètre
    svg.appendChild(mk("rect", { x: "40", y: "40", width: "560", height: "300", rx: "16", fill: "#1E293B", stroke: "#334155", "stroke-width": "3" }));

    // Écran digital LED 7 segments
    svg.appendChild(mk("rect", { x: "70", y: "70", width: "230", height: "90", rx: "8", fill: "#0F172A", stroke: "#475569" }));
    svg.appendChild(mk("text", { x: "90", y: "100", fill: "#94A3B8", "font-size": "12", "font-weight": "bold" }, "ABSORBANCE"));
    const textA = state.blankSet ? A_disp.toFixed(3) : "—.— —";
    svg.appendChild(mk("text", { x: "185", y: "142", fill: "#38BDF8", "font-family": "monospace", "font-size": "34", "font-weight": "bold", "text-anchor": "middle" }, textA));

    // Afficheur de longueur d'onde λ
    svg.appendChild(mk("rect", { x: "340", y: "70", width: "160", height: "90", rx: "8", fill: "#0F172A", stroke: "#475569" }));
    svg.appendChild(mk("text", { x: "360", y: "100", fill: "#94A3B8", "font-size": "12", "font-weight": "bold" }, "LONGUEUR D'ONDE"));
    svg.appendChild(mk("text", { x: "420", y: "142", fill: "#FBBF24", "font-family": "monospace", "font-size": "30", "font-weight": "bold", "text-anchor": "middle" }, `${state.wavelength} nm`));

    // Compartiment de cuve optique
    svg.appendChild(mk("rect", { x: "240", y: "190", width: "160", height: "130", rx: "8", fill: "#0F172A", stroke: "#64748B", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "320", y: "215", fill: "#E2E8F0", "font-size": "12", "font-weight": "bold", "text-anchor": "middle" }, "PUITS DE MESURE"));

    // Faisceau lumineux monochromatique traversant
    const beamColor = `hsl(${Math.max(0, Math.min(300, (700 - state.wavelength) * 0.9))}, 100%, 50%)`;
    svg.appendChild(mk("line", { x1: "120", y1: "260", x2: "285", y2: "260", stroke: beamColor, "stroke-width": "6", opacity: "0.8" }));
    svg.appendChild(mk("line", { x1: "355", y1: "260", x2: "520", y2: "260", stroke: beamColor, "stroke-width": "3", opacity: "0.6" }));

    // Cuve optique insérée
    svg.appendChild(mk("rect", { x: "290", y: "225", width: "60", height: "80", rx: "4", fill: getCuvetteColor(), stroke: "#94A3B8", "stroke-width": "2" }));
    svg.appendChild(mk("line", { x1: "290", y1: "235", x2: "350", y2: "235", stroke: "#CBD5E1", "stroke-width": "1.5" }));

    // Indicateur textuel de cuve
    svg.appendChild(mk("text", { x: "320", y: "335", fill: "#94A3B8", "font-size": "11", "text-anchor": "middle" }, cuvName));
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat01-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.measurements.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><strong>${m.label}</strong></td><td>${m.C.toExponential(3)} mol/L</td><td>${m.A.toFixed(3)}</td>`;
      tbody.appendChild(tr);
    });
  }

  function redrawGraph() {
    const s = getSolute();
    const maxC = s.cStandards[s.cStandards.length - 1];
    graph.setBounds({ xmin: 0, xmax: maxC * 1.2, ymin: 0, ymax: 2.0 });

    const series = [];

    // Points mesurés
    const stdPts = state.measurements
      .filter(m => m.isStd)
      .map(m => ({ x: m.C, y: m.A }));

    series.push({
      points: stdPts,
      color: s.color,
      type: "scatter",
      pointRadius: 4.5
    });

    // Régression linéaire si >= 2 étalons
    if (stdPts.length >= 2) {
      // Pente k = sum(C*A) / sum(C^2) (passe par l'origine)
      let num = 0, den = 0;
      stdPts.forEach(p => { num += p.x * p.y; den += p.x * p.x; });
      const k = den > 0 ? num / den : 0;

      series.push({
        points: [
          { x: 0, y: 0 },
          { x: maxC * 1.2, y: k * maxC * 1.2 }
        ],
        color: "#1565C0",
        width: 2,
        dash: [4, 4]
      });

      // Projection de l'inconnu s'il a été mesuré
      const unk = state.measurements.find(m => !m.isStd);
      if (unk && k > 0) {
        const cProj = unk.A / k;
        series.push({
          points: [
            { x: 0, y: unk.A },
            { x: cProj, y: unk.A },
            { x: cProj, y: 0 }
          ],
          color: "#E11D48",
          width: 1.5,
          dash: [2, 2]
        });
      }
    }

    graph.setSeries(series);
  }

  function resetAll() {
    state.blankSet = false;
    state.blankLambda = null;
    state.currentCuvette = "blank";
    state.measurements = [];
    document.getElementById("pmat01-cuvette-sel").value = "blank";
    const fb = document.getElementById("pmat01-eval-feedback");
    if (fb) fb.style.display = "none";

    drawSchema();
    redrawGraph();
    redrawTable();
  }

  // Événements
  document.getElementById("pmat01-reset").addEventListener("click", resetAll);
  document.getElementById("pmat01-solute-sel").addEventListener("change", (e) => {
    state.soluteKey = e.target.value;
    state.wavelength = getSolute().lambdaMax;
    document.getElementById("pmat01-lambda-range").value = state.wavelength;
    document.getElementById("pmat01-lambda-val").textContent = state.wavelength;
    resetAll();
  });

  document.getElementById("pmat01-lambda-range").addEventListener("input", (e) => {
    state.wavelength = parseInt(e.target.value, 10);
    document.getElementById("pmat01-lambda-val").textContent = state.wavelength;
    drawSchema();
  });

  document.getElementById("pmat01-cuvette-sel").addEventListener("change", (e) => {
    state.currentCuvette = e.target.value;
    drawSchema();
  });

  document.getElementById("pmat01-btn-blank").addEventListener("click", () => {
    state.blankSet = true;
    state.blankLambda = state.wavelength;
    drawSchema();
  });

  document.getElementById("pmat01-btn-record").addEventListener("click", () => {
    if (!state.blankSet || state.blankLambda !== state.wavelength) {
      alert("Veuillez d'abord réaliser le blanc à cette longueur d'onde (eau distillée).");
      return;
    }

    const s = getSolute();
    let label = "", C = 0, isStd = true;
    if (state.currentCuvette === "blank") {
      label = "Blanc (solvant)"; C = 0;
    } else if (state.currentCuvette === "unknown") {
      label = "Solution inconnue"; C = s.cUnknown; isStd = false;
    } else {
      const idx = parseInt(state.currentCuvette, 10);
      label = `Étalon ${idx + 1}`; C = s.cStandards[idx];
    }

    const A_val = roundToResolution(addNoise(calcAbsorbance(C, state.wavelength), 0.003, rng), 0.001);

    // Évite les doublons d'enregistrement du même échantillon
    state.measurements = state.measurements.filter(m => m.label !== label);
    state.measurements.push({ label, C, A: A_val, isStd });
    state.measurements.sort((a, b) => a.C - b.C);

    redrawTable();
    redrawGraph();
  });

  document.getElementById("pmat01-btn-val").addEventListener("click", () => {
    const userC = parseFloat(document.getElementById("pmat01-input-cinc").value);
    const fb = document.getElementById("pmat01-eval-feedback");
    fb.style.display = "block";
    const s = getSolute();

    if (!isFinite(userC)) {
      fb.className = "feedback-msg error";
      fb.textContent = "Veuillez entrer une valeur numérique de concentration.";
      return;
    }

    const err = Math.abs(userC - s.cUnknown) / s.cUnknown;
    if (err < 0.06) {
      fb.className = "feedback-msg success";
      fb.innerHTML = `<strong>Félicitations !</strong> Votre détermination graphique de C_inconnu = ${userC.toExponential(2)} mol/L est précise (valeur théorique : ${s.cUnknown.toExponential(2)} mol/L).`;
    } else {
      fb.className = "feedback-msg warning";
      fb.innerHTML = `<strong>Écart supérieur à 6 % :</strong> Reportez l'absorbance de l'inconnu sur la droite d'étalonnage pour lire la concentration en abscisse (ou utilisez le coefficient directeur k).`;
    }
  });

  document.getElementById("pmat01-btn-report").addEventListener("click", () => {
    buildReport({
      activityTitle: t("pmat01.title"),
      inputs: [
        { label: "Espèce dosée", value: getSolute().name },
        { label: "Longueur d'onde de travail λ", value: `${state.wavelength} nm (proche de λ_max)` },
        { label: "Loi exploitée", value: "Loi de Beer-Lambert : A = ε · l · C" }
      ],
      graphImg: canvas.toDataURL("image/png"),
      table: {
        headers: ["Échantillon", "Concentration C", "Absorbance A"],
        rows: state.measurements.map(m => [m.label, `${m.C.toExponential(2)} mol/L`, m.A.toFixed(3)])
      },
      conclusion: `
        <p><strong>Conclusion du dosage :</strong> La droite d'étalonnage confirme la proportionnalité entre l'absorbance et la concentration (Loi de Beer-Lambert).</p>
        <p>La concentration de la solution inconnue analysée est déterminée à <strong>${getSolute().cUnknown.toExponential(2)} mol/L</strong>.</p>
      `
    });
  });

  resetAll();

  return function cleanup() {
    graph.destroy();
  };
}
