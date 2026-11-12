import { t } from "../i18n.js";
import { Graph } from "../graph.js";
import { makeRng, addNoise, roundToResolution } from "../measure.js";
import { buildReport } from "../report.js";

const LASERS = {
  red: { key: "pmat07.laser.red", lambda: 632.8e-9, color: "#EF4444", beamHsl: "0, 100%, 50%" },
  green: { key: "pmat07.laser.green", lambda: 532.0e-9, color: "#22C55E", beamHsl: "135, 100%, 45%" },
  violet: { key: "pmat07.laser.violet", lambda: 405.0e-9, color: "#8B5CF6", beamHsl: "265, 100%, 55%" }
};

const OBSTACLES = [
  { label: "Fente a = 40 µm", a: 40e-6, isUnknown: false },
  { label: "Fente a = 60 µm", a: 60e-6, isUnknown: false },
  { label: "Fente a = 80 µm", a: 80e-6, isUnknown: false },
  { label: "Fente a = 100 µm", a: 100e-6, isUnknown: false },
  { label: "Fente a = 150 µm", a: 150e-6, isUnknown: false },
  { label: "★ Cheveu humain (inconnu)", a: 72e-6, isUnknown: true }
];

export const id = "pmat07";
export const level = "terminale";
export const domain = "physique";
export const theme = "ondes";
export const titleKey = "pmat07.title";

export function mount(container) {
  const state = {
    laserKey: "red",
    obstacleIdx: 1, // 60 µm
    distD: 1.50, // mètres
    measurements: [], // { label, a, invA, L }
    seed: Date.now() & 0xffffff
  };

  const rng = makeRng(state.seed);

  container.innerHTML = `
    <div class="lab-workspace">
      <!-- PAILLASSE : DISPOSITIF LASER ET DIFFRACTION -->
      <section class="lab-bench">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.yourChoice")}</h2>
            <button class="btn-secondary btn-sm" id="pmat07-reset">↺ ${t("ui.reset")}</button>
          </div>

          <div class="controls-grid">
            <div class="field">
              <label for="pmat07-laser-sel">${t("pmat07.laser")}</label>
              <select id="pmat07-laser-sel">
                ${Object.entries(LASERS).map(([k, v]) => `<option value="${k}">${t(v.key)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label for="pmat07-obstacle-sel">${t("pmat07.obstacle")}</label>
              <select id="pmat07-obstacle-sel">
                ${OBSTACLES.map((o, idx) => `<option value="${idx}">${o.label}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label for="pmat07-dist-range">${t("pmat07.distD")} : <strong><span id="pmat07-dist-val">1.50</span> m</strong></label>
              <input id="pmat07-dist-range" type="range" min="0.80" max="2.50" step="0.10" value="${state.distD}">
            </div>
          </div>
        </div>

        <!-- SCHÉMA SVG : VUE DU MONTAGE ET DE L'ÉCRAN DE DIFFRACTION -->
        <div class="svg-wrap">
          <svg id="pmat07-svg" viewBox="0 0 640 360" width="100%" role="img" aria-label="Montage de diffraction laser"></svg>
        </div>

        <!-- CONTRÔLES D'EXPÉRIENCE -->
        <div class="panel action-bar">
          <button class="btn" id="pmat07-btn-record">💾 Enregistrer la mesure (L)</button>
        </div>
      </section>

      <!-- PUPITRE D'ANALYSE : COURBE L = f(1/a) -->
      <section class="lab-desk">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("pmat07.curveL")}</h2>
          </div>
          <div class="graph-wrap">
            <canvas id="pmat07-canvas" height="300"></canvas>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Exploitation pédagogique</h2>
            <button class="btn-secondary btn-sm" id="pmat07-btn-report">🖨️ ${t("ui.printReport")}</button>
          </div>

          <div class="investigation-box">
            <div class="input-pair">
              <label for="pmat07-input-hair">Épaisseur du cheveu estimée a (µm) :</label>
              <input type="number" step="1" id="pmat07-input-hair" placeholder="ex: 72">
            </div>
            <button class="btn" id="pmat07-btn-val">✓ Valider la mesure du cheveu</button>
          </div>
          <div id="pmat07-eval-feedback" class="feedback-msg" style="display:none;"></div>

          <!-- TABLEAU DE MESURES -->
          <details class="table-accordion" open>
            <summary><strong>Tableau des taches de diffraction</strong></summary>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Obstacle</th>
                    <th>a (µm)</th>
                    <th>1/a (m⁻¹)</th>
                    <th>L mesuré (mm)</th>
                  </tr>
                </thead>
                <tbody id="pmat07-tbody"></tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </div>
  `;

  const canvas = document.getElementById("pmat07-canvas");
  const graph = new Graph(canvas, {
    xmin: 0, xmax: 30000,
    ymin: 0, ymax: 60,
    xlabel: "1/a (m⁻¹)",
    ylabel: "Largeur de la tache centrale L (mm)"
  });

  function getLaser() {
    return LASERS[state.laserKey] || LASERS.red;
  }

  function getObstacle() {
    return OBSTACLES[state.obstacleIdx] || OBSTACLES[0];
  }

  function calcSpotWidthL(a, lambda, D) {
    // L = (2 * lambda * D) / a en mètres
    return (2 * lambda * D) / a;
  }

  function drawSchema() {
    const svg = document.getElementById("pmat07-svg");
    if (!svg) return;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const el = document.createElementNS(ns, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text !== undefined) el.textContent = text;
      return el;
    };

    const laser = getLaser();
    const obs = getObstacle();
    const L_meters = calcSpotWidthL(obs.a, laser.lambda, state.distD);
    const L_mm = L_meters * 1000;

    // 1. Source Laser
    svg.appendChild(mk("rect", { x: "20", y: "80", width: "120", height: "45", rx: "6", fill: "#1E293B", stroke: "#475569", "stroke-width": "2" }));
    svg.appendChild(mk("rect", { x: "135", y: "94", width: "15", height: "16", fill: "#64748B" }));
    svg.appendChild(mk("text", { x: "80", y: "107", fill: "#F8FAFC", "font-size": "11", "font-weight": "bold", "text-anchor": "middle" }, "LASER"));

    // Faisceau incident non dévié
    svg.appendChild(mk("line", { x1: "150", y1: "102", x2: "260", y2: "102", stroke: laser.color, "stroke-width": "2.5" }));

    // 2. Obstacle diffractant (Fente ou Fil)
    svg.appendChild(mk("rect", { x: "260", y: "50", width: "14", height: "110", rx: "3", fill: "#334155" }));
    svg.appendChild(mk("line", { x1: "267", y1: "92", x2: "267", y2: "112", stroke: "#FFFFFF", "stroke-width": "2" })); // fente
    svg.appendChild(mk("text", { x: "267", y: "180", fill: "#334155", "font-size": "11", "font-weight": "bold", "text-anchor": "middle" }, obs.label));

    // Faisceau diffracté en éventail
    svg.appendChild(mk("polygon", {
      points: `274,102 460,${102 - L_mm * 1.5} 460,${102 + L_mm * 1.5}`,
      fill: laser.color,
      opacity: "0.15"
    }));

    // 3. Écran blanc d'observation
    svg.appendChild(mk("rect", { x: "460", y: "20", width: "160", height: "170", rx: "6", fill: "#FFFFFF", stroke: "#64748B", "stroke-width": "2" }));
    svg.appendChild(mk("text", { x: "540", y: "42", fill: "#0F172A", "font-size": "12", "font-weight": "bold", "text-anchor": "middle" }, "FIGURE DE DIFFRACTION"));

    // Figure de diffraction réaliste (tache centrale + taches secondaires)
    const centerY = 105;
    const pxScale = 3.0; // pixels par mm
    const spotHalfW = (L_mm / 2) * pxScale;

    // Tache centrale brillante
    svg.appendChild(mk("rect", {
      x: 540 - spotHalfW, y: centerY - 14,
      width: spotHalfW * 2, height: 28,
      rx: "4", fill: laser.color, opacity: "0.95"
    }));

    // Taches secondaires (1ères extinctions et maxima latéraux)
    const secHalfW = (L_mm / 4) * pxScale;
    // Gauche
    svg.appendChild(mk("rect", {
      x: 540 - spotHalfW - secHalfW * 2 - 6, y: centerY - 10,
      width: secHalfW * 2, height: 20,
      rx: "3", fill: laser.color, opacity: "0.4"
    }));
    // Droite
    svg.appendChild(mk("rect", {
      x: 540 + spotHalfW + 6, y: centerY - 10,
      width: secHalfW * 2, height: 20,
      rx: "3", fill: laser.color, opacity: "0.4"
    }));

    // Réglet millimétrique virtuel sous la tache
    svg.appendChild(mk("line", { x1: 540 - spotHalfW, y1: centerY + 24, x2: 540 + spotHalfW, y2: centerY + 24, stroke: "#0F172A", "stroke-width": "1.5" }));
    svg.appendChild(mk("line", { x1: 540 - spotHalfW, y1: centerY + 18, x2: 540 - spotHalfW, y2: centerY + 30, stroke: "#0F172A", "stroke-width": "1.5" }));
    svg.appendChild(mk("line", { x1: 540 + spotHalfW, y1: centerY + 18, x2: 540 + spotHalfW, y2: centerY + 30, stroke: "#0F172A", "stroke-width": "1.5" }));
    svg.appendChild(mk("text", { x: "540", y: centerY + 42, fill: "#0F172A", "font-size": "12", "font-weight": "bold", "text-anchor": "middle" }, `L = ${L_mm.toFixed(1)} mm`));

    // Graphique profilométrique d'intensité I(x) dans la partie basse du SVG
    svg.appendChild(mk("rect", { x: "20", y: "220", width: "600", height: "125", rx: "8", fill: "#0F172A" }));
    svg.appendChild(mk("text", { x: "35", y: "242", fill: "#94A3B8", "font-size": "11", "font-weight": "bold" }, "PROFIL D'INTENSITÉ LUMINEUSE I(x) (SINC²)"));

    // Courbe sinc^2(u)
    let dStr = "M 35 320";
    for (let px = 0; px <= 570; px += 2) {
      const u = ((px - 285) / spotHalfW) * Math.PI;
      const sinc = u === 0 ? 1 : Math.sin(u) / u;
      const intens = sinc * sinc; // entre 0 et 1
      const y = 320 - intens * 75;
      dStr += ` L ${35 + px} ${y.toFixed(1)}`;
    }
    svg.appendChild(mk("path", { d: dStr, fill: "none", stroke: laser.color, "stroke-width": "2" }));
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat07-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.measurements.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${m.label}</strong></td>
        <td>${m.a ? (m.a * 1e6).toFixed(0) : "Inconnu"}</td>
        <td>${m.invA ? m.invA.toFixed(0) : "—"}</td>
        <td><strong>${m.L.toFixed(1)}</strong></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function redrawGraph() {
    const laser = getLaser();
    const pts = state.measurements
      .filter(m => m.invA)
      .map(m => ({ x: m.invA, y: m.L }));

    const series = [
      { points: pts, color: laser.color, type: "scatter", pointRadius: 4.5 }
    ];

    // Droite théorique L = (2 * lambda * D) * (1/a)
    // pente k = 2 * lambda * D en mm * m
    const slope_mm_m = 2 * laser.lambda * state.distD * 1000;
    series.push({
      points: [
        { x: 0, y: 0 },
        { x: 30000, y: slope_mm_m * 30000 }
      ],
      color: "#64748B",
      width: 1.5,
      dash: [4, 4]
    });

    graph.setSeries(series);
  }

  function resetAll() {
    state.measurements = [];
    const fb = document.getElementById("pmat07-eval-feedback");
    if (fb) fb.style.display = "none";
    drawSchema();
    redrawGraph();
    redrawTable();
  }

  // Événements
  document.getElementById("pmat07-reset").addEventListener("click", resetAll);
  document.getElementById("pmat07-laser-sel").addEventListener("change", (e) => {
    state.laserKey = e.target.value;
    drawSchema();
    redrawGraph();
  });

  document.getElementById("pmat07-obstacle-sel").addEventListener("change", (e) => {
    state.obstacleIdx = parseInt(e.target.value, 10);
    drawSchema();
  });

  document.getElementById("pmat07-dist-range").addEventListener("input", (e) => {
    state.distD = parseFloat(e.target.value);
    document.getElementById("pmat07-dist-val").textContent = state.distD.toFixed(2);
    drawSchema();
    redrawGraph();
  });

  document.getElementById("pmat07-btn-record").addEventListener("click", () => {
    const laser = getLaser();
    const obs = getObstacle();
    const L_true = calcSpotWidthL(obs.a, laser.lambda, state.distD) * 1000;
    // Bruit de mesure de lecture au réglet ±0.5 mm
    const L_meas = roundToResolution(addNoise(L_true, 0.4, rng), 0.1);

    const invA = obs.isUnknown ? null : 1 / obs.a;

    state.measurements = state.measurements.filter(m => m.label !== obs.label);
    state.measurements.push({
      label: obs.label,
      a: obs.isUnknown ? null : obs.a,
      invA,
      L: L_meas
    });
    state.measurements.sort((a, b) => (a.invA || 999999) - (b.invA || 999999));

    redrawTable();
    redrawGraph();
  });

  document.getElementById("pmat07-btn-val").addEventListener("click", () => {
    const userA = parseFloat(document.getElementById("pmat07-input-hair").value);
    const fb = document.getElementById("pmat07-eval-feedback");
    fb.style.display = "block";
    const trueA_um = 72; // 72 µm

    if (!isFinite(userA)) {
      fb.className = "feedback-msg error";
      fb.textContent = "Veuillez entrer une valeur en micromètres (µm).";
      return;
    }

    const err = Math.abs(userA - trueA_um) / trueA_um;
    if (err < 0.10) {
      fb.className = "feedback-msg success";
      fb.innerHTML = `<strong>Mesure validée avec succès !</strong> Le diamètre du cheveu est bien d'environ 72 µm (votre résultat : ${userA} µm). Vous avez correctement exploité la relation L = 2λD/a.`;
    } else {
      fb.className = "feedback-msg warning";
      fb.innerHTML = `<strong>Écart détecté :</strong> Utilisez la pente de la droite d'étalonnage L = f(1/a) pour déduire 1/a à partir de la largeur L mesurée pour le cheveu, puis calculez a = 1 / (1/a).`;
    }
  });

  document.getElementById("pmat07-btn-report").addEventListener("click", () => {
    buildReport({
      activityTitle: t("pmat07.title"),
      inputs: [
        { label: "Laser", value: `${getLaser().lambda * 1e9} nm` },
        { label: "Distance obstacle - écran D", value: `${state.distD.toFixed(2)} m` },
        { label: "Formule théorique", value: "θ = λ / a et L = (2 · λ · D) / a" }
      ],
      graphImg: canvas.toDataURL("image/png"),
      table: {
        headers: ["Obstacle", "Largeur a (µm)", "1/a (m⁻¹)", "L mesuré (mm)"],
        rows: state.measurements.map(m => [m.label, m.a ? `${(m.a * 1e6).toFixed(0)} µm` : "Inconnu", m.invA ? m.invA.toFixed(0) : "—", m.L.toFixed(1)])
      },
      conclusion: `
        <p>L'expérience confirme la proportionnalité entre la largeur de la tache centrale L et l'inverse de la largeur de l'obstacle (1/a).</p>
        <p>L'épaisseur du cheveu analysé est déterminée avec précision grâce au modèle de diffraction ondulatoire.</p>
      `
    });
  });

  resetAll();

  return function cleanup() {
    graph.destroy();
  };
}
