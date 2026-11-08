import { t } from "../../i18n.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng, addNoise } from "../../measure.js";

const ESPECES = {
  kmno4: { label: "KMnO4", epsL: 2300, lambdaMax: 525, width: 40, color: "#7B1FA2" },
  cuso4: { label: "CuSO4", epsL: 12.5, lambdaMax: 800, width: 80, color: "#1976D2" },
  betadine: { label: "Betadine", epsL: 900, lambdaMax: 460, width: 70, color: "#8D6E63" }
};

export function absorbance(lambdaNm, especeKey, CmolL) {
  const e = ESPECES[especeKey];
  if (!e) return 0;
  const g = Math.exp(-Math.pow(lambdaNm - e.lambdaMax, 2) / (2 * Math.pow(e.width, 2)));
  return e.epsL * CmolL * g;
}
export function absorbanceAtMax(especeKey, CmolL) {
  const e = ESPECES[especeKey];
  if (!e) return 0;
  return e.epsL * CmolL;
}
export const id = "pmat01";
export const level = "premiere";
export const domain = "matiere";
export const theme = "suivi";
export const titleKey = "pmat01.title";

export function mount(container) {
  const state = { espece: "kmno4", lambda: 525, stockC: 1.0e-3, dilutions: [{ V: 2.0, fiole: 50.0 }], validated: false, seed: Date.now() & 0xffffff, etalons: [] };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat01.title")}</div>
    <p>${t("pmat01.desc")}</p>
    <div class="field"><label for="pmat01-esp">${t("pmat01.input.species")}</label>
      <select id="pmat01-esp"><option value="kmno4">KMnO4</option><option value="cuso4">CuSO4</option><option value="betadine">${t("pmat01.species.betadine")}</option></select></div>
    <div class="field"><label for="pmat01-lambda">${t("pmat01.input.lambda")}</label>
      <input id="pmat01-lambda" type="number" step="1" min="400" max="900" value="${state.lambda}"></div>
    <div class="field"><label for="pmat01-stock">${t("pmat01.input.stockC")}</label>
      <input id="pmat01-stock" type="number" step="1e-6" min="1e-6" max="0.1" value="${state.stockC}"></div>
    <div class="panel-title" style="margin-top:12px">${t("pmat01.dilutions")}</div>
    <div id="pmat01-dilutions"></div>
    <div class="actions">
      <button class="btn-secondary" id="pmat01-adddil">${t("pmat01.addDilution")}</button>
      <button class="btn" id="pmat01-measure">${t("pmat01.measureAll")}</button>
      <button class="btn" id="pmat01-rand">${t("action.randomize")}</button>
      <button class="btn-secondary" id="pmat01-reset">${t("action.reset")}</button>
    </div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat01.answer.title")}</div>
    <div class="field"><label for="pmat01-unknown">${t("pmat01.input.unknownA")}</label>
      <input id="pmat01-unknown" type="number" step="0.001" min="0" max="3"></div>
    <div class="field"><label for="pmat01-answer">${t("pmat01.answer.cunknown")}</label>
      <input id="pmat01-answer" type="number" step="1e-6" min="0" max="1"></div>
    <div class="actions"><button class="btn-check" id="pmat01-check">${t("action.check")}</button></div>
    <div id="pmat01-status" class="status" role="status"></div>
    <div id="pmat01-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 2e-3, ymin: 0, ymax: 3, xlabel: "C (mol/L)", ylabel: "A", series: [] });
  function renderDilutions() {
    const wrap = document.getElementById("pmat01-dilutions");
    wrap.innerHTML = "";
    state.dilutions.forEach((d, i) => {
      const row = document.createElement("div");
      row.className = "field";
      row.innerHTML = `<label>${t("pmat01.dilution")} ${i + 1}</label>
        <div style="display:flex;gap:6px;">
          <input type="number" step="0.01" min="0.1" max="50" value="${d.V}" data-i="${i}" data-k="V" aria-label="${t("pmat01.input.pipette")}">
          <span style="align-self:center">mL -></span>
          <input type="number" step="0.1" min="1" max="1000" value="${d.fiole}" data-i="${i}" data-k="fiole" aria-label="${t("pmat01.input.flask")}">
          <span style="align-self:center">mL</span>
          <button type="button" class="btn-secondary" data-del="${i}">x</button>
        </div>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll("input").forEach(inp => {
      inp.addEventListener("input", () => {
        const i = +inp.dataset.i, k = inp.dataset.k;
        const v = parseFloat(inp.value);
        if (isFinite(v)) state.dilutions[i][k] = v;
      });
    });
    wrap.querySelectorAll("button[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.dilutions.splice(+btn.dataset.del, 1);
        if (state.dilutions.length === 0) state.dilutions.push({ V: 2.0, fiole: 50.0 });
        renderDilutions();
      });
    });
  }
  function computeEtalons() {
    return state.dilutions.map(d => {
      const C = state.stockC * d.V / d.fiole;
      const A = absorbanceAtMax(state.espece, C);
      return { C, A: Math.max(0, addNoise(A, 0.002, rng, 1)) };
    });
  }
  function renderGraph() {
    const etalons = state.etalons.length ? state.etalons : computeEtalons();
    const series = [];
    if (state.validated) {
      const e = ESPECES[state.espece];
      const Cmax = Math.max(...etalons.map(x => x.C)) * 1.1 || 1e-3;
      series.push({ points: [{ x: 0, y: 0 }, { x: Cmax, y: e.epsL * Cmax }], color: "#1565C0", width: 2 });
    }
    series.push({ points: etalons.map(x => ({ x: x.C, y: x.A })), color: "#C62828", width: 0 });
    graph.setSeries(series);
    const Cmax = Math.max(...etalons.map(x => x.C), 1e-6) * 1.1;
    const Amax = Math.max(...etalons.map(x => x.A), 0.1) * 1.2;
    graph.setBounds({ xmin: 0, xmax: Cmax, ymin: 0, ymax: Amax });
  }
  function readInputs() {
    state.espece = document.getElementById("pmat01-esp").value;
    const l = parseFloat(document.getElementById("pmat01-lambda").value);
    if (isFinite(l)) state.lambda = l;
    const s = parseFloat(document.getElementById("pmat01-stock").value);
    if (isFinite(s)) state.stockC = s;
  }
  function refresh() { readInputs(); renderGraph(); }
  function randomize() {
    const keys = Object.keys(ESPECES);
    state.espece = keys[Math.floor(rng() * keys.length)];
    state.stockC = Number((1e-4 + rng() * 9e-4).toExponential(2));
    state.dilutions = [{ V: Number((1 + rng() * 4).toFixed(1)), fiole: 50 }, { V: Number((5 + rng() * 10).toFixed(1)), fiole: 100 }];
    document.getElementById("pmat01-esp").value = state.espece;
    document.getElementById("pmat01-stock").value = state.stockC;
    renderDilutions();
    state.validated = false; state.etalons = [];
    document.getElementById("pmat01-status").className = "status"; document.getElementById("pmat01-status").textContent = "";
    document.getElementById("pmat01-corr").style.display = "none";
    refresh();
  }
  function check() {
    const A = parseFloat(document.getElementById("pmat01-unknown").value);
    const ans = parseFloat(document.getElementById("pmat01-answer").value);
    const status = document.getElementById("pmat01-status");
    const e = ESPECES[state.espece];
    if (!isFinite(A) || !isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    const Ctheo = A / e.epsL;
    state.validated = true;
    const diff = Math.abs(ans - Ctheo) / Ctheo;
    if (diff <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (C = " + formatSigFigs(Ctheo, 3) + " mol/L)"; }
    else { status.className = "status status-err"; let msg = t("status.incorrect") + " - C = " + formatSigFigs(Ctheo, 3) + " mol/L"; if (diff > 50) msg += " - " + t("status.powerError"); status.textContent = msg; }
    const corr = document.getElementById("pmat01-corr");
    corr.style.display = "block";
    corr.innerHTML = "<strong>" + t("report.correction") + " :</strong> C = A / (eps*l) = " + A + " / " + e.epsL + " = " + formatSigFigs(Ctheo, 3) + " mol/L.";
    renderGraph();
  }
  document.getElementById("pmat01-adddil").addEventListener("click", () => { state.dilutions.push({ V: 5.0, fiole: 100.0 }); renderDilutions(); });
  document.getElementById("pmat01-measure").addEventListener("click", () => { state.etalons = computeEtalons(); renderGraph(); });
  document.getElementById("pmat01-rand").addEventListener("click", randomize);
  document.getElementById("pmat01-reset").addEventListener("click", () => {
    state.validated = false; state.etalons = [];
    document.getElementById("pmat01-unknown").value = ""; document.getElementById("pmat01-answer").value = "";
    document.getElementById("pmat01-status").className = "status"; document.getElementById("pmat01-status").textContent = "";
    document.getElementById("pmat01-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat01-check").addEventListener("click", check);
  ["pmat01-esp", "pmat01-lambda", "pmat01-stock"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; state.etalons = [];
      document.getElementById("pmat01-corr").style.display = "none"; refresh();
    });
  });
  renderDilutions();
  refresh();
  return function cleanup() { graph.destroy(); };
}
