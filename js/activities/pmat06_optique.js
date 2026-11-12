import { t } from "../i18n.js";
import { Graph } from "../graph.js";
import { buildReport } from "../report.js";

export const id = "pmat06";
export const level = "premiere";
export const domain = "physique";
export const theme = "ondes";
export const titleKey = "pmat06.title";

export function mount(container) {
  const state = {
    fPrime: 15.0, // cm (focale)
    xObject: 20.0, // cm
    xLens: 60.0, // cm
    xScreen: 100.0, // cm
    heightObject: 2.5, // cm (taille lettre 'F')
    measurements: [] // { OA, OAprime, invOA, invOAprime, gamma }
  };

  container.innerHTML = `
    <div class="lab-workspace">
      <!-- PAILLASSE : BANC D'OPTIQUE VIRTUEL -->
      <section class="lab-bench">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.yourChoice")}</h2>
            <button class="btn-secondary btn-sm" id="pmat06-reset">↺ ${t("ui.reset")}</button>
          </div>

          <div class="controls-grid">
            <div class="field">
              <label for="pmat06-focal-sel">${t("pmat06.focal")}</label>
              <select id="pmat06-focal-sel">
                <option value="10">+10 cm (Vergence +10 δ)</option>
                <option value="15" selected>+15 cm (Vergence +6.67 δ)</option>
                <option value="20">+20 cm (Vergence +5 δ)</option>
              </select>
            </div>

            <div class="field">
              <label for="pmat06-lens-range">${t("pmat06.lensPos")} : <strong><span id="pmat06-lens-val">60</span> cm</strong></label>
              <input id="pmat06-lens-range" type="range" min="40" max="120" step="1" value="${state.xLens}">
            </div>

            <div class="field">
              <label for="pmat06-screen-range">${t("pmat06.screenPos")} : <strong><span id="pmat06-screen-val">100</span> cm</strong></label>
              <input id="pmat06-screen-range" type="range" min="70" max="190" step="1" value="${state.xScreen}">
            </div>
          </div>
        </div>

        <!-- SCHÉMA TECHNIQUE DU BANC D'OPTIQUE & TRACÉ DE RAYONS -->
        <div class="svg-wrap">
          <svg id="pmat06-svg" viewBox="0 0 640 340" width="100%" role="img" aria-label="Banc d'optique et rayons lumineux"></svg>
        </div>

        <!-- CONTRÔLES DU BANC D'OPTIQUE -->
        <div class="panel action-bar">
          <button class="btn" id="pmat06-btn-autofocus">🎯 ${t("pmat06.autofocus")}</button>
          <button class="btn-secondary" id="pmat06-btn-record">💾 Enregistrer la mesure</button>
        </div>
      </section>

      <!-- PUPITRE D'ANALYSE : RELATION DE CONJUGAISON & GRAPHE -->
      <section class="lab-desk">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">1/OA' en fonction de 1/OA</h2>
          </div>
          <div class="graph-wrap">
            <canvas id="pmat06-canvas" height="300"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("pmat06.conjugaison")}</h2>
            <button class="btn-secondary btn-sm" id="pmat06-btn-report">🖨️ ${t("ui.printReport")}</button>
          </div>

          <div class="readout-box" id="pmat06-readout">
            <!-- Calculs optiques instantanés -->
          </div>

          <!-- TABLEAU DE MESURES -->
          <details class="table-accordion" open>
            <summary><strong>Tableau des mesures optiques</strong></summary>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>OA (cm)</th>
                    <th>OA' (cm)</th>
                    <th>1/OA (m⁻¹)</th>
                    <th>1/OA' (m⁻¹)</th>
                    <th>Grandissement γ</th>
                  </tr>
                </thead>
                <tbody id="pmat06-tbody"></tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </div>
  `;

  const canvas = document.getElementById("pmat06-canvas");
  const graph = new Graph(canvas, {
    xmin: -10, xmax: 0,
    ymin: 0, ymax: 12,
    xlabel: "1/OA (m⁻¹)",
    ylabel: "1/OA' (m⁻¹)"
  });

  function getOpticsState() {
    const OA = state.xObject - state.xLens; // négatif en cm
    const f = state.fPrime; // cm

    // Relation de Descartes : 1/OA' - 1/OA = 1/f' => 1/OA' = 1/f' + 1/OA
    let OAprime_theo = null;
    let isVirtual = false;

    if (OA + f !== 0) {
      OAprime_theo = (OA * f) / (OA + f);
      if (OAprime_theo <= 0) isVirtual = true;
    }

    const OAprime_screen = state.xScreen - state.xLens;
    const delta = OAprime_theo !== null ? Math.abs(OAprime_screen - OAprime_theo) : 999;
    const isSharp = !isVirtual && delta < 1.0;
    const blurAmount = isVirtual ? 12 : Math.min(12, delta * 0.8);
    const gamma = (OAprime_theo !== null && OA !== 0) ? (OAprime_theo / OA) : 0;

    return { OA, OAprime_theo, OAprime_screen, isVirtual, isSharp, blurAmount, gamma };
  }

  function drawSchema() {
    const svg = document.getElementById("pmat06-svg");
    if (!svg) return;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const el = document.createElementNS(ns, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text !== undefined) el.textContent = text;
      return el;
    };

    const opt = getOpticsState();

    // Filtre de flou SVG pour simuler la netteté de l'image
    const defs = mk("defs", {});
    const filter = mk("filter", { id: "optics-blur" });
    filter.appendChild(mk("feGaussianBlur", { stdDeviation: opt.blurAmount.toFixed(1) }));
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Banc gradué de 200 cm (échelle x: 30px à 610px -> 580px pour 200 cm => facteur ~2.9)
    const toPx = (x) => 30 + (x / 200) * 580;
    const axisY = 170;

    // Rail du banc d'optique
    svg.appendChild(mk("rect", { x: "20", y: "240", width: "600", height: "18", rx: "4", fill: "#334155" }));
    svg.appendChild(mk("line", { x1: "30", y1: "240", x2: "610", y2: "240", stroke: "#E2E8F0", "stroke-width": "1" }));
    for (let cm = 0; cm <= 200; cm += 20) {
      const px = toPx(cm);
      svg.appendChild(mk("line", { x1: px, y1: "240", x2: px, y2: "248", stroke: "#CBD5E1", "stroke-width": "1.5" }));
      svg.appendChild(mk("text", { x: px, y: "262", fill: "#94A3B8", "font-size": "9", "text-anchor": "middle" }, cm));
    }

    // Axe optique principal (pointillé)
    svg.appendChild(mk("line", { x1: "20", y1: axisY, x2: "620", y2: axisY, stroke: "#64748B", "stroke-width": "1.5", "stroke-dasharray": "6,4" }));

    // 1. OBJET LUMINEUX ("F" à xObject)
    const pObj = toPx(state.xObject);
    svg.appendChild(mk("rect", { x: pObj - 6, y: "190", width: "12", height: "50", fill: "#475569" })); // cavalier
    svg.appendChild(mk("circle", { cx: pObj, cy: axisY, r: "3", fill: "#0F172A" })); // Point A
    svg.appendChild(mk("text", { x: pObj - 8, y: axisY + 14, fill: "#0F172A", "font-weight": "bold", "font-size": "12" }, "A"));

    // Flèche / Objet AB
    const objHeightPx = state.heightObject * 12;
    svg.appendChild(mk("line", { x1: pObj, y1: axisY, x2: pObj, y2: axisY - objHeightPx, stroke: "#F59E0B", "stroke-width": "3" }));
    svg.appendChild(mk("polygon", { points: `${pObj},${axisY - objHeightPx - 6} ${pObj - 4},${axisY - objHeightPx} ${pObj + 4},${axisY - objHeightPx}`, fill: "#F59E0B" }));
    svg.appendChild(mk("text", { x: pObj - 8, y: axisY - objHeightPx - 2, fill: "#D97706", "font-weight": "bold", "font-size": "12" }, "B"));

    // 2. LENTILLE MINCE CONVERGENTE (à xLens)
    const pLens = toPx(state.xLens);
    svg.appendChild(mk("rect", { x: pLens - 6, y: "210", width: "12", height: "30", fill: "#475569" })); // cavalier
    // Lentille avec double flèche
    svg.appendChild(mk("line", { x1: pLens, y1: axisY - 80, x2: pLens, y2: axisY + 80, stroke: "#2563EB", "stroke-width": "3" }));
    svg.appendChild(mk("polygon", { points: `${pLens},${axisY - 86} ${pLens - 5},${axisY - 76} ${pLens + 5},${axisY - 76}`, fill: "#2563EB" }));
    svg.appendChild(mk("polygon", { points: `${pLens},${axisY + 86} ${pLens - 5},${axisY + 76} ${pLens + 5},${axisY + 76}`, fill: "#2563EB" }));
    svg.appendChild(mk("circle", { cx: pLens, cy: axisY, r: "3", fill: "#2563EB" }));
    svg.appendChild(mk("text", { x: pLens + 6, y: axisY + 14, fill: "#2563EB", "font-weight": "bold", "font-size": "12" }, "O"));

    // Foyers F et F'
    const pF = toPx(state.xLens - state.fPrime);
    const pFprime = toPx(state.xLens + state.fPrime);
    svg.appendChild(mk("circle", { cx: pF, cy: axisY, r: "3", fill: "#DC2626" }));
    svg.appendChild(mk("text", { x: pF - 4, y: axisY + 14, fill: "#DC2626", "font-weight": "bold", "font-size": "11" }, "F"));
    svg.appendChild(mk("circle", { cx: pFprime, cy: axisY, r: "3", fill: "#DC2626" }));
    svg.appendChild(mk("text", { x: pFprime - 4, y: axisY + 14, fill: "#DC2626", "font-weight": "bold", "font-size": "11" }, "F'"));

    // 3. ÉCRAN DE PROJECTION (à xScreen)
    const pScreen = toPx(state.xScreen);
    svg.appendChild(mk("rect", { x: pScreen - 4, y: "220", width: "8", height: "20", fill: "#475569" }));
    svg.appendChild(mk("rect", { x: pScreen - 2, y: axisY - 80, width: "6", height: "160", rx: "2", fill: "#FFFFFF", stroke: "#64748B", "stroke-width": "1.5" }));
    svg.appendChild(mk("text", { x: pScreen - 4, y: axisY - 90, fill: "#0F172A", "font-weight": "bold", "font-size": "12", "text-anchor": "middle" }, "Écran"));

    // Image projetée sur l'écran
    if (!opt.isVirtual && opt.OAprime_theo !== null) {
      const imgHeightPx = objHeightPx * Math.abs(opt.gamma);
      const isInv = opt.gamma < 0;
      const imgTop = isInv ? axisY : axisY - imgHeightPx;
      const imgBot = isInv ? axisY + imgHeightPx : axisY;

      svg.appendChild(mk("line", {
        x1: pScreen, y1: imgTop, x2: pScreen, y2: imgBot,
        stroke: "#E11D48", "stroke-width": "3",
        filter: "url(#optics-blur)"
      }));
    }

    // 4. TRACÉ DES RAYONS CARACTÉRISTIQUES
    const yB = axisY - objHeightPx;
    if (opt.OAprime_theo !== null) {
      const pImageTheo = toPx(state.xLens + opt.OAprime_theo);
      const yBprime = axisY + objHeightPx * opt.gamma;

      // Rayon 1 (Bleu) : passant par O sans déviation
      svg.appendChild(mk("line", { x1: pObj, y1: yB, x2: pImageTheo, y2: yBprime, stroke: "#3B82F6", "stroke-width": "1.5" }));

      // Rayon 2 (Rouge) : parallèle à l'axe puis passant par F'
      svg.appendChild(mk("line", { x1: pObj, y1: yB, x2: pLens, y2: yB, stroke: "#EF4444", "stroke-width": "1.5" }));
      svg.appendChild(mk("line", { x1: pLens, y1: yB, x2: pImageTheo, y2: yBprime, stroke: "#EF4444", "stroke-width": "1.5" }));

      // Rayon 3 (Vert) : passant par F puis émergeant parallèle
      svg.appendChild(mk("line", { x1: pObj, y1: yB, x2: pLens, y2: yBprime, stroke: "#10B981", "stroke-width": "1.5" }));
      svg.appendChild(mk("line", { x1: pLens, y1: yBprime, x2: pImageTheo, y2: yBprime, stroke: "#10B981", "stroke-width": "1.5" }));
    }

    // Mise à jour de l'encart d'analyse
    const readout = document.getElementById("pmat06-readout");
    if (readout) {
      let stateBadge = "";
      if (opt.isVirtual) {
        stateBadge = `<span class="badge error">Image virtuelle non projetable</span>`;
      } else if (opt.isSharp) {
        stateBadge = `<span class="badge success">Image nette (Mise au point réussie)</span>`;
      } else {
        stateBadge = `<span class="badge warning">Image floue (écart écran : ${Math.abs(opt.OAprime_screen - opt.OAprime_theo).toFixed(1)} cm)</span>`;
      }

      readout.innerHTML = `
        <div class="readout-row">
          <div><strong>OA</strong> = ${opt.OA.toFixed(1)} cm</div>
          <div><strong>OA' théorique</strong> = ${opt.OAprime_theo !== null ? opt.OAprime_theo.toFixed(1) + " cm" : "∞"}</div>
          <div><strong>Grandissement γ</strong> = ${opt.gamma.toFixed(2)}</div>
        </div>
        <div style="margin-top:8px;">${stateBadge}</div>
      `;
    }
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat06-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.measurements.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.OA.toFixed(1)}</td>
        <td>${m.OAprime.toFixed(1)}</td>
        <td>${m.invOA.toFixed(2)}</td>
        <td>${m.invOAprime.toFixed(2)}</td>
        <td>${m.gamma.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function redrawGraph() {
    const pts = state.measurements.map(m => ({ x: m.invOA, y: m.invOAprime }));
    const fMeters = state.fPrime / 100;
    const theoVergence = 1 / fMeters; // delta

    graph.setBounds({ xmin: -10, xmax: 0, ymin: 0, ymax: theoVergence + 4 });

    const series = [
      { points: pts, color: "#2563EB", type: "scatter", pointRadius: 4.5 }
    ];

    // Droite théorique : 1/OA' = 1/f' + 1/OA (pente = 1, ordonnée = V)
    series.push({
      points: [
        { x: -10, y: theoVergence - 10 },
        { x: 0, y: theoVergence }
      ],
      color: "#16A34A",
      width: 2,
      dash: [4, 4]
    });

    graph.setSeries(series);
  }

  function resetAll() {
    state.measurements = [];
    state.xLens = 60.0;
    state.xScreen = 100.0;
    document.getElementById("pmat06-lens-range").value = state.xLens;
    document.getElementById("pmat06-screen-range").value = state.xScreen;
    document.getElementById("pmat06-lens-val").textContent = state.xLens;
    document.getElementById("pmat06-screen-val").textContent = state.xScreen;

    drawSchema();
    redrawGraph();
    redrawTable();
  }

  // Événements
  document.getElementById("pmat06-reset").addEventListener("click", resetAll);
  document.getElementById("pmat06-focal-sel").addEventListener("change", (e) => {
    state.fPrime = parseFloat(e.target.value);
    drawSchema();
    redrawGraph();
  });

  document.getElementById("pmat06-lens-range").addEventListener("input", (e) => {
    state.xLens = parseFloat(e.target.value);
    document.getElementById("pmat06-lens-val").textContent = state.xLens;
    drawSchema();
  });

  document.getElementById("pmat06-screen-range").addEventListener("input", (e) => {
    state.xScreen = parseFloat(e.target.value);
    document.getElementById("pmat06-screen-val").textContent = state.xScreen;
    drawSchema();
  });

  document.getElementById("pmat06-btn-autofocus").addEventListener("click", () => {
    const opt = getOpticsState();
    if (!opt.isVirtual && opt.OAprime_theo !== null) {
      state.xScreen = Math.min(195, Math.max(state.xLens + 10, state.xLens + opt.OAprime_theo));
      document.getElementById("pmat06-screen-range").value = state.xScreen;
      document.getElementById("pmat06-screen-val").textContent = state.xScreen.toFixed(1);
      drawSchema();
    } else {
      alert("Impossible de focaliser : l'image est virtuelle (l'objet est situé entre le foyer objet et la lentille).");
    }
  });

  document.getElementById("pmat06-btn-record").addEventListener("click", () => {
    const opt = getOpticsState();
    if (opt.isVirtual || opt.OAprime_theo === null) {
      alert("Impossible d'enregistrer : aucune image réelle projetable.");
      return;
    }
    const OA_m = opt.OA / 100;
    const OAprime_m = opt.OAprime_screen / 100;
    const invOA = 1 / OA_m;
    const invOAprime = 1 / OAprime_m;

    state.measurements.push({
      OA: opt.OA,
      OAprime: opt.OAprime_screen,
      invOA,
      invOAprime,
      gamma: opt.gamma
    });

    redrawTable();
    redrawGraph();
  });

  document.getElementById("pmat06-btn-report").addEventListener("click", () => {
    buildReport({
      activityTitle: t("pmat06.title"),
      inputs: [
        { label: "Focale de la lentille f'", value: `+${state.fPrime} cm (Vergence V = ${(100 / state.fPrime).toFixed(1)} δ)` },
        { label: "Formule vérifiée", value: "Relation de conjugaison : 1/OA' - 1/OA = 1/f'" }
      ],
      graphImg: canvas.toDataURL("image/png"),
      table: {
        headers: ["OA (cm)", "OA' (cm)", "1/OA (m⁻¹)", "1/OA' (m⁻¹)", "Grandissement γ"],
        rows: state.measurements.map(m => [m.OA.toFixed(1), m.OAprime.toFixed(1), m.invOA.toFixed(2), m.invOAprime.toFixed(2), m.gamma.toFixed(2)])
      },
      conclusion: `
        <p>Les mesures confirment la relation de conjugaison de Descartes. La droite 1/OA' = f(1/OA) a une pente unitaire et son ordonnée à l'origine donne la vergence V de la lentille.</p>
      `
    });
  });

  resetAll();

  return function cleanup() {
    graph.destroy();
  };
}
