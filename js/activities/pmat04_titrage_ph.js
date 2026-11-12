import { t } from "../i18n.js";
import { Graph } from "../graph.js";
import { makeRng, addNoise, roundToResolution } from "../measure.js";
import { buildReport } from "../report.js";

const KE = 1e-14;

// Conductivités molaires ioniques limites à 25°C en mS·m²/mol (ou S·cm²/mol × 10)
const LAMBDA = {
  H3O: 35.0,
  HO: 19.9,
  Na: 5.01,
  CH3COO: 4.09,
  Cl: 7.63,
  Lactate: 3.88
};

const ACIDES = {
  ethanoique: {
    key: "pmat04.acid.ethanoique",
    formule: "CH₃COOH",
    pKa: 4.76,
    Ka: 10 ** -4.76,
    Ca_default: 0.100,
    ionConjugue: "CH3COO",
    eqEquation: "CH₃COOH(aq) + HO⁻(aq) → CH₃COO⁻(aq) + H₂O(l)"
  },
  chloro: {
    key: "pmat04.acid.chloro",
    formule: "H₃O⁺ + Cl⁻",
    pKa: -2,
    Ka: 1e6,
    Ca_default: 0.100,
    ionConjugue: "Cl",
    eqEquation: "H₃O⁺(aq) + HO⁻(aq) → 2 H₂O(l)"
  },
  lactique: {
    key: "pmat04.acid.lactique",
    formule: "CH₃-CH(OH)-COOH",
    pKa: 3.86,
    Ka: 10 ** -3.86,
    Ca_default: 0.080,
    ionConjugue: "Lactate",
    eqEquation: "C₃H₆O₃(aq) + HO⁻(aq) → C₃H₅O₃⁻(aq) + H₂O(l)"
  }
};

export function pHExact(Ca, Va, Cb, Vb, Ka) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 7.0;
  const cNa = (Cb * Vb) / Vtot;
  const cAtot = (Ca * Va) / Vtot;

  const f = h => cNa + h - KE / h - (cAtot * Ka) / (Ka + h);

  let lo = 1e-14, hi = 2.0;
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

export function calcConductivity(Ca, Va, Cb, Vb, Ka, ionKey) {
  const Vtot = Va + Vb;
  if (Vtot <= 0) return 0;
  const pH = pHExact(Ca, Va, Cb, Vb, Ka);
  const h = 10 ** -pH;
  const oh = KE / h;
  const cNa = (Cb * Vb) / Vtot;
  const cA = ((Ca * Va) / Vtot) * (Ka / (Ka + h));

  // Conductivité sigma en mS/cm
  // sigma = sum(lambda_i * C_i) avec lambda en mS.m^2/mol et C en mol/L
  const lambdaA = LAMBDA[ionKey] || 4.0;
  const sigma = (LAMBDA.H3O * h + LAMBDA.HO * oh + LAMBDA.Na * cNa + lambdaA * cA) * 1.0;
  return Math.max(0.01, sigma);
}

export function findEquivalence(Ca, Va, Cb) {
  return (Ca * Va) / Cb;
}

export const id = "pmat04";
export const level = "terminale";
export const domain = "chimie";
export const theme = "suivi";
export const titleKey = "pmat04.title";

export function mount(container) {
  const state = {
    acidKey: "ethanoique",
    mode: "both", // "ph", "cond", "both"
    indicator: "bbt",
    Ca: ACIDES.ethanoique.Ca_default,
    Va: 10.0,
    Cb: 0.100,
    V: 0,
    tapOpen: false,
    showTangents: false,
    showDerivative: true,
    measurements: [],
    seed: Date.now() & 0xffffff,
    interval: null
  };

  const rng = makeRng(state.seed);

  // Construction du DOM avec disposition moderne (Paillasse + Pupitre)
  container.innerHTML = `
    <div class="lab-workspace">
      <!-- PAILLASSE EXPÉRIMENTALE (GAUCHE) -->
      <section class="lab-bench">
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.yourChoice")}</h2>
            <button class="btn-secondary btn-sm" id="pmat04-reset">↺ ${t("ui.reset")}</button>
          </div>

          <div class="controls-grid">
            <div class="field">
              <label for="pmat04-acid-sel">${t("pmat04.acid")}</label>
              <select id="pmat04-acid-sel">
                ${Object.entries(ACIDES).map(([k, v]) => `<option value="${k}">${t(v.key)}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label for="pmat04-mode-sel">${t("pmat04.mode")}</label>
              <select id="pmat04-mode-sel">
                <option value="both">${t("pmat04.mode.both")}</option>
                <option value="ph">${t("pmat04.mode.ph")}</option>
                <option value="cond">${t("pmat04.mode.cond")}</option>
              </select>
            </div>

            <div class="field">
              <label for="pmat04-ind-sel">${t("pmat04.indicator")}</label>
              <select id="pmat04-ind-sel">
                <option value="bbt">${t("pmat04.ind.bbt")}</option>
                <option value="pp">${t("pmat04.ind.pp")}</option>
                <option value="helianthine">${t("pmat04.ind.helianthine")}</option>
                <option value="none">${t("pmat04.ind.none")}</option>
              </select>
            </div>

            <div class="field">
              <label for="pmat04-va-input">${t("pmat04.volumeSample")} : <strong><span id="pmat04-va-val">10.0</span> mL</strong></label>
              <input id="pmat04-va-input" type="range" min="10" max="20" step="5" value="${state.Va}">
            </div>

            <div class="field">
              <label for="pmat04-cb-input">${t("pmat04.titrantConc")} (C_b en mol/L)</label>
              <input id="pmat04-cb-input" type="number" step="0.01" min="0.05" max="0.20" value="${state.Cb}">
            </div>
          </div>
        </div>

        <!-- SCHÉMA TECHNIQUE SVG INTERACTIF -->
        <div class="svg-wrap" style="position:relative;">
          <svg id="pmat04-svg" viewBox="0 0 640 400" width="100%" role="img" aria-label="Montage expérimental de titrage"></svg>
        </div>

        <!-- CONTRÔLES D'ÉCOULEMENT -->
        <div class="panel action-bar">
          <button class="btn" id="pmat04-btn-zero">📍 ${t("pmat04.measureZero")}</button>
          <button class="btn" id="pmat04-btn-drop">💧 ${t("pmat04.drop")}</button>
          <button class="btn" id="pmat04-btn-add05">+0,5 mL</button>
          <button class="btn" id="pmat04-btn-add1">+1,0 mL</button>
          <button class="btn-tap" id="pmat04-btn-tap">▶ ${t("pmat04.tapOpen")}</button>
        </div>
      </section>

      <!-- PUPITRE D'ANALYSE & GRAPHIQUE (DROITE) -->
      <section class="lab-desk">
        <!-- GRAPHIQUE -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("ui.measure")}</h2>
            <div class="graph-actions">
              <button class="btn-toggle active" id="pmat04-btn-tangents">📐 ${t("pmat04.tools.tangents")}</button>
              <button class="btn-toggle active" id="pmat04-btn-deriv">📈 ${t("pmat04.tools.derivative")}</button>
            </div>
          </div>
          <div class="graph-wrap">
            <canvas id="pmat04-canvas" height="320"></canvas>
          </div>
        </div>

        <!-- EXPLOITATION & TABLEAU -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">${t("pmat04.eval.title")}</h2>
            <button class="btn-secondary btn-sm" id="pmat04-btn-report">🖨️ ${t("ui.printReport")}</button>
          </div>

          <div class="investigation-box">
            <div class="input-pair">
              <label for="pmat04-input-ve">${t("pmat04.eval.askVe")}</label>
              <input type="number" step="0.1" id="pmat04-input-ve" placeholder="ex: 10.0">
            </div>
            <div class="input-pair">
              <label for="pmat04-input-ca">${t("pmat04.eval.askCa")}</label>
              <input type="number" step="0.001" id="pmat04-input-ca" placeholder="ex: 0.100">
            </div>
            <button class="btn" id="pmat04-btn-validate">✓ ${t("pmat04.eval.validate")}</button>
          </div>
          <div id="pmat04-eval-feedback" class="feedback-msg" style="display:none;"></div>

          <!-- TABLEAU DE MESURES -->
          <details class="table-accordion">
            <summary><strong>${t("pmat04.table.v")} & Mesures (${"<span id='pmat04-count'>0</span>"})</strong></summary>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${t("pmat04.table.v")}</th>
                    <th>${t("pmat04.table.ph")}</th>
                    <th>${t("pmat04.table.deriv")}</th>
                    <th>${t("pmat04.table.sigma")}</th>
                  </tr>
                </thead>
                <tbody id="pmat04-tbody"></tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </div>
  `;

  // Initialisation du Graphique
  const canvas = document.getElementById("pmat04-canvas");
  const graph = new Graph(canvas, {
    xmin: 0, xmax: 25,
    ymin: 0, ymax: 14,
    y2min: 0, y2max: 10,
    xlabel: "V_versé (mL)",
    ylabel: "pH",
    y2label: "σ (mS/cm)"
  });

  // Fonctions de calcul et d'affichage
  function getAcid() {
    return ACIDES[state.acidKey] || ACIDES.ethanoique;
  }

  function getTheoreticalValues(V) {
    const acid = getAcid();
    const pH = pHExact(state.Ca, state.Va, state.Cb, V, acid.Ka);
    const sigma = calcConductivity(state.Ca, state.Va, state.Cb, V, acid.Ka, acid.ionConjugue);
    return { pH, sigma };
  }

  function getSolutionColor(currentPH) {
    if (state.indicator === "none") {
      return { fill: "rgba(227, 242, 253, 0.4)", label: "Incolore limpide" };
    }
    if (state.indicator === "bbt") {
      // BBT : Jaune en acide (<6.0), Vert (6.0-7.6), Bleu (>7.6)
      if (currentPH < 6.0) return { fill: "rgba(255, 213, 79, 0.75)", label: "Jaune (acide)" };
      if (currentPH <= 7.6) return { fill: "rgba(129, 199, 132, 0.8)", label: "Vert (virage)" };
      return { fill: "rgba(30, 136, 229, 0.75)", label: "Bleu (basique)" };
    }
    if (state.indicator === "pp") {
      // Phénolphtaléine : Incolore (<8.2), Rose/Fuchsia (>8.2)
      if (currentPH < 8.2) return { fill: "rgba(255, 255, 255, 0.35)", label: "Incolore" };
      return { fill: "rgba(233, 30, 99, 0.8)", label: "Rose violacé" };
    }
    if (state.indicator === "helianthine") {
      // Hélianthine : Rouge (<3.1), Jaune (>4.4)
      if (currentPH < 3.1) return { fill: "rgba(229, 57, 53, 0.8)", label: "Rouge" };
      if (currentPH <= 4.4) return { fill: "rgba(255, 152, 0, 0.8)", label: "Orangé" };
      return { fill: "rgba(255, 238, 88, 0.8)", label: "Jaune" };
    }
    return { fill: "rgba(227, 242, 253, 0.5)", label: "" };
  }

  function drawSchema() {
    const svg = document.getElementById("pmat04-svg");
    if (!svg) return;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const el = document.createElementNS(ns, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text !== undefined) el.textContent = text;
      return el;
    };

    const last = state.measurements[state.measurements.length - 1];
    const curPH = last ? last.pH : getTheoreticalValues(state.V).pH;
    const curSigma = last ? last.sigma : getTheoreticalValues(state.V).sigma;
    const solColor = getSolutionColor(curPH);

    // Potence & Support métallique
    svg.appendChild(mk("rect", { x: "40", y: "370", width: "140", height: "16", rx: "4", fill: "#475569" }));
    svg.appendChild(mk("rect", { x: "100", y: "30", width: "12", height: "340", fill: "#64748B" }));
    svg.appendChild(mk("rect", { x: "90", y: "90", width: "32", height: "14", fill: "#334155" }));
    svg.appendChild(mk("rect", { x: "120", y: "82", width: "40", height: "30", fill: "#475569", rx: "3" }));

    // Burette graduée de 25 mL
    svg.appendChild(mk("rect", { x: "160", y: "30", width: "24", height: "230", rx: "3", fill: "rgba(255,255,255,0.9)", stroke: "#334155", "stroke-width": "2" }));

    // Graduations de la burette (0 en haut, 25 en bas)
    for (let i = 0; i <= 10; i++) {
      const y = 40 + (200 * i) / 10;
      const w = i % 5 === 0 ? 10 : 5;
      svg.appendChild(mk("line", { x1: "160", y1: y, x2: 160 + w, y2: y, stroke: "#334155", "stroke-width": "1" }));
      if (i % 5 === 0) {
        svg.appendChild(mk("text", { x: "155", y: y + 4, "font-size": "9", fill: "#334155", "text-anchor": "end", "font-weight": "bold" }, (i * 2.5).toFixed(1)));
      }
    }

    // Niveau du liquide titrant dans la burette
    const remainingRatio = Math.max(0, 1 - state.V / 25);
    const liquidH = 200 * remainingRatio;
    svg.appendChild(mk("rect", { x: "162", y: 40 + (200 - liquidH), width: "20", height: liquidH, fill: "#93C5FD", opacity: "0.65" }));

    // Robinet de la burette
    const tapColor = state.tapOpen ? "#16A34A" : "#DC2626";
    svg.appendChild(mk("rect", { x: "166", y: "260", width: "12", height: "14", fill: "#64748B" }));
    svg.appendChild(mk("rect", { x: state.tapOpen ? "156" : "172", y: "263", width: "16", height: "8", fill: tapColor, rx: "2" }));
    svg.appendChild(mk("rect", { x: "170", y: "274", width: "4", height: "12", fill: "#94A3B8" }));

    // Bécher contenant la solution titrée
    svg.appendChild(mk("rect", { x: "125", y: "300", width: "95", height: "70", rx: "4", fill: "rgba(255,255,255,0.6)", stroke: "#334155", "stroke-width": "2" }));
    // Solution dans le bécher avec couleur réelle
    svg.appendChild(mk("rect", { x: "127", y: "320", width: "91", height: "48", rx: "2", fill: solColor.fill }));

    // Barreau aimanté & Agitateur magnétique
    svg.appendChild(mk("rect", { x: "115", y: "370", width: "115", height: "14", rx: "3", fill: "#CBD5E1", stroke: "#475569" }));
    svg.appendChild(mk("rect", { x: "155", y: "360", width: "35", height: "7", rx: "3.5", fill: "#FFFFFF", stroke: "#1E293B", "stroke-width": "1" }));

    // Sonde pH immergée
    if (state.mode === "ph" || state.mode === "both") {
      svg.appendChild(mk("rect", { x: "140", y: "275", width: "10", height: "70", fill: "#38BDF8", rx: "2" }));
      svg.appendChild(mk("circle", { cx: "145", cy: "345", r: "5", fill: "#0284C7" }));
      // Câble vers pH-mètre
      svg.appendChild(mk("path", { d: "M 145 275 C 145 200, 320 200, 340 100", fill: "none", stroke: "#0284C7", "stroke-width": "2.5" }));
    }

    // Cellule conductimétrique immergée
    if (state.mode === "cond" || state.mode === "both") {
      svg.appendChild(mk("rect", { x: "195", y: "275", width: "10", height: "70", fill: "#F97316", rx: "2" }));
      svg.appendChild(mk("rect", { x: "192", y: "340", width: "16", height: "8", fill: "#C2410C" }));
      // Câble vers conductimètre
      svg.appendChild(mk("path", { d: "M 200 275 C 200 220, 480 220, 500 100", fill: "none", stroke: "#F97316", "stroke-width": "2.5" }));
    }

    // Boîtier pH-mètre numérique
    if (state.mode === "ph" || state.mode === "both") {
      svg.appendChild(mk("rect", { x: "300", y: "40", width: "140", height: "85", rx: "8", fill: "#1E293B", stroke: "#475569", "stroke-width": "2" }));
      svg.appendChild(mk("rect", { x: "312", y: "52", width: "116", height: "42", rx: "4", fill: "#0F172A" }));
      svg.appendChild(mk("text", { x: "370", y: "81", fill: "#4ADE80", "font-family": "monospace", "font-size": "22", "font-weight": "bold", "text-anchor": "middle" }, curPH.toFixed(2)));
      svg.appendChild(mk("text", { x: "370", y: "115", fill: "#94A3B8", "font-size": "12", "text-anchor": "middle", "font-weight": "bold" }, "pH-mètre"));
    }

    // Boîtier Conductimètre numérique
    if (state.mode === "cond" || state.mode === "both") {
      svg.appendChild(mk("rect", { x: "460", y: "40", width: "140", height: "85", rx: "8", fill: "#1E293B", stroke: "#475569", "stroke-width": "2" }));
      svg.appendChild(mk("rect", { x: "472", y: "52", width: "116", height: "42", rx: "4", fill: "#0F172A" }));
      svg.appendChild(mk("text", { x: "530", y: "81", fill: "#FDBA74", "font-family": "monospace", "font-size": "20", "font-weight": "bold", "text-anchor": "middle" }, curSigma.toFixed(2)));
      svg.appendChild(mk("text", { x: "530", y: "115", fill: "#94A3B8", "font-size": "12", "text-anchor": "middle", "font-weight": "bold" }, "σ (mS/cm)"));
    }

    // Indicateur de volume actuel versé
    svg.appendChild(mk("rect", { x: "300", y: "145", width: "300", height: "40", rx: "8", fill: "#EFF6FF", stroke: "#BFDBFE" }));
    svg.appendChild(mk("text", { x: "450", y: "170", fill: "#1E40AF", "font-size": "15", "font-weight": "bold", "text-anchor": "middle" }, `Volume versé V = ${state.V.toFixed(2)} mL / 25,00 mL`));

    // Témoin couleur indicateur
    if (solColor.label) {
      svg.appendChild(mk("text", { x: "172", y: "395", fill: "#334155", "font-size": "11", "font-weight": "bold", "text-anchor": "middle" }, `Teinte : ${solColor.label}`));
    }
  }

  function redrawGraph() {
    const series = [];
    const VE_theo = findEquivalence(state.Ca, state.Va, state.Cb);

    // Série 1 : pH = f(V)
    if (state.mode === "ph" || state.mode === "both") {
      series.push({
        points: state.measurements.map(m => ({ x: m.V, y: m.pH })),
        color: "#1565C0",
        width: 2.5,
        showPoints: true,
        pointRadius: 3
      });
    }

    // Série 2 : Conductivité sigma = f(V) sur axe Y2
    if (state.mode === "cond" || state.mode === "both") {
      series.push({
        points: state.measurements.map(m => ({ x: m.V, y: m.sigma })),
        color: "#E65100",
        width: 2,
        useY2: true,
        showPoints: true,
        pointSymbol: "square",
        pointRadius: 2.5
      });
    }

    // Courbe dérivée dpH/dV
    if (state.showDerivative && (state.mode === "ph" || state.mode === "both") && state.measurements.length >= 3) {
      const derivPts = [];
      for (let i = 1; i < state.measurements.length - 1; i++) {
        const pPrev = state.measurements[i - 1];
        const pNext = state.measurements[i + 1];
        const dV = pNext.V - pPrev.V;
        if (dV > 0.01) {
          const dpH = pNext.pH - pPrev.pH;
          derivPts.push({ x: state.measurements[i].V, y: dpH / dV });
        }
      }
      if (derivPts.length > 0) {
        series.push({
          points: derivPts,
          color: "#9333EA",
          width: 1.5,
          dash: [4, 4]
        });
      }
    }

    // VÉRITABLE MÉTHODE DES TANGENTES PARALLÈLES
    if (state.showTangents && (state.mode === "ph" || state.mode === "both") && state.measurements.length >= 6) {
      const acid = getAcid();
      // Pente commune calculée avant le saut à VE - 3 mL
      const vBefore = Math.max(1.0, VE_theo - 3.0);
      const vAfter = Math.min(24.0, VE_theo + 3.0);
      const dV = 0.2;
      const slope = (pHExact(state.Ca, state.Va, state.Cb, vBefore + dV, acid.Ka) - pHExact(state.Ca, state.Va, state.Cb, vBefore - dV, acid.Ka)) / (2 * dV);

      const pH_before = pHExact(state.Ca, state.Va, state.Cb, vBefore, acid.Ka);
      const pH_after = pHExact(state.Ca, state.Va, state.Cb, vAfter, acid.Ka);

      // Tangente 1 (avant le saut)
      const t1 = [
        { x: vBefore - 5, y: pH_before - 5 * slope },
        { x: vBefore + 5, y: pH_before + 5 * slope }
      ];

      // Tangente 2 (après le saut, STRICTEMENT PARALLÈLE avec la même pente slope !)
      const t2 = [
        { x: vAfter - 5, y: pH_after - 5 * slope },
        { x: vAfter + 5, y: pH_after + 5 * slope }
      ];

      // Droite médiane équidistante (parallèle au milieu des deux)
      const vMid = (vBefore + vAfter) / 2;
      const pH_mid = (pH_before + pH_after) / 2;
      const tMed = [
        { x: vMid - 6, y: pH_mid - 6 * slope },
        { x: vMid + 6, y: pH_mid + 6 * slope }
      ];

      series.push({ points: t1, color: "#EA580C", width: 1.5, dash: [5, 3] });
      series.push({ points: t2, color: "#EA580C", width: 1.5, dash: [5, 3] });
      series.push({ points: tMed, color: "#16A34A", width: 1.5, dash: [3, 2] });

      // Marqueur du volume équivalent vertical
      series.push({
        points: [{ x: VE_theo, y: 0 }, { x: VE_theo, y: 14 }],
        color: "#DC2626",
        width: 1.5,
        dash: [2, 2]
      });
    }

    graph.setSeries(series);
  }

  function redrawTable() {
    const tbody = document.getElementById("pmat04-tbody");
    const countEl = document.getElementById("pmat04-count");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (countEl) countEl.textContent = state.measurements.length;

    state.measurements.forEach((m, idx) => {
      let derivStr = "—";
      if (idx > 0) {
        const prev = state.measurements[idx - 1];
        const dV = m.V - prev.V;
        if (dV > 0.001) {
          derivStr = ((m.pH - prev.pH) / dV).toFixed(2);
        }
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${m.V.toFixed(2)}</strong></td>
        <td>${m.pH.toFixed(2)}</td>
        <td>${derivStr}</td>
        <td>${m.sigma.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function addMeasurement(dV) {
    if (state.V >= 25.0) {
      if (state.tapOpen) toggleTap();
      return;
    }
    const newV = Math.min(25.0, roundToResolution(state.V + dV, 0.01));
    state.V = newV;

    const theo = getTheoreticalValues(state.V);
    // Bruit de mesure réaliste (pH-mètre précision ±0.02, conductimètre ±0.05)
    const pH_meas = roundToResolution(addNoise(theo.pH, 0.015, rng), 0.01);
    const sigma_meas = roundToResolution(addNoise(theo.sigma, 0.03, rng), 0.01);

    // Évite les doublons exacts de volume
    const exist = state.measurements.find(m => Math.abs(m.V - state.V) < 0.001);
    if (!exist) {
      state.measurements.push({ V: state.V, pH: pH_meas, sigma: sigma_meas });
      state.measurements.sort((a, b) => a.V - b.V);
    }

    drawSchema();
    redrawGraph();
    redrawTable();
  }

  function measureInitialPoint() {
    if (!state.measurements.some(m => m.V === 0)) {
      const theo0 = getTheoreticalValues(0);
      const pH0 = roundToResolution(addNoise(theo0.pH, 0.01, rng), 0.01);
      const s0 = roundToResolution(addNoise(theo0.sigma, 0.02, rng), 0.01);
      state.measurements.unshift({ V: 0, pH: pH0, sigma: s0 });
      drawSchema();
      redrawGraph();
      redrawTable();
    }
  }

  function toggleTap() {
    state.tapOpen = !state.tapOpen;
    const btn = document.getElementById("pmat04-btn-tap");
    if (!btn) return;
    if (state.tapOpen) {
      btn.textContent = "⏹ " + t("pmat04.tapClose");
      btn.classList.add("active");
      clearInterval(state.interval);
      state.interval = setInterval(() => {
        if (state.V >= 25.0) { toggleTap(); return; }
        addMeasurement(0.1);
      }, 350);
    } else {
      btn.textContent = "▶ " + t("pmat04.tapOpen");
      btn.classList.remove("active");
      clearInterval(state.interval);
    }
    drawSchema();
  }

  function resetAll() {
    clearInterval(state.interval);
    state.interval = null;
    state.tapOpen = false;
    state.V = 0;
    state.measurements = [];

    const tapBtn = document.getElementById("pmat04-btn-tap");
    if (tapBtn) {
      tapBtn.textContent = "▶ " + t("pmat04.tapOpen");
      tapBtn.classList.remove("active");
    }

    const acidSel = document.getElementById("pmat04-acid-sel");
    if (acidSel) state.acidKey = acidSel.value;
    state.Ca = getAcid().Ca_default;

    const cbInp = document.getElementById("pmat04-cb-input");
    if (cbInp) state.Cb = Math.max(0.01, parseFloat(cbInp.value) || 0.1);

    const vaInp = document.getElementById("pmat04-va-input");
    if (vaInp) state.Va = parseFloat(vaInp.value) || 10.0;

    const indSel = document.getElementById("pmat04-ind-sel");
    if (indSel) state.indicator = indSel.value;

    const modeSel = document.getElementById("pmat04-mode-sel");
    if (modeSel) state.mode = modeSel.value;

    const fb = document.getElementById("pmat04-eval-feedback");
    if (fb) fb.style.display = "none";

    drawSchema();
    redrawGraph();
    redrawTable();
  }

  // Écouteurs d'événements
  document.getElementById("pmat04-reset").addEventListener("click", resetAll);
  document.getElementById("pmat04-btn-zero").addEventListener("click", measureInitialPoint);
  document.getElementById("pmat04-btn-drop").addEventListener("click", () => addMeasurement(0.05));
  document.getElementById("pmat04-btn-add05").addEventListener("click", () => addMeasurement(0.5));
  document.getElementById("pmat04-btn-add1").addEventListener("click", () => addMeasurement(1.0));
  document.getElementById("pmat04-btn-tap").addEventListener("click", toggleTap);

  document.getElementById("pmat04-acid-sel").addEventListener("change", resetAll);
  document.getElementById("pmat04-ind-sel").addEventListener("change", (e) => {
    state.indicator = e.target.value;
    drawSchema();
  });
  document.getElementById("pmat04-mode-sel").addEventListener("change", (e) => {
    state.mode = e.target.value;
    drawSchema();
    redrawGraph();
  });
  document.getElementById("pmat04-va-input").addEventListener("input", (e) => {
    document.getElementById("pmat04-va-val").textContent = parseFloat(e.target.value).toFixed(1);
    resetAll();
  });
  document.getElementById("pmat04-cb-input").addEventListener("change", resetAll);

  // Outils graphiques
  const tangBtn = document.getElementById("pmat04-btn-tangents");
  tangBtn.addEventListener("click", () => {
    state.showTangents = !state.showTangents;
    tangBtn.classList.toggle("active", state.showTangents);
    redrawGraph();
  });

  const derivBtn = document.getElementById("pmat04-btn-deriv");
  derivBtn.addEventListener("click", () => {
    state.showDerivative = !state.showDerivative;
    derivBtn.classList.toggle("active", state.showDerivative);
    redrawGraph();
  });

  // Validation pédagogique ECE
  document.getElementById("pmat04-btn-validate").addEventListener("click", () => {
    const userVE = parseFloat(document.getElementById("pmat04-input-ve").value);
    const userCa = parseFloat(document.getElementById("pmat04-input-ca").value);
    const fb = document.getElementById("pmat04-eval-feedback");
    fb.style.display = "block";

    const trueVE = findEquivalence(state.Ca, state.Va, state.Cb);
    const trueCa = state.Ca;

    if (!isFinite(userVE) || !isFinite(userCa)) {
      fb.className = "feedback-msg error";
      fb.textContent = "Veuillez saisir une valeur numérique pour V_E et C_a.";
      return;
    }

    const errVE = Math.abs(userVE - trueVE) / trueVE;
    const errCa = Math.abs(userCa - trueCa) / trueCa;

    if (errVE < 0.05 && errCa < 0.08) {
      fb.className = "feedback-msg success";
      fb.innerHTML = `<strong>${t("pmat04.eval.correct")}</strong><br>
        • V_E attendu : ${trueVE.toFixed(2)} mL (votre saisie : ${userVE.toFixed(2)} mL)<br>
        • C_a attendu : ${trueCa.toFixed(3)} mol/L (votre calcul : ${userCa.toFixed(3)} mol/L)<br>
        • Réaction support : <code>${getAcid().eqEquation}</code>`;
    } else {
      fb.className = "feedback-msg warning";
      fb.innerHTML = `<strong>${t("pmat04.eval.incorrect")}</strong><br>
        • V_E attendu : ~${trueVE.toFixed(2)} mL (écart : ${(errVE * 100).toFixed(1)} %)<br>
        • C_a se déduit de la relation à l'équivalence : <code>C_a = (C_b × V_E) / V_a</code>.`;
    }
  });

  // Export du compte-rendu
  document.getElementById("pmat04-btn-report").addEventListener("click", () => {
    const trueVE = findEquivalence(state.Ca, state.Va, state.Cb);
    buildReport({
      activityTitle: t("pmat04.title"),
      inputs: [
        { label: "Espèce titrée", value: `${getAcid().formule} (pKa = ${getAcid().pKa})` },
        { label: "Prise d'essai V_a", value: `${state.Va.toFixed(1)} mL` },
        { label: "Concentration titrant C_b", value: `${state.Cb.toFixed(3)} mol/L` },
        { label: "Indicateur coloré", value: state.indicator }
      ],
      graphImg: canvas.toDataURL("image/png"),
      table: {
        headers: ["V versé (mL)", "pH mesuré", "Conductivité σ (mS/cm)"],
        rows: state.measurements.map(m => [m.V.toFixed(2), m.pH.toFixed(2), m.sigma.toFixed(2)])
      },
      conclusion: `
        <p><strong>Réaction support de titrage :</strong> ${getAcid().eqEquation}</p>
        <p><strong>Volume équivalent théorique :</strong> V_E = ${trueVE.toFixed(2)} mL</p>
        <p><strong>Concentration de la solution titrée :</strong> C_a = ${state.Ca.toFixed(3)} mol/L</p>
      `
    });
  });

  // Initialisation au montage
  resetAll();

  return function cleanup() {
    clearInterval(state.interval);
    graph.destroy();
  };
}
