import { t } from "../../i18n.js";
import { pHExact, pHExactBaseFaible, findEquivalence } from "./pmat04_titrage_ph.js";
import { Graph } from "../../graph.js";
import { formatSigFigs, makeRng } from "../../measure.js";

const INDICATEURS = {
  helianthine: { low: 3.1, high: 4.4, colorLow: "#C62828", colorHigh: "#F9A825" },
  bbt: { low: 6.0, high: 7.6, colorLow: "#F9A825", colorHigh: "#1565C0" },
  phenolphtaleine: { low: 8.2, high: 10.0, colorLow: "#FAFAFA", colorHigh: "#E91E63" }
};
export function colorAt(pH, indicatorKey) {
  const ind = INDICATEURS[indicatorKey];
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
  const state = { type: "acide_faible", Ca: 0.070, Va: 10.0, Cb: 0.050, indicator: "phenolphtaleine", validated: false, seed: Date.now() & 0xffffff };
  const rng = makeRng(state.seed);
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-title">${t("pmat03.title")}</div>
    <p>${t("pmat03.desc")}</p>
    <div class="field"><label for="pmat03-type">${t("pmat03.input.type")}</label>
      <select id="pmat03-type"><option value="acide_faible">${t("pmat03.type.acide_faible")}</option><option value="base_faible">${t("pmat03.type.base_faible")}</option></select></div>
    <div class="field"><label for="pmat03-ca">${t("pmat03.input.c")}</label><input id="pmat03-ca" type="number" step="0.001" min="0.001" max="1" value="${state.Ca}"></div>
    <div class="field"><label for="pmat03-va">${t("pmat03.input.v")}</label><input id="pmat03-va" type="number" step="0.01" min="1" max="50" value="${state.Va}"></div>
    <div class="field"><label for="pmat03-cb">${t("pmat03.input.ctitrant")}</label><input id="pmat03-cb" type="number" step="0.001" min="0.001" max="1" value="${state.Cb}"></div>
    <div class="field"><label for="pmat03-ind">${t("pmat04.input.indicator")}</label>
      <select id="pmat03-ind"><option value="helianthine">${t("pmat04.indicator.helianthine")}</option><option value="bbt">${t("pmat04.indicator.bbt")}</option><option value="phenolphtaleine">${t("pmat04.indicator.phenolphtaleine")}</option></select></div>
    <div class="actions"><button class="btn" id="pmat03-rand">${t("action.randomize")}</button><button class="btn-secondary" id="pmat03-reset">${t("action.reset")}</button></div>`;
  container.appendChild(panel);
  const graphWrap = document.createElement("div");
  graphWrap.className = "graph-wrap";
  const canvas = document.createElement("canvas");
  graphWrap.appendChild(canvas);
  container.appendChild(graphWrap);
  const answerPanel = document.createElement("div");
  answerPanel.className = "panel";
  answerPanel.innerHTML = `
    <div class="panel-title">${t("pmat03.answer.ve")}</div>
    <div class="field"><label for="pmat03-ve">${t("pmat03.answer.ve")}</label><input id="pmat03-ve" type="number" step="0.01" min="0" max="200"></div>
    <div class="actions"><button class="btn-check" id="pmat03-check">${t("action.check")}</button></div>
    <div id="pmat03-status" class="status" role="status"></div>
    <div id="pmat03-corr" class="panel" style="display:none;margin-top:8px;"></div>`;
  container.appendChild(answerPanel);
  const graph = new Graph(canvas, { xmin: 0, xmax: 30, ymin: 0, ymax: 14, xlabel: "V (mL)", ylabel: "pH", series: [] });
  function phAt(V) { return state.type === "acide_faible" ? pHExact(state.Ca, state.Va, state.Cb, V) : pHExactBaseFaible(state.Ca, state.Va, state.Cb, V); }
  function renderGraph() {
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const pts = [];
    const n = 120;
    const Vmax = VE * 2.2;
    for (let i = 0; i <= n; i++) { const V = Vmax * i / n; pts.push({ x: V, y: phAt(V) }); }
    const series = [];
    if (state.validated) {
      series.push({ points: pts, color: "#1565C0", width: 2 });
      series.push({ points: [{ x: VE, y: 0 }, { x: VE, y: 14 }], color: "#F57C00", width: 1, dash: [4, 4] });
    } else series.push({ points: pts.filter((p, i) => i % 6 === 0), color: "#90A4AE", width: 1.5 });
    graph.setSeries(series);
    graph.setBounds({ xmin: 0, xmax: Vmax, ymin: 0, ymax: 14 });
  }
  function readInputs() {
    state.type = document.getElementById("pmat03-type").value;
    state.indicator = document.getElementById("pmat03-ind").value;
    const ca = parseFloat(document.getElementById("pmat03-ca").value);
    const va = parseFloat(document.getElementById("pmat03-va").value);
    const cb = parseFloat(document.getElementById("pmat03-cb").value);
    if (isFinite(ca)) state.Ca = ca; if (isFinite(va)) state.Va = va; if (isFinite(cb)) state.Cb = cb;
  }
  function refresh() {
    readInputs(); renderGraph();
    const ind = INDICATEURS[state.indicator];
    if (ind) { const VE = findEquivalence(state.Ca, state.Va, state.Cb); graphWrap.style.borderLeft = "6px solid " + colorAt(phAt(VE), state.indicator); }
  }
  function randomize() {
    state.type = rng() < 0.5 ? "acide_faible" : "base_faible";
    state.Ca = Number((0.020 + rng() * 0.180).toFixed(3));
    state.Va = Number((5 + rng() * 15).toFixed(1));
    state.Cb = Number((0.010 + rng() * 0.190).toFixed(3));
    state.indicator = ["helianthine", "bbt", "phenolphtaleine"][Math.floor(rng() * 3)];
    document.getElementById("pmat03-type").value = state.type;
    document.getElementById("pmat03-ca").value = state.Ca;
    document.getElementById("pmat03-va").value = state.Va;
    document.getElementById("pmat03-cb").value = state.Cb;
    document.getElementById("pmat03-ind").value = state.indicator;
    state.validated = false;
    document.getElementById("pmat03-status").className = "status"; document.getElementById("pmat03-status").textContent = "";
    document.getElementById("pmat03-corr").style.display = "none"; refresh();
  }
  function check() {
    const ans = parseFloat(document.getElementById("pmat03-ve").value);
    const VE = findEquivalence(state.Ca, state.Va, state.Cb);
    const status = document.getElementById("pmat03-status");
    if (!isFinite(ans)) { status.className = "status status-hint"; status.textContent = t("status.incorrect"); return; }
    state.validated = true;
    if (Math.abs(ans - VE) <= 0.05) { status.className = "status status-ok"; status.textContent = t("status.correct") + " (" + formatSigFigs(VE, 3) + " mL)"; }
    else { status.className = "status status-err"; status.textContent = t("status.incorrect") + " - V_E = " + formatSigFigs(VE, 3) + " mL"; }
    document.getElementById("pmat03-corr").style.display = "block";
    document.getElementById("pmat03-corr").innerHTML = "<strong>" + t("report.correction") + " :</strong> V_E = C*V/C' = " + formatSigFigs(VE, 3) + " mL.";
    renderGraph();
  }
  document.getElementById("pmat03-rand").addEventListener("click", randomize);
  document.getElementById("pmat03-reset").addEventListener("click", () => {
    state.validated = false; document.getElementById("pmat03-ve").value = "";
    document.getElementById("pmat03-status").className = "status"; document.getElementById("pmat03-status").textContent = "";
    document.getElementById("pmat03-corr").style.display = "none"; refresh();
  });
  document.getElementById("pmat03-check").addEventListener("click", check);
  ["pmat03-type", "pmat03-ca", "pmat03-va", "pmat03-cb", "pmat03-ind"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.validated = false; document.getElementById("pmat03-corr").style.display = "none"; refresh();
    });
  });
  refresh();
  return function cleanup() { graph.destroy(); };
}
